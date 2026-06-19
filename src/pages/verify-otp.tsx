import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import axiosInstance from '@/lib/axiosinstance';
import { useRouter } from 'next/router';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useUser } from '@/lib/AuthContext';

export default function VerifyOtp() {
  const router = useRouter();
  const { login } = useUser();
  const [otp, setOtp] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpMethod, setOtpMethod] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [userRegion, setUserRegion] = useState('');
  const [debugOtp, setDebugOtp] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    // Get data from sessionStorage
    const method = sessionStorage.getItem('otpMethod');
    const id = sessionStorage.getItem('otpIdentifier');
    const region = sessionStorage.getItem('userRegion');
    const storedDebugOtp = sessionStorage.getItem('otpDebug');

    if (!method || !id) {
      router.push('/login-otp');
      return;
    }

    setOtpMethod(method);
    setIdentifier(id);
    setUserRegion(region || '');
    setDebugOtp(storedDebugOtp || '');

    // Start countdown timer
    timerRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) window.clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => { if (timerRef.current) window.clearInterval(timerRef.current); };
  }, []);

  const handleVerifyOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (otp.length !== 6 || !/^\d+$/.test(otp)) {
      setError('Please enter a valid 6-digit OTP');
      setLoading(false);
      return;
    }

    try {
      const payload: Record<string, any> = {
        otp,
        displayName: displayName || undefined,
      };

      if (otpMethod === 'email') {
        payload.email = identifier;
      } else {
        payload.phoneNumber = identifier;
      }

      const response = await axiosInstance.post('/auth/verify-otp', payload);

      if (response.data.verified) {
        // Store user data
        const userData = {
          id: response.data.user.id,
          email: response.data.user.email,
          phoneNumber: response.data.user.phoneNumber,
          displayName: response.data.user.displayName,
          theme: response.data.user.theme,
          sessionToken: response.data.sessionToken,
          authMethod: "otp",
        };

        sessionStorage.setItem('user', JSON.stringify(userData));
        sessionStorage.setItem('userId', userData.id);
        sessionStorage.setItem('sessionToken', response.data.sessionToken);

        // Update AuthContext
        login(userData);

        // Clear OTP-related sessionStorage
        sessionStorage.removeItem('otpIdentifier');
        sessionStorage.removeItem('otpMethod');
        sessionStorage.removeItem('userRegion');
        sessionStorage.removeItem('otpDebug');

        // Show success and redirect
        setTimeout(() => {
          router.push('/');
        }, 1500);
      }
    } catch (err) {
      const anyErr = err as any;
      setError(
        anyErr?.response?.data?.message || 'Error verifying OTP. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    try {
      const payload = {
        [otpMethod === 'email' ? 'email' : 'phoneNumber']: identifier,
      };

      await axiosInstance.post('/auth/request-otp', payload);

      setTimeLeft(600);
      setOtp('');
      setError('');
      setShowNameInput(false);

      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) window.clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError('Error resending OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <button
          onClick={() => router.push('/login-otp')}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft size={18} />
          Back to Login
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Verify OTP</h1>
          <p className="text-gray-400 text-sm">
            Enter the 6-digit code sent to your{' '}
            <span className="font-bold text-red-500">
              {otpMethod === 'email' ? 'email' : 'phone'}
            </span>
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-900/20 border border-red-600 rounded-lg p-3 mb-4 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Identifier Display */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6 text-center">
          <p className="text-gray-400 text-sm">Verification code sent to</p>
          <p className="text-white font-semibold mt-1">{identifier}</p>
          {debugOtp && process.env.NODE_ENV !== 'production' && (
            <p className="text-xs text-green-400 mt-2">
              Dev OTP: <span className="font-bold">{debugOtp}</span>
            </p>
          )}
          {userRegion && (
            <p className="text-xs text-gray-500 mt-2">📍 Region: {userRegion}</p>
          )}
        </div>

        {/* OTP Form */}
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Enter OTP Code
            </label>
            <Input
              type="text"
              placeholder="000000"
              value={otp}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                setOtp(val);
              }}
              maxLength={6}
              disabled={loading}
              className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 text-center text-2xl tracking-widest font-bold"
              autoFocus
            />
          </div>

          {showNameInput && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Display Name (Optional)
              </label>
              <Input
                type="text"
                placeholder="Your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={loading}
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                This will be your public profile name
              </p>
            </div>
          )}

          {!showNameInput && otp.length === 6 && (
            <button
              type="button"
              onClick={() => setShowNameInput(true)}
              className="w-full text-sm text-gray-400 hover:text-white transition-colors py-2"
            >
              + Add Display Name (Optional)
            </button>
          )}

          <Button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify & Login'
            )}
          </Button>
        </form>

        {/* Resend OTP */}
        <div className="mt-6 pt-6 border-t border-gray-700 text-center">
          {timeLeft > 0 ? (
            <p className="text-sm text-gray-400">
              Didn't receive the code? Try again in{' '}
              <span className="font-bold text-red-500">{formatTime(timeLeft)}</span>
            </p>
          ) : (
            <button
              onClick={handleResendOtp}
              disabled={loading}
              className="text-sm text-red-500 hover:text-red-400 font-semibold disabled:text-gray-500 transition-colors"
            >
              Resend OTP Code
            </button>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-900/20 border border-blue-600 rounded-lg p-4 text-xs text-blue-300">
          <p className="font-bold mb-2">📋 Verification Details:</p>
          <ul className="space-y-1">
            <li>✓ Code valid for 10 minutes</li>
            <li>✓ Maximum 5 verification attempts</li>
            <li>✓ Region-based authentication active</li>
            <li>✓ New users auto-registered after verification</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
