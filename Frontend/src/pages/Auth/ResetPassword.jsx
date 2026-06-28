import React, { useState } from 'react';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import Button from '@/components/common/Button.jsx';
import Input from '@/components/common/Input.jsx';
import api from '@/services/api.js';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!token) {
      setError('Missing token parameter. Please check your password reset email link.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await api.post('/auth/reset-password', {
        token,
        password: formData.password,
      });

      setSuccess('Your password has been successfully reset. Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 text-left max-w-sm mx-auto p-4">
      <div>
        <h3 className="text-xl font-bold text-[var(--color-brand-text-primary)]">
          Create New Password
        </h3>
        <p className="text-xs text-[var(--color-brand-text-secondary)] mt-1">
          Please choose a strong and secure new password.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl border text-xs bg-red-50 border-red-200 text-red-500">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-3 rounded-xl border text-xs bg-green-50 border-green-200 text-green-700">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="relative">
          <Input
            label="New Password"
            type={showPassword ? 'text' : 'password'}
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="pl-10"
            required
          />
          <Lock className="absolute left-3.5 bottom-3.5 w-4 h-4 text-slate-500" />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 bottom-3.5 cursor-pointer text-slate-400 hover:text-slate-600"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        <div className="relative">
          <Input
            label="Confirm Password"
            type={showPassword ? 'text' : 'password'}
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="pl-10"
            required
          />
          <Lock className="absolute left-3.5 bottom-3.5 w-4 h-4 text-slate-500" />
        </div>

        <Button type="submit" isLoading={isLoading} className="w-full mt-2">
          Reset Password
          <CheckCircle className="w-4 h-4 ml-2" />
        </Button>
      </form>

      <div className="text-center text-xs mt-2 border-t border-slate-100 pt-4">
        <Link
          to="/login"
          className="text-[var(--color-brand-blue)] hover:underline font-semibold"
        >
          Cancel and return to Login
        </Link>
      </div>
    </div>
  );
};

export default ResetPassword;
