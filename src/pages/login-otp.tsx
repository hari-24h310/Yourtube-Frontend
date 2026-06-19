import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import axiosInstance from '@/lib/axiosinstance';
import { useRouter } from 'next/router';
import { Mail, Phone, Loader2 } from 'lucide-react';

export default function LoginOtp() {
  const router = useRouter();
  const [loginMethod, setLoginMethod] = useState('email'); // 'email' or 'phone'
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [detectedRegion, setDetectedRegion] = useState('');
  const [debugOtp, setDebugOtp] = useState('');

  const handleRequestOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const trimmedEmail = email.trim();
      const trimmedPhoneNumber = phoneNumber.trim();
      const response = await axiosInstance.post('/auth/request-otp', {
        email: loginMethod === 'email' ? trimmedEmail : undefined,
        phoneNumber: loginMethod === 'phone' ? trimmedPhoneNumber : undefined,
      });

      setDetectedRegion(response.data.location?.region || '');
      setSuccess(response.data.message);
      setDebugOtp(response.data.debugOtp || '');

      // Store identifier for verification
      sessionStorage.setItem(
        'otpIdentifier',
        loginMethod === 'email' ? trimmedEmail : trimmedPhoneNumber
      );
      sessionStorage.setItem('otpMethod', response.data.otpMethod || loginMethod);
      sessionStorage.setItem('userRegion', response.data.location?.region || '');
      if (response.data.debugOtp) {
        sessionStorage.setItem('otpDebug', response.data.debugOtp);
      } else {
        sessionStorage.removeItem('otpDebug');
      }

      if (response.data.debugOtp) {
        setSuccess(`${response.data.message} Dev OTP: ${response.data.debugOtp}`);
      }

      // Redirect to OTP verification page
      setTimeout(() => {
        router.push('/verify-otp');
      }, 2000);
    } catch (err) {
      const anyErr = err as any;
      setError(
        anyErr?.response?.data?.message ||
        'Error requesting OTP. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-red-600 mb-2">🎬 YourTube</h1>
          <h2 className="text-2xl font-bold text-white mb-2">Sign In</h2>
          <p className="text-gray-400">Login with OTP verification</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-900/20 border border-red-600 rounded-lg p-3 mb-4 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="bg-green-900/20 border border-green-600 rounded-lg p-3 mb-4 text-green-400 text-sm">
            ✓ {success}
            {detectedRegion && (
              <p className="text-xs mt-1">
                Detected Region: <span className="font-bold">{detectedRegion}</span>
              </p>
            )}
            {debugOtp && process.env.NODE_ENV !== 'production' && (
              <p className="text-xs mt-1 text-yellow-300">
                Dev OTP: <span className="font-bold">{debugOtp}</span>
              </p>
            )}
          </div>
        )}

        {/* Login Method Tabs */}
        <div className="flex gap-2 mb-6 bg-gray-800 p-1 rounded-lg">
          <button
            onClick={() => setLoginMethod('email')}
            className={`flex-1 py-2 px-4 rounded font-medium flex items-center justify-center gap-2 transition-all ${
              loginMethod === 'email'
                ? 'bg-red-600 text-white'
                : 'bg-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Mail size={18} />
            Email
          </button>
          <button
            onClick={() => setLoginMethod('phone')}
            className={`flex-1 py-2 px-4 rounded font-medium flex items-center justify-center gap-2 transition-all ${
              loginMethod === 'phone'
                ? 'bg-red-600 text-white'
                : 'bg-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Phone size={18} />
            Phone
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleRequestOtp} className="space-y-4">
          {loginMethod === 'email' ? (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
              />
              <p className="text-xs text-gray-500 mt-2">
                We'll send you a 6-digit OTP code via email
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Phone Number
              </label>
              <Input
                type="tel"
                placeholder="+91 98765 43210"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                disabled={loading}
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
              />
              <p className="text-xs text-gray-500 mt-2">
                We'll send you a 6-digit OTP code via SMS
              </p>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Sending OTP...
              </>
            ) : (
              'Send OTP'
            )}
          </Button>
        </form>

        {/* Info Box */}
        <div className="mt-6 bg-blue-900/20 border border-blue-600 rounded-lg p-4">
          <p className="text-sm text-blue-400">
            <span className="font-bold">🌍 Smart Authentication:</span>
          </p>
          <ul className="text-xs text-blue-300 mt-2 space-y-1 ml-4">
            <li>✓ Email OTP for South India</li>
            <li>✓ SMS OTP for other regions</li>
            <li>✓ 10-minute OTP validity</li>
            <li>✓ Maximum 5 verification attempts</li>
          </ul>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-400 text-sm mt-6">
          Don't have an account? New users are automatically registered after OTP verification.
        </p>
      </div>
    </div>
  );
}
