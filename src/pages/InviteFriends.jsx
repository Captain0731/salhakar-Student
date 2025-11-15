import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/landing/Navbar";
import { useAuth } from "../contexts/AuthContext";

export default function InviteFriends() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [inviteForm, setInviteForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [sentInvites, setSentInvites] = useState([]);

  useEffect(() => {
    // Load sent invites from API
    const loadSentInvites = async () => {
      try {
        // TODO: Replace with actual API call
        // const response = await apiService.getSentInvites();
        // setSentInvites(response.data);
        
        // For now, initialize with empty array (or load from API if authenticated)
        if (isAuthenticated && user?.id) {
          // Load user-specific invites
          setSentInvites([]);
        } else {
          // Show empty for non-authenticated users
          setSentInvites([]);
        }
      } catch (error) {
        console.error('Error loading sent invites:', error);
        setSentInvites([]);
      }
    };

    loadSentInvites();
  }, [isAuthenticated, user]);

  // Generate referral code - use user ID if authenticated, otherwise use a default/temporary code
  const referralCode = isAuthenticated && user?.id 
    ? `SALHAKAR${user.id.toString().slice(-6).toUpperCase()}` 
    : 'SALHAKAR000000';

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInviteForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // TODO: Replace with actual API call
      // const response = await apiService.sendInvite(inviteForm);
      
      // For now, just show success message
      alert('Invitation sent successfully!');
      setInviteForm({ name: '', email: '', phone: '', message: '' });
      
      // Reload sent invites to get updated list
      // const updatedInvites = await apiService.getSentInvites();
      // setSentInvites(updatedInvites.data);
    } catch (error) {
      console.error('Error sending invitation:', error);
      alert('Failed to send invitation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'accepted': return 'Accepted';
      case 'pending': return 'Pending';
      case 'expired': return 'Expired';
      default: return 'Unknown';
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9FAFC' }}>
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4" style={{ color: '#1E65AD', fontFamily: 'Helvetica Hebrew Bold, sans-serif' }}>
            Invite Friends
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto" style={{ fontFamily: 'Roboto, sans-serif' }}>
            Send personalized invitations to your friends and family. 
            Help them discover सलहाकार and earn rewards for every successful referral.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Invite Form */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
            <h2 className="text-2xl font-bold mb-6" style={{ color: '#1E65AD', fontFamily: 'Helvetica Hebrew Bold, sans-serif' }}>
              Send Invitation
            </h2>
            
            <form onSubmit={handleSendInvite} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'Roboto, sans-serif' }}>
                  Friend's Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={inviteForm.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your friend's name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'Roboto, sans-serif' }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={inviteForm.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'Roboto, sans-serif' }}>
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={inviteForm.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'Roboto, sans-serif' }}>
                  Personal Message (Optional)
                </label>
                <textarea
                  name="message"
                  value={inviteForm.message}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add a personal message to your invitation..."
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors font-medium"
                style={{ fontFamily: 'Roboto, sans-serif' }}
              >
                {loading ? 'Sending...' : 'Send Invitation'}
              </button>
            </form>

            {/* Quick Share Options */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold mb-4" style={{ color: '#1E65AD', fontFamily: 'Helvetica Hebrew Bold, sans-serif' }}>
                Quick Share Options
              </h3>
              
              <div className="space-y-3">
                <button
                  onClick={() => {
                    const message = `Hi! I've been using सलहाकार for legal services and it's amazing! Join me using my referral code: ${referralCode}. Sign in at ${window.location.origin}/login?ref=${referralCode}`;
                    navigator.clipboard.writeText(message);
                    alert('Message copied to clipboard!');
                  }}
                  className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  style={{ fontFamily: 'Roboto, sans-serif' }}
                >
                  Copy WhatsApp Message
                </button>
                
                <button
                  onClick={() => {
                    const subject = 'Join me on सलहाकार - Legal Services Platform';
                    const body = `Hi there!\n\nI've been using सलहाकार for legal services and it's been incredibly helpful. I thought you might be interested too!\n\nUse my referral code: ${referralCode}\nSign in here: ${window.location.origin}/login?ref=${referralCode}\n\nBest regards!`;
                    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                    window.open(mailtoLink);
                  }}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  style={{ fontFamily: 'Roboto, sans-serif' }}
                >
                  Send Email Invitation
                </button>
              </div>
            </div>
          </div>

          {/* Sent Invites */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
            <h2 className="text-2xl font-bold mb-6" style={{ color: '#1E65AD', fontFamily: 'Helvetica Hebrew Bold, sans-serif' }}>
              Sent Invitations
            </h2>
            
            {sentInvites.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <p className="text-gray-500" style={{ fontFamily: 'Roboto, sans-serif' }}>
                  No invitations sent yet
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {sentInvites.map((invite) => (
                  <div key={invite.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-800" style={{ fontFamily: 'Roboto, sans-serif' }}>
                        {invite.name}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invite.status)}`}>
                        {getStatusText(invite.status)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2" style={{ fontFamily: 'Roboto, sans-serif' }}>
                      {invite.email}
                    </p>
                    <p className="text-xs text-gray-500" style={{ fontFamily: 'Roboto, sans-serif' }}>
                      Sent on {new Date(invite.sentDate).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/referral')}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
            style={{ fontFamily: 'Roboto, sans-serif' }}
          >
            Back to Referral Program
          </button>
        </div>
      </div>
    </div>
  );
}
