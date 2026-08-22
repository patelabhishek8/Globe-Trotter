import secrets
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.auth.deps import get_current_user, get_db
from backend.app.auth.security import create_access_token, get_password_hash, verify_password
from backend.app.models.models import Notification, User
from backend.app.services.email_service import send_password_reset_email
from backend.app.schemas.schemas import (
    ForgotPasswordRequest,
    ResetPasswordRequest,
    Token,
    UserLogin,
    UserPasswordChange,
    UserProfileUpdate,
    UserRegister,
    UserResponse,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

# In-memory store for reset codes
RESET_CODES: dict[str, str] = {}


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register_user(user_in: UserRegister, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user_in.email.lower()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists.",
        )

    # If user uploads a photo, use it; otherwise leave as None/empty for a blank character avatar
    photo = user_in.profile_photo.strip() if user_in.profile_photo and user_in.profile_photo.strip() else None

    user = User(
        email=user_in.email.lower(),
        hashed_password=get_password_hash(user_in.password),
        first_name=user_in.first_name,
        last_name=user_in.last_name,
        phone=user_in.phone or "",
        city=user_in.city or "",
        country=user_in.country or "India",
        travel_style=user_in.travel_style or "Standard",
        budget_preference=user_in.budget_preference or "Moderate",
        interests=user_in.interests or "History,Culture,Food",
        profile_photo=photo,
        role="user",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Welcome notification
    notif = Notification(
        user_id=user.id,
        title="Welcome to GlobeTrotter! 🌍",
        message="Start planning your dream Indian itinerary today by clicking 'Plan a New Trip'.",
        type="success",
    )
    db.add(notif)
    db.commit()

    token = create_access_token(user.id)
    return Token(access_token=token, token_type="bearer", user=UserResponse.model_validate(user))


@router.post("/login", response_model=Token)
def login_user(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email.lower()).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password. Please check your credentials.",
        )

    token = create_access_token(user.id)
    return Token(access_token=token, token_type="bearer", user=UserResponse.model_validate(user))


@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.lower()).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found with this email address.",
        )

    # Generate a random 6-digit numeric verification code
    code = f"{secrets.randbelow(900000) + 100000}"
    RESET_CODES[user.email.lower()] = code

    # Send the code strictly to the user's email
    send_password_reset_email(user.email, code)

    # Record notification for the user
    notif = Notification(
        user_id=user.id,
        title="Password Reset Requested 🔑",
        message="A password reset verification code was sent to your email.",
        type="info",
    )
    db.add(notif)
    db.commit()

    # DO NOT return the verification code in the HTTP API response
    return {
        "message": f"A 6-digit verification code has been sent to {user.email}. Please check your email inbox to verify your identity.",
        "email": user.email,
    }


@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.lower()).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found with this email address.",
        )

    if not req.code or not req.code.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code is required to reset your password.",
        )

    stored_code = RESET_CODES.get(user.email.lower())
    if not stored_code or req.code.strip() != stored_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code. Please check your email and try again.",
        )

    if len(req.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 6 characters.",
        )

    # Verification successful -> Update password in the database
    user.hashed_password = get_password_hash(req.new_password)
    del RESET_CODES[user.email.lower()]

    notif = Notification(
        user_id=user.id,
        title="Password Updated Successfully ✅",
        message="Your password was reset successfully. You can now log in with your new password.",
        type="success",
    )
    db.add(notif)
    db.commit()

    return {"message": "Your password has been successfully verified and updated. You can now log in."}


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)


@router.put("/profile", response_model=UserResponse)
def update_profile(
    profile_data: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    for field, value in profile_data.model_dump(exclude_unset=True).items():
        setattr(current_user, field, value)

    db.commit()
    db.refresh(current_user)
    return UserResponse.model_validate(current_user)


@router.put("/change-password")
def change_password(
    data: UserPasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(data.old_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password entered is incorrect.",
        )
    current_user.hashed_password = get_password_hash(data.new_password)
    db.commit()
    return {"message": "Password updated successfully in database."}
