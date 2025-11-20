import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, Send, Phone, Mail, Video, MoreVertical,
  User, Clock, CheckCircle, AlertCircle, Paperclip, Smile
} from 'lucide-react';
import { getApiUrl } from '@/utils/backend';

interface ChatSystemProps {
  agentId?: string;
  clientId?: string;
  propertyId?: string;
  isAgent?: boolean;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  message_type: 'text' | 'image' | 'file' | 'system';
  timestamp: string;
  read: boolean;
  sender_name: string;
  sender_type: 'agent' | 'client' | 'admin';
}

interface ChatSession {
  id: string;
  agent_id: string;
  client_id: string;
  property_id: string;
  status: 'active' | 'closed' | 'pending';
  created_at: string;
  last_message_at: string;
  agent_name: string;
  client_name: string;
  property_title: string;
}

const ChatSystem: React.FC<ChatSystemProps> = ({ 
  agentId, 
  clientId, 
  propertyId, 
  isAgent = false 
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchChatSessions();
  }, [agentId, clientId]);

  useEffect(() => {
    if (activeSession) {
      fetchMessages(activeSession.id);
    }
  }, [activeSession]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchChatSessions = async () => {
    try {
      setLoading(true);
      const apiKey = import.meta.env.VITE_PYTHON_API_KEY || 'g7lshzFb55RKuskTH0WOu_oC7MW5hNE1lmgS2wBflZCyHV6CUk9b4wxSjAnXYYXj';
      const headers = { 'X-API-Key': apiKey };

      let url = getApiUrl('/api/chat/sessions');
      if (isAgent && agentId) {
        url += `?agent_id=${agentId}`;
      } else if (clientId) {
        url += `?client_id=${clientId}`;
      }

      const response = await fetch(url, { headers });
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
        
        // Auto-select first session if none selected
        if (!activeSession && data.sessions?.length > 0) {
          setActiveSession(data.sessions[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching chat sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (sessionId: string) => {
    try {
      const apiKey = import.meta.env.VITE_PYTHON_API_KEY || 'g7lshzFb55RKuskTH0WOu_oC7MW5hNE1lmgS2wBflZCyHV6CUk9b4wxSjAnXYYXj';
      const headers = { 'X-API-Key': apiKey };

      const response = await fetch(getApiUrl(`/api/chat/sessions/${sessionId}/messages`), { headers });
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeSession || sending) return;

    try {
      setSending(true);
      const apiKey = import.meta.env.VITE_PYTHON_API_KEY || 'g7lshzFb55RKuskTH0WOu_oC7MW5hNE1lmgS2wBflZCyHV6CUk9b4wxSjAnXYYXj';
      
      const messageData = {
        session_id: activeSession.id,
        message: newMessage.trim(),
        message_type: 'text',
        receiver_id: isAgent ? activeSession.client_id : activeSession.agent_id
      };

      const response = await fetch(getApiUrl('/api/chat/messages'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        },
        body: JSON.stringify(messageData)
      });

      if (response.ok) {
        const newMsg = await response.json();
        setMessages(prev => [...prev, newMsg]);
        setNewMessage('');
        
        // Update session's last message time
        setSessions(prev => 
          prev.map(session => 
            session.id === activeSession.id 
              ? { ...session, last_message_at: newMsg.timestamp }
              : session
          )
        );
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const initiateCall = async (type: 'voice' | 'video') => {
    if (!activeSession) return;
    
    try {
      const apiKey = import.meta.env.VITE_PYTHON_API_KEY || 'g7lshzFb55RKuskTH0WOu_oC7MW5hNE1lmgS2wBflZCyHV6CUk9b4wxSjAnXYYXj';
      
      const callData = {
        session_id: activeSession.id,
        call_type: type,
        initiator_id: isAgent ? activeSession.agent_id : activeSession.client_id,
        receiver_id: isAgent ? activeSession.client_id : activeSession.agent_id
      };

      const response = await fetch(getApiUrl('/api/chat/initiate-call'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        },
        body: JSON.stringify(callData)
      });

      if (response.ok) {
        // Handle call initiation (would integrate with WebRTC in real implementation)
        console.log(`${type} call initiated`);
      }
    } catch (error) {
      console.error('Error initiating call:', error);
    }
  };

  const sendEmail = () => {
    if (!activeSession) return;
    
    const recipientEmail = isAgent ? activeSession.client_id : activeSession.agent_id;
    const subject = `Re: ${activeSession.property_title}`;
    const body = `Hello,\n\nI would like to discuss the property: ${activeSession.property_title}\n\nBest regards`;
    
    window.open(`mailto:${recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-[600px] bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Sessions Sidebar */}
      <div className="w-1/3 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {isAgent ? 'Client Conversations' : 'Agent Conversations'}
          </h3>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {sessions.map((session) => (
            <div
              key={session.id}
              onClick={() => setActiveSession(session)}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                activeSession?.id === session.id ? 'bg-blue-50 border-blue-200' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {isAgent ? session.client_name : session.agent_name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {session.property_title}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    session.status === 'active' ? 'bg-green-100 text-green-800' :
                    session.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {session.status}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatTime(session.last_message_at)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeSession ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">
                      {isAgent ? activeSession.client_name : activeSession.agent_name}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {activeSession.property_title}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => initiateCall('voice')}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg"
                    title="Voice Call"
                  >
                    <Phone className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => initiateCall('video')}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg"
                    title="Video Call"
                  >
                    <Video className="h-4 w-4" />
                  </button>
                  <button
                    onClick={sendEmail}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg"
                    title="Send Email"
                  >
                    <Mail className="h-4 w-4" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message, index) => {
                const isCurrentUser = message.sender_id === (isAgent ? activeSession.agent_id : activeSession.client_id);
                const showDate = index === 0 || 
                  formatDate(message.timestamp) !== formatDate(messages[index - 1].timestamp);

                return (
                  <div key={message.id}>
                    {showDate && (
                      <div className="text-center text-xs text-gray-500 py-2">
                        {formatDate(message.timestamp)}
                      </div>
                    )}
                    
                    <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        isCurrentUser 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-200 text-gray-900'
                      }`}>
                        <p className="text-sm">{message.message}</p>
                        <div className={`flex items-center mt-1 text-xs ${
                          isCurrentUser ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          <span>{formatTime(message.timestamp)}</span>
                          {isCurrentUser && (
                            <CheckCircle className="h-3 w-3 ml-1" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg"
                  title="Attach File"
                >
                  <Paperclip className="h-4 w-4" />
                </button>
                
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={sending}
                  />
                </div>
                
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg"
                  title="Emoji"
                >
                  <Smile className="h-4 w-4" />
                </button>
                
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sending}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Send Message"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*,.pdf,.doc,.docx"
                onChange={(e) => {
                  // Handle file upload
                  console.log('File selected:', e.target.files?.[0]);
                }}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Select a conversation to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatSystem;
