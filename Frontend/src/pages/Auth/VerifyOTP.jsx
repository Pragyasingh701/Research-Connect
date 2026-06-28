import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { ShieldCheck, RefreshCcw, AlertCircle, CheckCircle2 } from 'lucide-react';
import Button from '@/components/common/Button.jsx';
import api from '@/services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';

const VerifyOTP = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const purpose = searchParams.get('purpose') || 'email_verification';
  const devOtp = searchParams.get('devOtp') || '';
  const { syncProfile } = useAuth();

  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(false);

  // Auto-fill devOtp in development mode
  useEffect(() => {
    if (devOtp && devOtp.length === 6) {
      setOtpValues(devOtp.split(''));
    }
  }, [devOtp]);


  const inputRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null)
  ];

  // Cooldown countdown timer effect
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [cooldown]);

  const handleChange = (index, value) => {
    // Only accept numeric values
    if (value && !/^\d+$/.test(value)) return;

    const newValues = [...otpValues];
    newValues[index] = value.substring(value.length - 1); // Keep last char
    setOtpValues(newValues);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs[index + 1].current.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Backspace: focus previous input if empty
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      inputRefs[index - 1].current.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    if (!/^\d{6}$/.test(pasteData)) return;

    const values = pasteData.split('');
    setOtpValues(values);
    inputRefs[5].current.focus();
  };

  const handleVerify = async (e) => {
    e.preventDefault();

    if (!validate()) return;
    const otpCode = otpValues.join('');

    if (otpCode.length !== 6) {
      setError('Please enter all 6 digits of the verification code.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await api.post('/users/verify-otp', { otp });
      navigate('/login');
    } catch (err) {
      setError(err.message || 'OTP verification failed');
    } finally {
      const response = await api.post('/auth/verify-otp', {
        email,
        code: otpCode,
        purpose,
        rememberDevice
      });

      const { accessToken, deviceId } = response.data;
      
      if (deviceId) {
        localStorage.setItem('deviceId', deviceId);
      }
      
      if (purpose === 'password_reset') {
        setSuccessMsg('OTP verified successfully. Redirecting to reset password...');
        setTimeout(() => {
          navigate(`/reset-password?email=${encodeURIComponent(email)}&code=${otpCode}`);
        }, 1500);
      } else {
        localStorage.setItem('accessToken', accessToken);
        setSuccessMsg('Account verified successfully. Logging in...');
        
        // Synchronize authenticated session globally
        await syncProfile();
        
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'OTP verification failed. Please try again.');
      setIsLoading(false);
    }
  };

  // Auto-submit when all 6 digits are entered
  useEffect(() => {
    const code = otpValues.join('');
    if (code.length === 6 && !isLoading && !successMsg) {
      const timer = setTimeout(() => {
        handleVerify({ preventDefault: () => {} });
      }, 300); // 300ms delay so the user sees the filled digits
      return () => clearTimeout(timer);
    }
  }, [otpValues, isLoading, successMsg]);

  const handleResend = async () => {
    if (!canResend) return;

    setError('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      await api.post('/auth/resend-otp', {
        email,
        purpose
      });
      setSuccessMsg('A new verification code has been sent to your email.');
      setCooldown(60);
      setCanResend(false);
      setOtpValues(['', '', '', '', '', '']);
      inputRefs[0].current.focus();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to resend OTP code.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 text-left max-w-md mx-auto p-4">
      <div className="text-center sm:text-left">
        <h3 className="text-xl font-bold font-display text-[var(--color-brand-text-primary)]">
          Security Verification
        </h3>
        <p className="text-xs text-[var(--color-brand-text-secondary)] mt-2 leading-relaxed">
          We sent a 6-digit One-Time Password (OTP) code to <strong className="text-slate-700">{email}</strong>. Entering it below allows us to verify your request.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl border text-xs bg-[var(--color-brand-red)]/10 border-[var(--color-brand-red)]/30 text-[var(--color-brand-red)] animate-shake">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 p-3 rounded-xl border text-xs bg-green-50 border-green-200 text-green-700">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleVerify} className="flex flex-col gap-6">
        <div className="flex justify-between gap-2" onPaste={handlePaste}>
          {otpValues.map((val, idx) => (
            <input
              key={idx}
              ref={inputRefs[idx]}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={val}
              onChange={(e) => handleChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              className="w-12 h-12 text-center text-lg font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 focus:bg-white transition-all shadow-sm"
              autoFocus={idx === 0}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="rememberDevice"
            checked={rememberDevice}
            onChange={(e) => setRememberDevice(e.target.checked)}
            className="rounded text-blue-600 focus:ring-blue-500 border-slate-300 h-4 w-4 cursor-pointer"
          />
          <label htmlFor="rememberDevice" className="text-xs font-semibold text-slate-600 select-none cursor-pointer">
            Remember this device for 30 days (skips verification)
          </label>
        </div>

        <Button type="submit" isLoading={isLoading} className="w-full">
          Confirm Code <ShieldCheck className="w-4 h-4 ml-2" />
        </Button>

        <div className="flex items-center justify-between text-xs mt-2 border-t border-slate-100 pt-4">
          <span className="text-[var(--color-brand-text-secondary)]">
            {!canResend ? `Resend code in ${cooldown}s` : 'Did not receive code?'}
          </span>
          <button
            type="button"
            onClick={handleResend}
            disabled={!canResend}
            className={`flex items-center gap-1.5 font-bold transition-all cursor-pointer ${
              canResend 
                ? 'text-[var(--color-brand-blue)] hover:underline' 
                : 'text-slate-300 cursor-not-allowed'
            }`}
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            Resend OTP
          </button>
        </div>
      </form>

      <div className="text-center text-xs mt-2">
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

export default VerifyOTP;