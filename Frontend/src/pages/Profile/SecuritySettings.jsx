import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Smartphone, 
  Laptop, 
  History, 
  LogOut, 
  Key, 
  Globe, 
  RefreshCw, 
  Trash2, 
  CheckCircle, 
  AlertTriangle,
  UserCheck
} from 'lucide-react';
import api from '../../services/api';
import Button from '@/components/common/Button.jsx';

const SecuritySettings = () => {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [trustedDevices, setTrustedDevices] = useState([]);
  const [loginActivity, setLoginActivity] = useState([]);
  const [securityLogs, setSecurityLogs] = useState([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [toggling2FA, setToggling2FA] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Fetch all security data
  const fetchSecurityData = async () => {
    try {
      setIsLoading(true);
      
      const [meRes, sessionsRes, devicesRes, activityRes, logsRes] = await Promise.all([
        api.get('/auth/me'),
        api.get('/auth/sessions'),
        api.get('/auth/trusted-devices'),
        api.get('/auth/login-activity'),
        api.get('/auth/security-logs')
      ]);

      setTwoFactorEnabled(meRes.data?.user?.twoFactorEnabled ?? true);
      setSessions(sessionsRes.data?.sessions || []);
      setTrustedDevices(devicesRes.data?.devices || []);
      setLoginActivity(activityRes.data?.activity || []);
      setSecurityLogs(logsRes.data?.logs || []);
    } catch (err) {
      showMsg('error', 'Failed to load security settings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  // Toggle 2FA
  const handleToggle2FA = async () => {
    setToggling2FA(true);
    try {
      const targetState = !twoFactorEnabled;
      const res = await api.post('/auth/two-factor', { enabled: targetState });
      setTwoFactorEnabled(res.data.twoFactorEnabled);
      showMsg('success', res.data.message);
      // Refresh security logs
      const logsRes = await api.get('/auth/security-logs');
      setSecurityLogs(logsRes.data?.logs || []);
    } catch (err) {
      showMsg('error', err.response?.data?.message || 'Failed to update 2FA setting.');
    } finally {
      setToggling2FA(false);
    }
  };

  // Terminate a session
  const handleTerminateSession = async (sessionId) => {
    setActionLoadingId(sessionId);
    try {
      await api.delete(`/auth/sessions/${sessionId}`);
      setSessions(prev => prev.filter(s => s._id !== sessionId));
      showMsg('success', 'Session terminated successfully.');
      // Refresh logs
      const logsRes = await api.get('/auth/security-logs');
      setSecurityLogs(logsRes.data?.logs || []);
    } catch (err) {
      showMsg('error', 'Failed to terminate session.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Terminate all sessions
  const handleTerminateAllSessions = async () => {
    setActionLoadingId('all');
    try {
      await api.post('/auth/logout-all');
      showMsg('success', 'Successfully logged out of all other devices.');
      // Since all sessions (including current) are terminated, redirect to login
      setTimeout(() => {
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
      }, 2000);
    } catch (err) {
      showMsg('error', 'Failed to terminate all sessions.');
      setActionLoadingId(null);
    }
  };

  // Revoke a trusted device
  const handleRevokeDevice = async (deviceId) => {
    setActionLoadingId(deviceId);
    try {
      await api.delete(`/auth/trusted-devices/${deviceId}`);
      setTrustedDevices(prev => prev.filter(d => d._id !== deviceId));
      showMsg('success', 'Trusted device revoked.');
    } catch (err) {
      showMsg('error', 'Failed to revoke trusted device.');
    } finally {
      setActionLoadingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-xs text-slate-400">Loading security configurations...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 text-left">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 font-display flex items-center gap-2">
          <Shield className="w-7 h-7 text-blue-600" /> Security & Session Settings
        </h2>
        <p className="text-xs text-slate-500 mt-1">Manage your active devices, trusted hardware, and account authentication protocols.</p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl border text-xs flex items-center gap-2.5 animate-slide-in ${
          message.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-700' 
            : 'bg-red-50 border-red-200 text-red-600'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* 1. Two Factor Authentication */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Key className="w-4.5 h-4.5 text-blue-600" /> Two-Factor Authentication (2FA)
            </h3>
            <p className="text-xs text-slate-400 max-w-xl">
              Enhance your account security. Every sign-in attempt will require a 6-digit verification code sent directly to your registered academic email.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              twoFactorEnabled ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
            }`}>
              {twoFactorEnabled ? 'Enabled' : 'Disabled'}
            </span>
            <button
              onClick={handleToggle2FA}
              disabled={toggling2FA}
              className={`w-12 h-6.5 rounded-full p-1 transition-all duration-300 focus:outline-none ${
                twoFactorEnabled ? 'bg-blue-600' : 'bg-slate-300'
              } ${toggling2FA ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className={`bg-white w-4.5 h-4.5 rounded-full shadow-md transform transition-all duration-300 ${
                twoFactorEnabled ? 'translate-x-5.5' : 'translate-x-0'
              }`} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Active Sessions */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Laptop className="w-4.5 h-4.5 text-blue-600" /> Active Device Sessions
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">These devices are currently logged in to your account.</p>
          </div>
          {sessions.length > 1 && (
            <Button 
              variant="danger" 
              size="sm" 
              onClick={handleTerminateAllSessions}
              isLoading={actionLoadingId === 'all'}
            >
              <LogOut className="w-3.5 h-3.5 mr-1.5" /> Log Out Other Devices
            </Button>
          )}
        </div>

        <div className="divide-y divide-slate-100">
          {sessions.map((session) => (
            <div key={session._id} className="py-4 flex items-center justify-between first:pt-0 last:pb-0">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 flex-shrink-0">
                  {session.os.toLowerCase().includes('windows') || session.os.toLowerCase().includes('mac') ? (
                    <Laptop className="w-5 h-5 text-slate-600" />
                  ) : (
                    <Smartphone className="w-5 h-5 text-slate-600" />
                  )}
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    {session.browser} on {session.os}
                    {session.isTrusted && (
                      <span className="text-[10px] bg-blue-50 text-blue-600 font-bold px-1.5 py-0.5 rounded border border-blue-100">
                        Current Session
                      </span>
                    )}
                  </p>
                  <p className="text-[11px] text-slate-400 flex items-center gap-3">
                    <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {session.ipAddress}</span>
                    <span>•</span>
                    <span>Last active: {new Date(session.lastActive).toLocaleString()}</span>
                  </p>
                </div>
              </div>

              {!session.isTrusted && (
                <button
                  onClick={() => handleTerminateSession(session._id)}
                  disabled={actionLoadingId === session._id}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                  title="Terminate session"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 3. Trusted Devices */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Smartphone className="w-4.5 h-4.5 text-blue-600" /> Trusted Devices
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Devices that bypass the 6-digit email OTP check during sign-in.</p>
        </div>

        {trustedDevices.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">
            No trusted devices registered. Check "Remember this device" during login.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {trustedDevices.map((device) => (
              <div key={device._id} className="py-4 flex items-center justify-between first:pt-0 last:pb-0">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50/60 border border-blue-100/50 flex items-center justify-center text-blue-600 flex-shrink-0">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-700">
                      {device.browser} on {device.os}
                    </p>
                    <p className="text-[11px] text-slate-400 flex items-center gap-3">
                      <span>IP: {device.ipAddress}</span>
                      <span>•</span>
                      <span>Last used: {new Date(device.lastUsed).toLocaleDateString()}</span>
                      <span>•</span>
                      <span className="text-amber-600 font-medium">Expires: {new Date(device.expiresAt).toLocaleDateString()}</span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleRevokeDevice(device._id)}
                  disabled={actionLoadingId === device._id}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                  title="Revoke device trust"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Login History & Security Audit Logs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Login History */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
            <History className="w-4 h-4 text-blue-600" /> Recent Logins
          </h3>
          <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
            {loginActivity.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No recent login activity.</p>
            ) : (
              loginActivity.map((act) => (
                <div key={act._id} className="text-xs flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-700">{act.browser} on {act.os}</p>
                    <p className="text-[10px] text-slate-400">{act.ipAddress} • {new Date(act.createdAt).toLocaleString()}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    act.status === 'success' 
                      ? 'bg-green-50 text-green-700 border border-green-100' 
                      : 'bg-red-50 text-red-600 border border-red-100'
                  }`}>
                    {act.status === 'success' ? 'Success' : 'Failed'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Security Logs */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Shield className="w-4 h-4 text-blue-600" /> Security Events
          </h3>
          <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
            {securityLogs.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No security events logged.</p>
            ) : (
              securityLogs.map((log) => (
                <div key={log._id} className="text-xs space-y-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-slate-700 capitalize">
                      {log.action.replace(/_/g, ' ')}
                    </p>
                    <span className="text-[10px] text-slate-400">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">IP: {log.ipAddress}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecuritySettings;
