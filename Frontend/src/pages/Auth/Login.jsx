import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Mail, Lock, LogIn, AlertCircle } from 'lucide-react';
import Input from '@/components/common/Input.jsx';
import Button from '@/components/common/Button.jsx';
import api from '@/services/api.js';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isExpired = searchParams.get('expired') === 'true';
  const { login, syncProfile } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  // Handle Google Sign-in callback
  const handleGoogleCallback = async (response) => {
    setIsLoading(true);
    setApiError('');
    try {
      const res = await api.post('/auth/google-login', {
        idToken: response.credential
      });

      const { accessToken } = res.data;
      localStorage.setItem('accessToken', accessToken);

      // Populate user info globally
      await syncProfile();
      navigate('/dashboard');
    } catch (err) {
      setApiError(err.response?.data?.message || 'Google Sign-in failed. Please try again.');
      setIsLoading(false);
    }
  };

  // Load Google Identity Services script dynamically
  useEffect(() => {
    const initializeGoogle = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '959595325668-e5dlgoecao8lvo5k38plolvgv9ua2du1.apps.googleusercontent.com',
          callback: handleGoogleCallback,
        });

        window.google.accounts.id.renderButton(
          document.getElementById('google-signin-div'),
          { theme: 'outline', size: 'large', width: '100%' }
        );
      }
    };

    if (!document.getElementById('google-gsi-script')) {
      const script = document.createElement('script');
      script.id = 'google-gsi-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogle;
      document.body.appendChild(script);
    } else {
      initializeGoogle();
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    setApiError('');
  };

  const validate = () => {
    const tempErrors = {};
    if (!formData.email) {
      tempErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      tempErrors.email = 'Please enter a valid email address';
    }
    if (!formData.password) {
      tempErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      tempErrors.password = 'Password must be at least 8 characters';
    }
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setApiError('');

    const result = await login(formData.email, formData.password);
    
    if (result.success) {
      if (result.otpRequired) {
        const devOtpParam = result.otpCode ? `&devOtp=${result.otpCode}` : '';
        navigate(`/verify-otp?email=${encodeURIComponent(result.email)}&purpose=login${devOtpParam}`);
      } else {
        navigate('/dashboard');
      }
    } else {
      setApiError(result.error || 'Authentication failed. Please check your credentials.');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 text-left">
      <div className="text-center sm:text-left">
        <h3 className="text-xl font-bold font-display text-[var(--color-brand-text-primary)]">Welcome Back</h3>
        <p className="text-xs text-[var(--color-brand-text-secondary)] mt-1">Sign in to coordinate and view research studies</p>
      </div>

      {/* Google Authentication Container */}
      <div className="w-full flex justify-center py-1">
        <div id="google-signin-div" className="w-full"></div>
      </div>

      <div className="relative flex py-1 items-center">
        <div className="flex-grow border-t border-slate-200/60"></div>
        <span className="flex-shrink mx-4 text-slate-400 text-[10px] font-bold uppercase tracking-wider">Or sign in with email</span>
        <div className="flex-grow border-t border-slate-200/60"></div>
      </div>

      {isExpired && (
        <div className="flex items-center gap-2 p-3 bg-[var(--color-brand-light-orange)] border border-amber-200 text-[var(--color-brand-orange)] rounded-xl text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>Session expired. Please log in again to continue.</span>
        </div>
      )}

      {apiError && (
        <div className="flex items-center gap-2 p-3 bg-[var(--color-brand-red)]/10 border border-[var(--color-brand-red)]/35 text-[var(--color-brand-red)] rounded-xl text-xs animate-shake">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{apiError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="relative">
          <Input
            label="Email Address"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            placeholder="name@institution.edu"
            required
            className="pl-10"
          />
          <Mail className="absolute left-3.5 bottom-3.5 w-4 h-4 text-slate-500" />
        </div>

        <div className="relative">
          <Input
            label="Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            placeholder="••••••••"
            required
            className="pl-10"
          />
          <Lock className="absolute left-3.5 bottom-3.5 w-4 h-4 text-slate-500" />
        </div>

        <div className="flex items-center justify-between text-xs mt-1">
          <label className="flex items-center gap-2 text-[var(--color-brand-text-secondary)] cursor-pointer font-medium">
            <input type="checkbox" className="rounded bg-white border-[var(--color-brand-border)] text-[var(--color-brand-blue)] focus:ring-0 focus:ring-offset-0 cursor-pointer" />
            Remember me
          </label>
          <Link to="/forgot-password" className="text-[var(--color-brand-blue)] hover:underline font-semibold">Forgot password?</Link>
        </div>

        <Button type="submit" isLoading={isLoading} className="w-full mt-2">
          Sign In <LogIn className="w-4 h-4 ml-2" />
        </Button>
      </form>

      <div className="border-t border-[var(--color-brand-border)] pt-4 text-center">
        <p className="text-xs text-[var(--color-brand-text-secondary)]">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-[var(--color-brand-blue)] hover:underline font-semibold">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
