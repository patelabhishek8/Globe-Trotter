import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Compass, User as UserIcon, Mail, Lock, Phone, MapPin, ArrowRight, Camera, Upload, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    city: '',
    country: 'India',
    password: '',
    confirm_password: '',
    travel_style: 'Standard',
    budget_preference: 'Moderate',
    interests: 'History,Culture,Food',
    additional_info: '',
    profile_photo: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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

  const handleInterestToggle = (interest: string) => {
    const list = formData.interests.split(',').map((s) => s.trim()).filter(Boolean);
    let updated: string[];
    if (list.includes(interest)) {
      updated = list.filter((i) => i !== interest);
    } else {
      updated = [...list, interest];
    }
    setFormData({ ...formData, interests: updated.join(',') });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('Image file size must be under 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setFormData((prev) => ({ ...prev, profile_photo: result }));
      showToast('success', 'Profile picture selected.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setFormData((prev) => ({ ...prev, profile_photo: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.first_name || !formData.last_name || !formData.email || !formData.password) {
      setError('Please fill in all required fields.');
      return;
    }
    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match.');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      await register({
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        city: formData.city,
        country: formData.country,
        travel_style: formData.travel_style,
        budget_preference: formData.budget_preference,
        interests: formData.interests,
        additional_info: formData.additional_info,
        profile_photo: formData.profile_photo || null,
      });
      showToast('success', 'Account created successfully! Welcome to GlobeTrotter.');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedInterests = formData.interests.split(',').map((s) => s.trim());
  const initial = formData.first_name ? formData.first_name.charAt(0).toUpperCase() : '';

  return (
    <div className="min-h-screen bg-canvas py-10 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-2xl w-full bg-surface rounded-card-lg border border-borderLight shadow-xl p-8 sm:p-10 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-borderLight pb-4">
          <div className="w-10 h-10 rounded-xl bg-brand text-white flex items-center justify-center shadow-xs">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-ink-primary">Create your GlobeTrotter account</h2>
            <p className="text-xs text-ink-secondary">
              Personalize your smart multi-city travel itineraries across India.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* ================= PROFILE PICTURE SECTION (BLANK CHARACTER BY DEFAULT) ================= */}
          <div className="p-4 rounded-xl bg-slate-50 border border-borderLight space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-primary">
                Profile Picture (Optional)
              </label>
              <span className="text-[11px] text-ink-secondary">Upload from device or leave blank</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Avatar Preview or Blank Character */}
              <div className="relative group shrink-0">
                {formData.profile_photo ? (
                  <img
                    src={formData.profile_photo}
                    alt="Profile Avatar Preview"
                    className="w-16 h-16 rounded-full object-cover border-2 border-brand ring-4 ring-brand/10 shadow-sm"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-slate-200 border-2 border-slate-300 text-slate-500 flex items-center justify-center shadow-inner font-bold text-xl">
                    {initial ? initial : <UserIcon className="w-7 h-7 text-slate-400" />}
                  </div>
                )}
              </div>

              {/* Upload Controls */}
              <div className="flex-1 space-y-1.5 w-full text-center sm:text-left">
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
                    variant="secondary"
                    size="sm"
                    leftIcon={<Upload className="w-3.5 h-3.5 text-brand" />}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {formData.profile_photo ? 'Change Photo' : 'Upload Profile Photo'}
                  </Button>

                  {formData.profile_photo && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
                      onClick={handleRemovePhoto}
                    >
                      Remove
                    </Button>
                  )}
                </div>
                <p className="text-[11px] text-ink-secondary">
                  If left unselected, a blank character avatar will be displayed.
                </p>
              </div>
            </div>
          </div>

          {/* Two column name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="First Name *"
              placeholder="e.g. Aarav"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              required
            />
            <Input
              label="Last Name *"
              placeholder="e.g. Sharma"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              required
            />
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Email Address *"
              type="text"
              placeholder="name@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />
            <Input
              label="Phone Number"
              type="tel"
              placeholder="+91 98765 43210"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              leftIcon={<Phone className="w-4 h-4" />}
            />
          </div>

          {/* City & Country */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="City"
              placeholder="e.g. Mumbai"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              leftIcon={<MapPin className="w-4 h-4" />}
            />
            <Input
              label="Country"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            />
          </div>

          {/* Travel Style & Budget Preference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Travel Style"
              value={formData.travel_style}
              onChange={(e) => setFormData({ ...formData, travel_style: e.target.value })}
              options={[
                { value: 'Budget', label: 'Budget (Backpacker / Value)' },
                { value: 'Standard', label: 'Standard (Comfortable & Balanced)' },
                { value: 'Premium', label: 'Premium (High Comfort)' },
                { value: 'Luxury', label: 'Luxury (5-Star & Heritage)' },
              ]}
            />
            <Select
              label="Budget Preference"
              value={formData.budget_preference}
              onChange={(e) => setFormData({ ...formData, budget_preference: e.target.value })}
              options={[
                { value: 'Budget', label: 'Budget Tier (₹)' },
                { value: 'Moderate', label: 'Moderate Tier (₹₹)' },
                { value: 'Luxury', label: 'Luxury Tier (₹₹₹)' },
              ]}
            />
          </div>

          {/* Interests Pills */}
          <div className="space-y-1.5 pt-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-secondary">
              Travel Interests & Hobbies (Select multiple)
            </label>
            <div className="flex flex-wrap gap-2 pt-1">
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

          {/* Password & Confirm Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <Input
              label="Password *"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />
            <Input
              label="Confirm Password *"
              type="password"
              placeholder="••••••••"
              value={formData.confirm_password}
              onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />
          </div>

          {/* Submit */}
          <div className="pt-3">
            <Button
              type="submit"
              variant="primary"
              className="w-full py-2.5"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Create Account & Start Planning
            </Button>
          </div>
        </form>

        <div className="text-center text-xs text-ink-secondary pt-2 border-t border-borderLight">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-brand hover:underline">
            Log in here
          </Link>
        </div>
      </div>
    </div>
  );
};
