import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, AlertCircle, Microscope } from 'lucide-react';
import api from '../../services/api';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const performVerification = async () => {
      if (!token) {
        setStatus('error');
        setErrorMessage('Verification token is missing. Please check your verification email link.');
        return;
      }

      try {
        const response = await api.post('/auth/verify-email', { token });
        if (response.data?.status === 'success' || response.status === 200) {
          setStatus('success');
        } else {
          setStatus('error');
          setErrorMessage(response.data?.message || 'Verification failed. Token may be invalid or expired.');
        }
      } catch (err) {
        setStatus('error');
        setErrorMessage(err.response?.data?.message || 'Verification link is invalid or has expired.');
      }
    };

    performVerification();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="glass-card rounded-3xl p-8 bg-white border border-slate-200/80 shadow-md max-w-md w-full text-center space-y-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center">
            <Microscope className="w-4 h-4" />
          </div>
          <span className="text-base font-bold text-slate-800 font-display">ResearchConnect</span>
        </div>

        {status === 'verifying' && (
          <div className="space-y-4 py-6">
            <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <h3 className="text-lg font-bold text-slate-800">Verifying your email address</h3>
            <p className="text-xs text-slate-400">Please wait while we activate your academic account...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-6 py-6">
            <div className="w-16 h-16 rounded-full bg-green-50 text-green-600 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-800">Account Activated!</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Thank you for verifying your email address. Your professional researcher profile is now active.
              </p>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer"
            >
              Sign In to Your Account
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-6 py-6">
            <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto shadow-sm">
              <XCircle className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-800">Verification Failed</h3>
              <p className="text-xs text-red-500 font-medium max-w-xs mx-auto">
                {errorMessage}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Link
                to="/register"
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition-colors block"
              >
                Return to Registration
              </Link>
              <Link
                to="/login"
                className="text-xs text-blue-600 hover:underline font-semibold"
              >
                Back to Sign In
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailPage;
