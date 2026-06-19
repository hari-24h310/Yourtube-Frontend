import React from 'react';
import { Smartphone, Zap, Hand, RotateCcw } from 'lucide-react';
import Link from 'next/link';

export default function GestureGuide() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/">
            <button className="text-gray-400 hover:text-white mb-4 transition-colors">
              ← Back to Home
            </button>
          </Link>
          <h1 className="text-5xl font-bold mb-4">📱 Gesture Controls Guide</h1>
          <p className="text-gray-400 text-lg">Master touch gestures for the ultimate video watching experience</p>
        </div>

        {/* Quick Start */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Zap size={28} />
            Quick Start
          </h2>
          <p className="text-blue-100 mb-4">
            YourTube supports intuitive touch gestures for seamless video control. No need to tap the controls bar anymore!
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-900/40 rounded p-4">
              <p className="font-bold text-blue-200">📌 Works on</p>
              <p className="text-blue-100">Mobile phones, tablets, and touch-enabled devices</p>
            </div>
            <div className="bg-blue-900/40 rounded p-4">
              <p className="font-bold text-blue-200">⚡ Real-time Feedback</p>
              <p className="text-blue-100">Visual indicators show your gesture actions</p>
            </div>
          </div>
        </div>

        {/* Main Gestures */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Single Tap */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-4xl">👆</div>
              <h3 className="text-2xl font-bold">Single Tap</h3>
            </div>
            <div className="space-y-4">
              <div className="border-l-4 border-green-500 pl-4">
                <p className="font-bold text-green-400">Center</p>
                <p className="text-gray-300">Play / Pause Video</p>
                <p className="text-sm text-gray-500 mt-1">Tap once in the center of the screen to toggle play/pause</p>
              </div>
            </div>
          </div>

          {/* Double Tap */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-4xl">👆👆</div>
              <h3 className="text-2xl font-bold">Double Tap</h3>
            </div>
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <p className="font-bold text-blue-400">Right Side</p>
                <p className="text-gray-300">Skip Forward +10 seconds</p>
                <p className="text-sm text-gray-500 mt-1">Quickly skip boring parts</p>
              </div>
              <div className="border-l-4 border-orange-500 pl-4">
                <p className="font-bold text-orange-400">Left Side</p>
                <p className="text-gray-300">Rewind -10 seconds</p>
                <p className="text-sm text-gray-500 mt-1">Rewatch what you missed</p>
              </div>
            </div>
          </div>

          {/* Triple Tap - Center */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-4xl">👆👆👆</div>
              <h3 className="text-2xl font-bold">Triple Tap</h3>
            </div>
            <div className="space-y-4">
              <div className="border-l-4 border-purple-500 pl-4">
                <p className="font-bold text-purple-400">Center</p>
                <p className="text-gray-300">Next Video</p>
                <p className="text-sm text-gray-500 mt-1">Auto-play the next video in your playlist</p>
              </div>
            </div>
          </div>

          {/* Triple Tap - Sides */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-4xl">👆👆👆</div>
              <h3 className="text-2xl font-bold">Triple Tap (Cont)</h3>
            </div>
            <div className="space-y-4">
              <div className="border-l-4 border-red-500 pl-4">
                <p className="font-bold text-red-400">Right Side</p>
                <p className="text-gray-300">Close Website</p>
                <p className="text-sm text-gray-500 mt-1">Exit the app/website (native behavior)</p>
              </div>
              <div className="border-l-4 border-cyan-500 pl-4">
                <p className="font-bold text-cyan-400">Left Side</p>
                <p className="text-gray-300">Open Comments</p>
                <p className="text-sm text-gray-500 mt-1">Jump to comment section</p>
              </div>
            </div>
          </div>
        </div>

        {/* Visual Guide */}
        <div className="bg-gray-800 rounded-lg p-8 mb-8 border border-gray-700">
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Hand size={28} />
            Visual Tap Zones
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left Zone */}
            <div className="bg-gradient-to-br from-orange-600 to-orange-800 rounded-lg p-8 text-center">
              <p className="text-2xl mb-3">👈</p>
              <p className="font-bold text-xl mb-2">LEFT ZONE</p>
              <ul className="text-sm space-y-2 text-left">
                <li>🔄 Double: Rewind 10s</li>
                <li>🔄🔄 Triple: Comments</li>
              </ul>
            </div>

            {/* Center Zone */}
            <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-lg p-8 text-center">
              <p className="text-2xl mb-3">👆</p>
              <p className="font-bold text-xl mb-2">CENTER ZONE</p>
              <ul className="text-sm space-y-2 text-left">
                <li>▶️ Tap: Play/Pause</li>
                <li>⏭️ Triple: Next Video</li>
              </ul>
            </div>

            {/* Right Zone */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg p-8 text-center">
              <p className="text-2xl mb-3">👉</p>
              <p className="font-bold text-xl mb-2">RIGHT ZONE</p>
              <ul className="text-sm space-y-2 text-left">
                <li>⏩ Double: Skip 10s</li>
                <li>❌ Triple: Close</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Tips & Tricks */}
        <div className="bg-gray-800 rounded-lg p-8 mb-8 border border-gray-700">
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Smartphone size={28} />
            Pro Tips & Tricks
          </h3>
          <div className="space-y-4">
            <div className="flex gap-4 items-start">
              <div className="text-2xl flex-shrink-0">⚡</div>
              <div>
                <p className="font-bold">Fast Navigation</p>
                <p className="text-gray-300">Use double-tap to skip through ads or boring parts quickly</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="text-2xl flex-shrink-0">🔄</div>
              <div>
                <p className="font-bold">Precise Timing</p>
                <p className="text-gray-300">Each double-tap moves 10 seconds, perfect for finding exact moments</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="text-2xl flex-shrink-0">🎬</div>
              <div>
                <p className="font-bold">Binge Watching</p>
                <p className="text-gray-300">Triple-tap center to auto-play next video for continuous viewing</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="text-2xl flex-shrink-0">💬</div>
              <div>
                <p className="font-bold">Quick Comments</p>
                <p className="text-gray-300">Triple-tap left to jump to comments without scrolling</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="text-2xl flex-shrink-0">🎯</div>
              <div>
                <p className="font-bold">Accuracy Tips</p>
                <p className="text-gray-300">Taps within 50 pixels of each other are counted as one gesture. Be precise!</p>
              </div>
            </div>
          </div>
        </div>

        {/* Gesture Settings */}
        <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <RotateCcw size={28} />
            Technical Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-700 rounded p-4">
              <p className="font-bold text-blue-400 mb-2">Double-Tap Timing</p>
              <p className="text-gray-300">300ms window between taps to register as double-tap</p>
            </div>
            <div className="bg-gray-700 rounded p-4">
              <p className="font-bold text-blue-400 mb-2">Triple-Tap Timing</p>
              <p className="text-gray-300">500ms window between taps to register as triple-tap</p>
            </div>
            <div className="bg-gray-700 rounded p-4">
              <p className="font-bold text-blue-400 mb-2">Tap Threshold</p>
              <p className="text-gray-300">50 pixels max distance for taps to be counted as same location</p>
            </div>
            <div className="bg-gray-700 rounded p-4">
              <p className="font-bold text-blue-400 mb-2">Zone Division</p>
              <p className="text-gray-300">Screen divided into 3 zones: Left (0-33%), Center (33-67%), Right (67-100%)</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-400">
          <p>📱 Gesture controls work best on mobile and tablet devices</p>
          <p className="mt-2">Try them out while watching your next video!</p>
        </div>
      </div>
    </div>
  );
}
