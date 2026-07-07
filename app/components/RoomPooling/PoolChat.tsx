'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { PoolChatMessage } from './types';
import {
  PaperAirplaneIcon,
  UserCircleIcon,
  InformationCircleIcon,
  CurrencyDollarIcon,
  UserPlusIcon,
  UserMinusIcon,
} from '@heroicons/react/24/outline';

interface PoolChatProps {
  poolId: string;
  poolTitle?: string;
}

const PoolChat: React.FC<PoolChatProps> = ({ poolId, poolTitle }) => {
  const { getToken, isSignedIn } = useAuth();
  const [messages, setMessages] = useState<PoolChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    if (!isSignedIn) return;
    
    try {
      const token = await getToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_HOST}/api/roompooling/pools/${poolId}/chat/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (res.ok) {
        const data = await res.json();
        setMessages((data.results || []).reverse());
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    
    // Poll for new messages every 5 seconds
    pollIntervalRef.current = setInterval(fetchMessages, 5000);
    
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [poolId, isSignedIn]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !isSignedIn || sending) return;
    
    try {
      setSending(true);
      const token = await getToken();
      
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_HOST}/api/roompooling/pools/${poolId}/chat/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ message: newMessage }),
        }
      );
      
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, data]);
        setNewMessage('');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'system':
        return <InformationCircleIcon className="w-4 h-4 text-blue-500" />;
      case 'payment':
        return <CurrencyDollarIcon className="w-4 h-4 text-emerald-500" />;
      case 'join':
        return <UserPlusIcon className="w-4 h-4 text-green-500" />;
      case 'leave':
        return <UserMinusIcon className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + 
        ' ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }
  };

  if (!isSignedIn) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
        <p className="text-gray-600">Sign in to access pool chat</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden flex flex-col h-[500px]">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white">
        <h3 className="font-semibold text-lg">Pool Chat</h3>
        {poolTitle && <p className="text-sm text-white/80">{poolTitle}</p>}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <p className="text-lg font-medium">No messages yet</p>
            <p className="text-sm">Be the first to say hello!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id}>
              {/* System/special messages */}
              {msg.message_type !== 'text' ? (
                <div className="flex items-center justify-center gap-2 py-2">
                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-600">
                    {getMessageIcon(msg.message_type)}
                    <span>{msg.message}</span>
                  </div>
                </div>
              ) : (
                /* Regular messages */
                <div
                  className={`flex ${msg.is_mine ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`flex items-end gap-2 max-w-[75%] ${
                      msg.is_mine ? 'flex-row-reverse' : ''
                    }`}
                  >
                    {/* Avatar */}
                    {!msg.is_mine && (
                      <div className="flex-shrink-0">
                        {msg.sender_avatar ? (
                          <img
                            src={msg.sender_avatar}
                            alt={msg.sender_name}
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-medium">
                            {msg.sender_name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Message bubble */}
                    <div
                      className={`px-4 py-2 rounded-2xl ${
                        msg.is_mine
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-sm'
                          : 'bg-white text-gray-900 shadow-sm rounded-bl-sm'
                      }`}
                    >
                      {!msg.is_mine && (
                        <p className="text-xs font-medium text-indigo-600 mb-1">
                          {msg.sender_name}
                        </p>
                      )}
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {msg.message}
                      </p>
                      <p
                        className={`text-xs mt-1 ${
                          msg.is_mine ? 'text-white/70' : 'text-gray-400'
                        }`}
                      >
                        {formatTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="p-4 bg-white border-t border-gray-100">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 border border-gray-200 rounded-full focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="p-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default PoolChat;

