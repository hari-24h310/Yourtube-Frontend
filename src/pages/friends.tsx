import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { useUser } from '@/lib/AuthContext';
import { Phone, UserPlus, Trash2, User, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

export default function Friends() {
  const router = useRouter();
  const { user } = useUser();
  const [friends, setFriends] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [callHistory, setCallHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'history'>('friends');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [friendEmail, setFriendEmail] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login-otp');
      return;
    }

    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user?._id) return;

    try {
      const [friendsRes, requestsRes, historyRes] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/friend/list/${user._id}`),
        axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/friend/pending/${user._id}`),
        axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/friend/call-history/${user._id}`),
      ]);

      setFriends(friendsRes.data.friends || []);
      setPendingRequests(requestsRes.data.requests || []);
      setCallHistory(historyRes.data.history || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async () => {
    if (!friendEmail.trim() || !user?._id) {
      alert('Please enter a valid email');
      return;
    }

    setSendingRequest(true);
    try {
      // Search for user by email
      const searchRes = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/friend/search?query=${encodeURIComponent(friendEmail)}`
      );

      if (!searchRes.data.users || searchRes.data.users.length === 0) {
        alert('User not found');
        setSendingRequest(false);
        return;
      }

      const foundUser = searchRes.data.users[0];

      // Send friend request
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/friend/send-request`,
        {
          userId: user._id,
          friendId: foundUser._id,
        }
      );

      alert(`Friend request sent to ${foundUser.email}!`);
      setFriendEmail('');
    } catch (error) {
      console.error('Error sending request:', error);
      if (axios.isAxiosError(error) && error.response?.status === 400) {
        alert('Friend request already exists or you are already friends');
      } else {
        alert('Failed to send friend request');
      }
    } finally {
      setSendingRequest(false);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/friend/accept-request`,
        { requestId }
      );
      await fetchData();
    } catch (error) {
      console.error('Error accepting request:', error);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/friend/reject-request`,
        { requestId }
      );
      await fetchData();
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  const filteredFriends = friends.filter(
    (friend) =>
      friend.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      friend.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <p className="text-white">Loading friends...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">👥 Friends & Calls</h1>
          <Link href="/">
            <button className="text-gray-400 hover:text-white transition-colors">
              Back to Home
            </button>
          </Link>
        </div>

        {/* Add Friend Section */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <UserPlus size={20} />
            Add Friend
          </h2>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="Enter friend's email..."
              value={friendEmail}
              onChange={(e) => setFriendEmail(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />
            <Button
              onClick={handleSendRequest}
              disabled={sendingRequest}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {sendingRequest ? 'Sending...' : 'Send Request'}
            </Button>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            💡 Note: Requires backend signaling server for full functionality
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-gray-800 p-1 rounded-lg">
          {(['friends', 'requests', 'history'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 px-4 rounded font-medium transition-all ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-transparent text-gray-400 hover:text-white'
              }`}
            >
              {tab === 'friends' && `Friends (${friends.length})`}
              {tab === 'requests' && `Requests (${pendingRequests.length})`}
              {tab === 'history' && `History (${callHistory.length})`}
            </button>
          ))}
        </div>

        {/* Friends List */}
        {activeTab === 'friends' && (
          <div className="space-y-4">
            {filteredFriends.length > 0 ? (
              <>
                {/* Search */}
                <Input
                  type="text"
                  placeholder="Search friends..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 mb-4"
                />

                {filteredFriends.map((friend) => (
                  <div
                    key={friend.friendId}
                    className="bg-gray-800 rounded-lg p-4 flex items-center justify-between hover:bg-gray-750 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {friend.image ? (
                        <img
                          src={friend.image}
                          alt={friend.displayName}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center">
                          <User size={24} className="text-gray-400" />
                        </div>
                      )}
                      <div>
                        <p className="font-bold">{friend.displayName}</p>
                        <p className="text-sm text-gray-400">{friend.email}</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => router.push(`/call?friendId=${friend.friendId}`)}
                      className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
                    >
                      <Phone size={18} />
                      Call
                    </Button>
                  </div>
                ))}
              </>
            ) : (
              <div className="bg-gray-800 rounded-lg p-12 text-center">
                <p className="text-gray-400">No friends yet. Send a friend request to get started!</p>
              </div>
            )}
          </div>
        )}

        {/* Pending Requests */}
        {activeTab === 'requests' && (
          <div className="space-y-4">
            {pendingRequests.length > 0 ? (
              pendingRequests.map((request) => (
                <div
                  key={request.id}
                  className="bg-gray-800 rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    {request.image ? (
                      <img
                        src={request.image}
                        alt={request.displayName}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center">
                        <User size={24} className="text-gray-400" />
                      </div>
                    )}
                    <div>
                      <p className="font-bold">{request.displayName}</p>
                      <p className="text-sm text-gray-400">{request.email}</p>
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <Clock size={12} />
                        {new Date(request.requestedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleAcceptRequest(request.id)}
                      className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
                    >
                      <CheckCircle size={18} />
                      Accept
                    </Button>
                    <Button
                      onClick={() => handleRejectRequest(request.id)}
                      variant="destructive"
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-gray-800 rounded-lg p-12 text-center">
                <p className="text-gray-400">No pending friend requests</p>
              </div>
            )}
          </div>
        )}

        {/* Call History */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            {callHistory.length > 0 ? (
              callHistory.map((call, index) => (
                <div key={index} className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-bold">
                        {call.callType === 'screen-share' ? '🖥️ Screen Share' : '📹 Video Call'} -{' '}
                        {call.status}
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        {call.callerId === user?._id ? 'Called' : 'Called by'}{' '}
                        {call.callerId === user?._id
                          ? call.receiverId?.displayName || call.receiverId?.name
                          : call.callerId?.displayName || call.callerId?.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(call.startedAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">
                        {Math.floor(call.duration / 60)}:{(call.duration % 60)
                          .toString()
                          .padStart(2, '0')}
                      </p>
                      {call.recordingUrl && (
                        <a
                          href={call.recordingUrl}
                          download
                          className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 mt-2 justify-end"
                        >
                          <Phone size={14} />
                          Download
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-gray-800 rounded-lg p-12 text-center">
                <p className="text-gray-400">No call history yet</p>
              </div>
            )}
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 bg-blue-900/20 border border-blue-600 rounded-lg p-4 text-sm text-blue-300">
          <p className="font-bold mb-2">🎥 VoIP & Screen Sharing Features:</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>High-quality video and audio calls using WebRTC</li>
            <li>Real-time screen sharing for presentations</li>
            <li>Automatic call recording (saved locally)</li>
            <li>Call history tracking and management</li>
            <li>Friend request system</li>
            <li>Requires signaling server for production use</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
