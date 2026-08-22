import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Compass, Mail, Lock, ArrowRight, KeyRound, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { api } from '../services/api';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Modal } from '../components/common/Modal';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Forgot / Reset Password Modal State
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [resetEmail, setResetEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccessMessage, setResetSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      await login(email, password);
      showToast('success', 'Logged in successfully! Welcome back.');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 1: Send verification code to user's email
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      setResetError('Please enter your registered email address.');
      return;
    }

    try {
      setIsResetting(true);
      setResetError('');
      const res = await api.forgotPassword(resetEmail.trim());
      setResetSuccessMessage(res.message || `Verification code sent to ${resetEmail.trim()}. Please check your email inbox.`);
      setVerificationCode('');
      setForgotStep(2);
      showToast('info', 'Verification code sent to your email inbox.');
    } catch (err: any) {
      setResetError(err.message || 'Could not find an account with that email.');
    } finally {
      setIsResetting(false);
    }
  };

  // Step 2: Verify code from email and update password in database
  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode.trim()) {
      setResetError('Please enter the 6-digit verification code sent to your email.');
      return;
    }
    if (newPassword.length < 6) {
      setResetError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setResetError('Passwords do not match.');
      return;
    }

    try {
      setIsResetting(true);
      setResetError('');
      const res = await api.resetPassword({
        email: resetEmail.trim(),
        new_password: newPassword,
        code: verificationCode.trim(),
      });

      showToast('success', res.message || 'Password verified and updated in database! You can now log in.');
      setEmail(resetEmail.trim());
      setPassword('');
      setIsForgotModalOpen(false);
      setForgotStep(1);
      setVerificationCode('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      setResetError(err.message || 'Verification failed. Please check your code.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-4xl bg-surface rounded-card-lg border border-borderLight shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
        {/* Left Side: Authentic Indian Destination Visual */}
        <div className="relative h-64 md:h-auto bg-slate-900 overflow-hidden flex flex-col justify-between p-8 text-white">
          <img
            src="https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=80"
            alt="Hawa Mahal Jaipur"
            className="absolute inset-0 w-full h-full object-cover object-center opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-primary/90 via-ink-primary/40 to-transparent" />

          {/* Top Branding */}
          <div className="relative z-10 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand text-white flex items-center justify-center shadow-xs">
              <Compass className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-lg tracking-tight">GlobeTrotter</span>
          </div>

          {/* Bottom Pitch */}
          <div className="relative z-10 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300">Smart Itineraries</span>
            <h2 className="text-2xl font-bold leading-tight">Plan smarter. <br />Travel better.</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Experience seamless multi-city routing, real-time budget analytics, and conflict-free schedules across India.
            </p>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="p-8 sm:p-10 flex flex-col justify-between">
          <div>
            <div className="mb-6">
              <h3 className="text-xl font-bold text-ink-primary">Sign in to your account</h3>
              <p className="text-xs text-ink-secondary mt-1">
                Enter your registered email and password to access your itineraries.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email Address"
                type="text"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
                required
              />

              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                required
              />

              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(email || '');
                    setForgotStep(1);
                    setResetError('');
                    setResetSuccessMessage('');
                    setIsForgotModalOpen(true);
                  }}
                  className="font-semibold text-brand hover:text-brand-700 hover:underline transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                isLoading={isLoading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Sign In
              </Button>
            </form>
          </div>

          <div className="mt-8 pt-6 border-t border-borderLight text-center text-xs text-ink-secondary">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-brand hover:underline">
              Create an account
            </Link>
          </div>
        </div>
      </div>

      {/* ================= FORGOT / RESET PASSWORD MODAL ================= */}
      <Modal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-brand" />
            <span>Reset Password via Email</span>
          </div>
        }
        maxWidth="md"
      >
        <div className="space-y-4">
          {resetError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
              {resetError}
            </div>
          )}

          {forgotStep === 1 ? (
            <form onSubmit={handleRequestReset} className="space-y-4">
              <p className="text-xs text-ink-secondary leading-relaxed">
                Enter your registered email address. We will send a 6-digit verification code to your email inbox to verify your identity.
              </p>

              <Input
                label="Email Address *"
                type="text"
                placeholder="name@example.com"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
                required
              />

              <div className="pt-2 border-t border-borderLight flex justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsForgotModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isResetting}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Send Verification Code
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleConfirmReset} className="space-y-4">
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <Mail className="w-4 h-4 text-blue-600" />
                  <span>Check your email inbox:</span>
                </div>
                <p className="text-[11px] text-blue-800">
                  {resetSuccessMessage || `A 6-digit verification code has been sent to ${resetEmail}. Enter the code below to proceed.`}
                </p>
              </div>

              <Input
                label="6-Digit Verification Code *"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="e.g. 748291"
                leftIcon={<ShieldCheck className="w-4 h-4" />}
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

              <div className="pt-2 border-t border-borderLight flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => {
                    setForgotStep(1);
                    setResetError('');
                  }}
                  className="text-xs text-ink-secondary hover:text-ink-primary"
                >
                  ← Change Email
                </button>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsForgotModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={isResetting}
                  >
                    Verify & Update Password
                  </Button>
                </div>
              </div>
            </form>
          )}
        </div>
      </Modal>
    </div>
  );
};
