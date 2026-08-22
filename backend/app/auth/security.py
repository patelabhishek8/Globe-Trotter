import datetime
import os
from typing import Any, Optional, Union
import bcrypt
import jwt

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "globetrotter-super-secure-jwt-secret-key-2026-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        # Truncate to 72 bytes if needed per bcrypt spec
        plain_bytes = plain_password.encode("utf-8")[:72]
        hash_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(plain_bytes, hash_bytes)
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    # Truncate to 72 bytes if needed per bcrypt spec
    plain_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(plain_bytes, salt)
    return hashed.decode("utf-8")


def create_access_token(subject: Union[str, Any], expires_delta: Optional[datetime.timedelta] = None) -> str:
    if expires_delta:
        expire = datetime.datetime.utcnow() + expires_delta
    else:
        expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except Exception:
        return None
