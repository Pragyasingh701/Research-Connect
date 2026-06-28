import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, AlertCircle, Send, ArrowLeft } from 'lucide-react';
import Input from '@/components/common/Input.jsx';
import Button from '@/components/common/Button.jsx';
import api from '@/services/api.js';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email) {
      setError('Email address is required');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      await api.post('/auth/forgot-password', { email });
      setSuccess('Verification OTP code sent to your email.');
      setTimeout(() => {
        navigate(`/verify-otp?email=${encodeURIComponent(email)}&purpose=password_reset`);
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to process recovery request.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 text-left max-w-sm mx-auto p-4">
      <div>
        <h3 className="text-xl font-bold text-[var(--color-brand-text-primary)]">
          Password Recovery
        </h3>
        <p className="text-xs text-[var(--color-brand-text-secondary)] mt-1">
          Enter your registered email address and we will dispatch a verification code to authorize a password reset.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-xl text-xs bg-red-50 border border-red-200 text-red-500 flex gap-2 items-center">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 rounded-xl text-xs bg-green-50 border border-green-200 text-green-600">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="relative">
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@institution.edu"
            className="pl-10"
            required
          />
          <Mail className="absolute left-3.5 bottom-3.5 w-4 h-4 text-slate-500" />
        </div>

        <Button type="submit" isLoading={isLoading} className="w-full">
          Send Recovery Code
          <Send className="w-4 h-4 ml-2" />
        </Button>
      </form>

      <div className="text-center text-xs mt-2 border-t border-slate-100 pt-4">
        <Link
          to="/login"
          className="flex items-center justify-center gap-1.5 text-[var(--color-brand-blue)] hover:underline font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Login
        </Link>
      </div>
    </div>
  );
};

export default ForgotPassword;
