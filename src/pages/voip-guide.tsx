import Link from 'next/link';
import { Phone, Video, Share2, Mic, MessageCircle, Clock } from 'lucide-react';

export default function VoIPGuide() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">📞 VoIP & Screen Sharing Guide</h1>
          <Link href="/">
            <button className="text-gray-400 hover:text-white transition-colors">
              Back to Home
            </button>
          </Link>
        </div>

        {/* Quick Start */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4">🚀 Quick Start</h2>
          <div className="space-y-3">
            <p>1. Click on "VoIP & Calls" in the sidebar or header dropdown</p>
            <p>2. Add a friend by entering their email</p>
            <p>3. Accept incoming friend requests</p>
            <p>4. Click "Call" to start a video call</p>
            <p>5. Use gesture controls or UI buttons to manage your call</p>
          </div>
        </div>

        {/* Main Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Video Calling */}
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Video size={28} className="text-blue-400" />
              <h3 className="text-xl font-bold">Video Calling</h3>
            </div>
            <p className="text-gray-300 mb-4">
              Make high-quality peer-to-peer video calls with your friends using WebRTC technology.
            </p>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>✓ Full HD video quality</li>
              <li>✓ Real-time audio</li>
              <li>✓ Mute/unmute controls</li>
              <li>✓ Camera on/off toggle</li>
            </ul>
          </div>

          {/* Screen Sharing */}
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Share2 size={28} className="text-green-400" />
              <h3 className="text-xl font-bold">Screen Sharing</h3>
            </div>
            <p className="text-gray-300 mb-4">
              Share your entire screen or a specific window during a call for presentations and demos.
            </p>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>✓ Share full screen</li>
              <li>✓ Share specific window</li>
              <li>✓ Smooth switching between camera and screen</li>
              <li>✓ Cursor visibility in screen share</li>
            </ul>
          </div>

          {/* Call Recording */}
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Clock size={28} className="text-red-400" />
              <h3 className="text-xl font-bold">Call Recording</h3>
            </div>
            <p className="text-gray-300 mb-4">
              Automatically record calls with audio and video for later review or archival.
            </p>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>✓ Local device recording</li>
              <li>✓ Combined audio/video</li>
              <li>✓ Auto-download when call ends</li>
              <li>✓ WebM format (compatible with all browsers)</li>
            </ul>
          </div>

          {/* Friend Management */}
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <MessageCircle size={28} className="text-purple-400" />
              <h3 className="text-xl font-bold">Friend Management</h3>
            </div>
            <p className="text-gray-300 mb-4">
              Build your network with friend requests and maintain a contact list.
            </p>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>✓ Send/accept friend requests</li>
              <li>✓ Search friends by email</li>
              <li>✓ View complete call history</li>
              <li>✓ Block/unblock users</li>
            </ul>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-gray-800 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">🔧 How It Works</h2>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="font-bold text-lg">Friend Connection</h3>
                <p className="text-gray-300">
                  Users add each other as friends using email addresses. Friend requests create a connection
                  that enables calling functionality.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="font-bold text-lg">WebRTC Peer Connection</h3>
                <p className="text-gray-300">
                  When you initiate a call, a secure peer-to-peer connection is established between devices
                  using WebRTC technology (no call routing through servers).
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="font-bold text-lg">Media Streaming</h3>
                <p className="text-gray-300">
                  Audio and video are streamed directly between peers in real-time with minimal latency,
                  ensuring high quality and privacy.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center font-bold">
                4
              </div>
              <div>
                <h3 className="font-bold text-lg">Call Recording</h3>
                <p className="text-gray-300">
                  Calls are recorded on your local device using RecordRTC and automatically downloaded as a
                  WebM file when the call ends.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center font-bold">
                5
              </div>
              <div>
                <h3 className="font-bold text-lg">Call History Tracking</h3>
                <p className="text-gray-300">
                  All calls are logged with metadata including duration, call type (video/screen-share),
                  and status for later reference and analytics.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Call Controls */}
        <div className="bg-gray-800 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">🎮 Call Controls</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-700 rounded p-4">
              <div className="flex items-center gap-2 mb-2">
                <Mic size={20} className="text-blue-400" />
                <span className="font-bold">Mute Audio</span>
              </div>
              <p className="text-sm text-gray-300">Toggle your microphone on/off during the call</p>
            </div>

            <div className="bg-gray-700 rounded p-4">
              <div className="flex items-center gap-2 mb-2">
                <Video size={20} className="text-green-400" />
                <span className="font-bold">Camera Toggle</span>
              </div>
              <p className="text-sm text-gray-300">Turn your camera on or off without ending the call</p>
            </div>

            <div className="bg-gray-700 rounded p-4">
              <div className="flex items-center gap-2 mb-2">
                <Share2 size={20} className="text-purple-400" />
                <span className="font-bold">Screen Share</span>
              </div>
              <p className="text-sm text-gray-300">
                Switch between camera and screen sharing mode instantly
              </p>
            </div>

            <div className="bg-gray-700 rounded p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={20} className="text-red-400" />
                <span className="font-bold">Record Call</span>
              </div>
              <p className="text-sm text-gray-300">Start/stop recording the entire call with audio and video</p>
            </div>

            <div className="bg-gray-700 rounded p-4">
              <div className="flex items-center gap-2 mb-2">
                <Phone size={20} className="text-red-600" />
                <span className="font-bold">End Call</span>
              </div>
              <p className="text-sm text-gray-300">
                Terminate the current call and save call history automatically
              </p>
            </div>
          </div>
        </div>

        {/* Friend Actions */}
        <div className="bg-gray-800 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">👥 Friend Actions</h2>
          <div className="space-y-4">
            <div className="bg-gray-700 rounded p-4">
              <h3 className="font-bold text-lg mb-2">📧 Send Friend Request</h3>
              <p className="text-gray-300">
                Add new friends by entering their email address in the "Add Friend" section. They'll receive a
                friend request and can accept or reject it.
              </p>
            </div>

            <div className="bg-gray-700 rounded p-4">
              <h3 className="font-bold text-lg mb-2">✅ Accept/Reject Requests</h3>
              <p className="text-gray-300">
                View all pending friend requests in the "Requests" tab. Accept requests to add friends or
                reject them to decline.
              </p>
            </div>

            <div className="bg-gray-700 rounded p-4">
              <h3 className="font-bold text-lg mb-2">📞 Call Friends</h3>
              <p className="text-gray-300">
                Once someone is on your friends list, you can click the "Call" button to start a video call
                with them immediately.
              </p>
            </div>

            <div className="bg-gray-700 rounded p-4">
              <h3 className="font-bold text-lg mb-2">📊 View Call History</h3>
              <p className="text-gray-300">
                Access the "History" tab to see all your past calls, including duration, call type, and
                recording download links.
              </p>
            </div>
          </div>
        </div>

        {/* Technical Requirements */}
        <div className="bg-blue-900/20 border border-blue-600 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-4">⚙️ Technical Requirements</h2>
          <div className="space-y-3">
            <p>
              <strong>Browser:</strong> Chrome, Firefox, Edge, or Safari (latest versions recommended)
            </p>
            <p>
              <strong>Permissions:</strong> Camera and microphone access required
            </p>
            <p>
              <strong>Network:</strong> Stable internet connection (minimum 1 Mbps for video calls)
            </p>
            <p>
              <strong>Storage:</strong> Sufficient disk space for call recordings (varies by call duration)
            </p>
            <p>
              <strong>Features:</strong> WebRTC support, getUserMedia API, Screen Share API
            </p>
          </div>
        </div>

        {/* Troubleshooting */}
        <div className="mt-8 bg-gray-800 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-6">🔧 Troubleshooting</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-lg text-yellow-400 mb-2">Camera/Microphone not working?</h3>
              <ul className="list-disc list-inside text-gray-300 space-y-1">
                <li>Check browser permissions for camera and microphone</li>
                <li>Ensure no other apps are using your camera</li>
                <li>Try refreshing the page and initiating the call again</li>
                <li>Restart your browser if problems persist</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg text-yellow-400 mb-2">Poor video quality?</h3>
              <ul className="list-disc list-inside text-gray-300 space-y-1">
                <li>Check your internet connection speed</li>
                <li>Move closer to your WiFi router</li>
                <li>Close other applications using bandwidth</li>
                <li>Try disabling camera to use audio-only</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg text-yellow-400 mb-2">Recording not saving?</h3>
              <ul className="list-disc list-inside text-gray-300 space-y-1">
                <li>Check browser's download folder</li>
                <li>Ensure browser has write permissions</li>
                <li>Try with a different browser</li>
                <li>Clear browser cache if files are incomplete</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Privacy & Security */}
        <div className="mt-8 bg-gray-800 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-4">🔒 Privacy & Security</h2>
          <ul className="space-y-2 text-gray-300 list-disc list-inside">
            <li>All calls use peer-to-peer connection (end-to-end encrypted)</li>
            <li>No call data is routed through our servers</li>
            <li>Call recordings are stored locally on your device only</li>
            <li>Friend requests don't share personal information</li>
            <li>Block feature available to prevent unwanted contact</li>
          </ul>
        </div>

        {/* Get Started Button */}
        <div className="mt-12 text-center">
          <Link href="/friends">
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-colors text-lg">
              ✨ Start Using VoIP & Calls
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
