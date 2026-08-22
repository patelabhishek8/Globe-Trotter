import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Lock,
  Camera,
  Upload,
  KeyRound,
  LogOut,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { api } from '../services/api';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Card } from '../components/common/Card';
import { Modal } from '../components/common/Modal';

export const UserProfilePage: React.FC = () => {
  const { user, updateUser, logout } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profileData, setProfileData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
    city: user?.city || '',
    country: user?.country || 'India',
    language: user?.language || 'English',
    travel_style: user?.travel_style || 'Standard',
    budget_preference: user?.budget_preference || 'Moderate',
    interests: user?.interests || 'History,Culture,Food',
    profile_photo: user?.profile_photo || '',
  });

  // Sync state when user profile changes
  useEffect(() => {
    if (user) {
      setProfileData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
        city: user.city || '',
        country: user.country || 'India',
        language: user.language || 'English',
        travel_style: user.travel_style || 'Standard',
        budget_preference: user.budget_preference || 'Moderate',
        interests: user.interests || 'History,Culture,Food',
        profile_photo: user.profile_photo || '',
      });
    }
  }, [user]);

  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Reset Password Popup State
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isUpdatingPass, setIsUpdatingPass] = useState(false);
  const [passError, setPassError] = useState('');

  const interestOptions = [
    'Food',
    'History',
    'Nature',
    'Adventure',
    'Shopping',
    'Culture',
    'Photography',
    'Nightlife',
    'Family',
  ];

  const handleInterestToggle = (item: string) => {
    const list = profileData.interests.split(',').map((s) => s.trim()).filter(Boolean);
    let updated: string[];
    if (list.includes(item)) {
      updated = list.filter((i) => i !== item);
    } else {
      updated = [...list, item];
    }
    setProfileData({ ...profileData, interests: updated.join(',') });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast('error', 'Image file size must be under 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setProfileData((prev) => ({ ...prev, profile_photo: result }));
      showToast('success', 'New photo loaded! Click "Save Profile Changes" to update.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setProfileData((prev) => ({ ...prev, profile_photo: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    showToast('info', 'Profile photo removed. Blank character will be used.');
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsUpdatingProfile(true);
      await updateUser({
        ...profileData,
        profile_photo: profileData.profile_photo || '',
      });
      showToast('success', 'Profile and picture updated successfully in database!');
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update profile.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePasswordModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      setPassError('Please enter your current password.');
      return;
    }
    if (newPassword.length < 6) {
      setPassError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPassError('New password and confirm password do not match.');
      return;
    }

    try {
      setIsUpdatingPass(true);
      setPassError('');
      const res = await api.changePassword({
        old_password: currentPassword,
        new_password: newPassword,
      });

      showToast('success', res.message || 'Password updated successfully in database!');
      setIsResetModalOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      setPassError(err.message || 'Failed to update password. Please check your current password.');
    } finally {
      setIsUpdatingPass(false);
    }
  };

  const selectedInterests = profileData.interests.split(',').map((s) => s.trim());
  const initial = profileData.first_name ? profileData.first_name.charAt(0).toUpperCase() : (user?.first_name?.charAt(0).toUpperCase() || '');

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-primary">Profile & Preferences</h1>
          <p className="text-xs text-ink-secondary">Manage your personal details, profile picture, and account security</p>
        </div>

        {/* Action Buttons: Reset Password & Sign Out */}
        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<KeyRound className="w-3.5 h-3.5 text-brand" />}
            onClick={() => {
              setPassError('');
              setCurrentPassword('');
              setNewPassword('');
              setConfirmNewPassword('');
              setIsResetModalOpen(true);
            }}
          >
            Reset Password
          </Button>

          <Button
            variant="secondary"
            size="sm"
            leftIcon={<LogOut className="w-3.5 h-3.5 text-rose-600" />}
            onClick={() => {
              logout();
              navigate('/login');
            }}
          >
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main Profile & Picture Card */}
      <Card padding="lg" className="border border-borderLight shadow-sm space-y-6">
        {/* Profile Picture Header (Photo or Blank Character) */}
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-borderLight bg-slate-50/50 p-4 rounded-xl">
          {/* Avatar Preview */}
          <div className="relative group shrink-0">
            {profileData.profile_photo ? (
              <img
                src={profileData.profile_photo}
                alt="Profile Avatar"
                className="w-24 h-24 rounded-full object-cover border-3 border-brand ring-4 ring-brand/10 shadow-md"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-slate-200 border-3 border-slate-300 text-slate-600 flex items-center justify-center font-bold text-3xl shadow-inner">
                {initial ? initial : <UserIcon className="w-10 h-10 text-slate-400" />}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              title="Upload New Photo"
            >
              <Camera className="w-6 h-6 mb-0.5" />
              <span className="text-[10px] font-bold">Edit</span>
            </button>
          </div>

          <div className="flex-1 space-y-2 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-extrabold text-ink-primary">
                  {user?.first_name} {user?.last_name}
                </h2>
                <p className="text-xs text-ink-secondary">{user?.email}</p>
              </div>
              <span className="inline-block self-center sm:self-start px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-brand-50 text-brand border border-brand-200">
                {user?.role} Account
              </span>
            </div>

            {/* Photo Upload Controls */}
            <div className="pt-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  leftIcon={<Upload className="w-3.5 h-3.5" />}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {profileData.profile_photo ? 'Change Photo' : 'Upload Profile Photo'}
                </Button>

                {profileData.profile_photo && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
                    onClick={handleRemovePhoto}
                  >
                    Remove Photo
                  </Button>
                )}
              </div>
              <p className="text-[11px] text-ink-secondary mt-1">
                {profileData.profile_photo
                  ? 'Custom photo uploaded. Click Save to persist.'
                  : 'Blank character avatar active. You can upload an image from your device.'}
              </p>
            </div>
          </div>
        </div>

        {/* Profile Information Form */}
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="First Name"
              value={profileData.first_name}
              onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })}
              required
            />
            <Input
              label="Last Name"
              value={profileData.last_name}
              onChange={(e) => setProfileData({ ...profileData, last_name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Phone Number"
              value={profileData.phone}
              onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
              leftIcon={<Phone className="w-4 h-4" />}
            />
            <Input
              label="City"
              value={profileData.city}
              onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
              leftIcon={<MapPin className="w-4 h-4" />}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Language"
              value={profileData.language}
              onChange={(e) => setProfileData({ ...profileData, language: e.target.value })}
              options={[
                { value: 'English', label: 'English' },
                { value: 'Hindi', label: 'Hindi (हिंदी)' },
                { value: 'Gujarati', label: 'Gujarati (ગુજરાતી)' },
                { value: 'Marathi', label: 'Marathi (मराठी)' },
                { value: 'Tamil', label: 'Tamil (தமிழ்)' },
              ]}
            />
            <Select
              label="Default Travel Style"
              value={profileData.travel_style}
              onChange={(e) => setProfileData({ ...profileData, travel_style: e.target.value })}
              options={[
                { value: 'Budget', label: 'Budget' },
                { value: 'Standard', label: 'Standard' },
                { value: 'Premium', label: 'Premium' },
                { value: 'Luxury', label: 'Luxury' },
              ]}
            />
            <Select
              label="Budget Preference"
              value={profileData.budget_preference}
              onChange={(e) => setProfileData({ ...profileData, budget_preference: e.target.value })}
              options={[
                { value: 'Budget', label: 'Budget (₹)' },
                { value: 'Moderate', label: 'Moderate (₹₹)' },
                { value: 'Luxury', label: 'Luxury (₹₹₹)' },
              ]}
            />
          </div>

          {/* Interests Pills */}
          <div className="space-y-2 pt-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-secondary">
              Travel Interests & Preferences
            </label>
            <div className="flex flex-wrap gap-2">
              {interestOptions.map((opt) => {
                const isSelected = selectedInterests.includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleInterestToggle(opt)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                      isSelected
                        ? 'bg-brand text-white border-brand shadow-xs'
                        : 'bg-slate-50 text-ink-secondary border-borderLight hover:border-gray-300'
                    }`}
                  >
                    {isSelected ? `✓ ${opt}` : `+ ${opt}`}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-borderLight flex justify-end">
            <Button type="submit" variant="primary" isLoading={isUpdatingProfile}>
              Save Profile Changes
            </Button>
          </div>
        </form>
      </Card>

      {/* ================= RESET PASSWORD MODAL POPUP ================= */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-brand" />
            <span>Reset Account Password</span>
          </div>
        }
        maxWidth="sm"
      >
        <form onSubmit={handlePasswordModalSubmit} className="space-y-4">
          <p className="text-xs text-ink-secondary leading-relaxed">
            Enter your current password and your new password. This will update your credentials in the database immediately.
          </p>

          {passError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
              {passError}
            </div>
          )}

          <Input
            label="Current Password *"
            type="password"
            placeholder="••••••••"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
            required
          />

          <Input
            label="New Password *"
            type="password"
            placeholder="Minimum 6 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
            required
          />

          <Input
            label="Confirm New Password *"
            type="password"
            placeholder="Repeat new password"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
            required
          />

          <div className="pt-3 border-t border-borderLight flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsResetModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isUpdatingPass}
            >
              Update Password
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
