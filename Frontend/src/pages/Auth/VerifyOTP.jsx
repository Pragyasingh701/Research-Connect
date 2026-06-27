import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, RefreshCcw, AlertCircle } from 'lucide-react';
import Input from '@/components/common/Input.jsx';
import Button from '@/components/common/Button.jsx';
import api from '@/services/api.js';

const VerifyOTP = () => {
  const navigate = useNavigate();

  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    if (!otp) {
      setError('OTP is required');
      return false;
    }

    if (otp.length !== 6) {
      setError('OTP must be 6 digits');
      return false;
    }

    return true;
  };

  const handleVerify = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setError('');
    setIsLoading(true);

    try {
      await api.post('/users/verify-otp', { otp });
      navigate('/login');
    } catch (err) {
      setError(err.message || 'OTP verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await api.post('/users/resend-otp');
      alert('OTP resent successfully');
    } catch {
      alert('Unable to resend OTP');
    }
  };

  return (
    <div className="flex flex-col gap-6 text-left">
      <div>
        <h3 className="text-xl font-bold text-[var(--color-brand-text-primary)]">
          Verify Your Email
        </h3>

        <p className="text-xs text-[var(--color-brand-text-secondary)] mt-1">
          Enter the 6-digit OTP sent to your institutional email
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl border text-xs bg-[var(--color-brand-red)]/10 border-[var(--color-brand-red)]/30 text-[var(--color-brand-red)]">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      <form onSubmit={handleVerify} className="flex flex-col gap-4">
        <Input
          label="Verification Code"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          placeholder="123456"
          maxLength={6}
        />

        <Button type="submit" isLoading={isLoading}>
          Verify OTP
          <ShieldCheck className="w-4 h-4 ml-2" />
        </Button>

        <button
          type="button"
          onClick={handleResend}
          className="flex items-center justify-center gap-2 text-sm text-[var(--color-brand-blue)] hover:underline"
        >
          <RefreshCcw className="w-4 h-4" />
          Resend OTP
        </button>
      </form>

      <div className="text-center text-xs">
        <Link
          to="/login"
          className="text-[var(--color-brand-blue)] hover:underline"
        >
          Back to Login
        </Link>
      </div>
    </div>
  );
};

export default VerifyOTP;