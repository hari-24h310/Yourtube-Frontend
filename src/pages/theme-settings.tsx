import React from 'react';
import { MapPin, Moon, Sun } from 'lucide-react';
import { useRouter } from 'next/router';
import { useTheme } from '@/lib/ThemeContext';

const southIndianStates = ['Tamil Nadu', 'Kerala', 'Karnataka', 'Andhra Pradesh', 'Telangana'];

export default function ThemeSettings() {
  const router = useRouter();
  const { theme, themeInfo, isLoading, refreshTheme } = useTheme();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-xl">Loading theme information...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="mb-2">
          <button
            onClick={() => router.push('/')}
            className="text-gray-400 hover:text-white mb-4 transition-colors"
          >
            ← Back to Home
          </button>
          <h1 className="text-4xl font-bold mb-2">🎨 Theme Settings</h1>
          <p className="text-gray-400">Your theme is dynamically adjusted based on time and location</p>
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-2">Current Theme</h2>
          <div className="flex items-center gap-3">
            {theme === 'light' ? (
              <>
                <Sun size={32} className="text-yellow-300" />
                <span className="text-3xl font-bold">Light Mode</span>
              </>
            ) : (
              <>
                <Moon size={32} className="text-blue-300" />
                <span className="text-3xl font-bold">Dark Mode</span>
              </>
            )}
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <MapPin size={24} className="text-red-500" />
            <h3 className="text-xl font-bold">📍 Your Location</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-700 rounded p-4">
              <p className="text-gray-400 text-sm">Region</p>
              <p className="text-white font-bold text-lg">{themeInfo?.region || 'Unknown'}</p>
            </div>
            <div className="bg-gray-700 rounded p-4">
              <p className="text-gray-400 text-sm">City</p>
              <p className="text-white font-bold text-lg">{themeInfo?.city || 'Unknown'}</p>
            </div>
            <div className="bg-gray-700 rounded p-4">
              <p className="text-gray-400 text-sm">Country</p>
              <p className="text-white font-bold text-lg">{themeInfo?.country || 'Unknown'}</p>
            </div>
            <div className="bg-gray-700 rounded p-4">
              <p className="text-gray-400 text-sm">Region Type</p>
              <p className="text-white font-bold text-lg">{themeInfo?.isSouthIndian ? '🌴 South India' : '🌍 Other'}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4">⚙️ Theme Rules</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-gray-700 rounded">
              <Sun size={20} className="text-yellow-400 mt-1 flex-shrink-0" />
              <div>
                <p className="font-bold">White/Light Theme</p>
                <p className="text-gray-400 text-sm">Activated: 10:00 AM - 12:00 PM IST + South Indian region</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-700 rounded">
              <Moon size={20} className="text-blue-400 mt-1 flex-shrink-0" />
              <div>
                <p className="font-bold">Dark Theme</p>
                <p className="text-gray-400 text-sm">Default: All other times and locations</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4">🏛️ South Indian States</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {southIndianStates.map((state) => (
              <div
                key={state}
                className={`p-3 rounded text-center font-medium ${themeInfo?.isSouthIndian && themeInfo?.region?.includes(state) ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'}`}
              >
                {state}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4">🔐 Authentication Method</h3>
          <div className="p-4 bg-gray-700 rounded">
            <p className="text-gray-400 text-sm mb-2">OTP Method for Your Region:</p>
            {themeInfo?.isSouthIndian ? (
              <div className="flex items-center gap-2">
                <span className="text-2xl">📧</span>
                <span className="text-xl font-bold text-blue-400">Email OTP</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-2xl">📱</span>
                <span className="text-xl font-bold text-green-400">SMS OTP</span>
              </div>
            )}
          </div>
          <p className="text-gray-400 text-sm mt-4">
            {themeInfo?.isSouthIndian
              ? 'Users in South India receive OTP codes via email for enhanced security.'
              : 'Users in other regions receive OTP codes via SMS for convenient verification.'}
          </p>
        </div>

        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4">🚀 How It Works</h3>
          <ol className="space-y-3">
            <li className="flex gap-3"><span className="bg-white text-purple-600 rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">1</span><span>Your location is detected based on your IP address</span></li>
            <li className="flex gap-3"><span className="bg-white text-purple-600 rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">2</span><span>Current time in IST is checked</span></li>
            <li className="flex gap-3"><span className="bg-white text-purple-600 rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">3</span><span>Light theme enabled: 10 AM-12 PM IST + South Indian region</span></li>
            <li className="flex gap-3"><span className="bg-white text-purple-600 rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">4</span><span>Dark theme used for all other conditions</span></li>
            <li className="flex gap-3"><span className="bg-white text-purple-600 rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">5</span><span>OTP sent via email (South) or SMS (Other regions)</span></li>
          </ol>
        </div>

        <button
          onClick={refreshTheme}
          className="w-full bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg py-3 text-sm font-semibold transition-colors"
        >
          Refresh theme from backend
        </button>
      </div>
    </div>
  );
}
