"use client";
import { useEffect, useState } from 'react';
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { 
  ChatBubbleLeftRightIcon, 
  PaperAirplaneIcon,
  UserIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import DashboardLayout from '../../components/Host/DashboardLayout';
import StatsCard from '../../components/Host/StatsCard';

interface Message {
  id: string;
  sender: {
    id: string;
    name: string;
    email: string;
  };
  receiver: {
    id: string;
    name: string;
    email: string;
  };
  message: string;
  is_read: boolean;
  created_at: string;
  reservation_property: string;
}

interface Conversation {
  id: string;
  guest: {
    id: string;
    name: string;
    email: string;
  };
  property: {
    id: string;
    title: string;
  };
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: Message[];
}

const MessagesPage = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data for demonstration
    const mockConversations: Conversation[] = [
      {
        id: '1',
        guest: { id: '1', name: 'John Doe', email: 'john@example.com' },
        property: { id: '1', title: 'Modern Apartment Downtown' },
        lastMessage: 'What time is check-in available?',
        lastMessageTime: '2024-02-14T15:30:00Z',
        unreadCount: 2,
        messages: [
          {
            id: '1',
            sender: { id: '1', name: 'John Doe', email: 'john@example.com' },
            receiver: { id: 'host', name: 'Host', email: 'host@example.com' },
            message: 'Hi! I have a booking for this weekend.',
            is_read: true,
            created_at: '2024-02-14T14:00:00Z',
            reservation_property: 'Modern Apartment Downtown'
          },
          {
            id: '2',
            sender: { id: 'host', name: 'Host', email: 'host@example.com' },
            receiver: { id: '1', name: 'John Doe', email: 'john@example.com' },
            message: 'Hello John! Yes, I see your reservation. How can I help you?',
            is_read: true,
            created_at: '2024-02-14T14:15:00Z',
            reservation_property: 'Modern Apartment Downtown'
          },
          {
            id: '3',
            sender: { id: '1', name: 'John Doe', email: 'john@example.com' },
            receiver: { id: 'host', name: 'Host', email: 'host@example.com' },
            message: 'What time is check-in available?',
            is_read: false,
            created_at: '2024-02-14T15:30:00Z',
            reservation_property: 'Modern Apartment Downtown'
          }
        ]
      },
      {
        id: '2',
        guest: { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
        property: { id: '2', title: 'Cozy Studio' },
        lastMessage: 'Thank you for the quick response!',
        lastMessageTime: '2024-02-13T09:45:00Z',
        unreadCount: 0,
        messages: [
          {
            id: '4',
            sender: { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
            receiver: { id: 'host', name: 'Host', email: 'host@example.com' },
            message: 'Is parking available at the property?',
            is_read: true,
            created_at: '2024-02-13T09:00:00Z',
            reservation_property: 'Cozy Studio'
          },
          {
            id: '5',
            sender: { id: 'host', name: 'Host', email: 'host@example.com' },
            receiver: { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
            message: 'Yes, there is free street parking available.',
            is_read: true,
            created_at: '2024-02-13T09:30:00Z',
            reservation_property: 'Cozy Studio'
          },
          {
            id: '6',
            sender: { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
            receiver: { id: 'host', name: 'Host', email: 'host@example.com' },
            message: 'Thank you for the quick response!',
            is_read: true,
            created_at: '2024-02-13T09:45:00Z',
            reservation_property: 'Cozy Studio'
          }
        ]
      }
    ];

    setConversations(mockConversations);
    setSelectedConversation(mockConversations[0]);
    setLoading(false);
  }, []);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const message: Message = {
      id: Date.now().toString(),
      sender: { id: 'host', name: 'Host', email: 'host@example.com' },
      receiver: selectedConversation.guest,
      message: newMessage,
      is_read: false,
      created_at: new Date().toISOString(),
      reservation_property: selectedConversation.property.title
    };

    setSelectedConversation(prev => {
      if (!prev) return null;
      return {
        ...prev,
        messages: [...prev.messages, message],
        lastMessage: newMessage,
        lastMessageTime: new Date().toISOString()
      };
    });

    setConversations(prev => 
      prev.map(conv => 
        conv.id === selectedConversation.id 
          ? {
              ...conv,
              messages: [...conv.messages, message],
              lastMessage: newMessage,
              lastMessageTime: new Date().toISOString()
            }
          : conv
      )
    );

    setNewMessage('');
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString();
  };

  // Calculate stats
  const stats = {
    totalConversations: conversations.length,
    unreadMessages: conversations.reduce((sum, conv) => sum + conv.unreadCount, 0),
    activeToday: conversations.filter(conv => 
      new Date(conv.lastMessageTime).toDateString() === new Date().toDateString()
    ).length
  };

  if (loading) {
    return (
      <DashboardLayout title="Messages" subtitle="Communicate with your guests">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <SignedIn>
        <DashboardLayout title="Messages" subtitle="Communicate with your guests">
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatsCard
                title="Total Conversations"
                value={stats.totalConversations}
                icon={<ChatBubbleLeftRightIcon className="h-6 w-6 text-blue-600" />}
              />
              <StatsCard
                title="Unread Messages"
                value={stats.unreadMessages}
                icon={<UserIcon className="h-6 w-6 text-red-600" />}
              />
              <StatsCard
                title="Active Today"
                value={stats.activeToday}
                icon={<CalendarIcon className="h-6 w-6 text-green-600" />}
              />
            </div>

            {/* Messages Interface */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="flex h-[600px]">
                {/* Conversations List */}
                <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Conversations</h3>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {conversations.map((conversation) => (
                      <div
                        key={conversation.id}
                        onClick={() => setSelectedConversation(conversation)}
                        className={`p-4 cursor-pointer hover:bg-gray-50 ${
                          selectedConversation?.id === conversation.id ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{conversation.guest.name}</h4>
                          {conversation.unreadCount > 0 && (
                            <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                              {conversation.unreadCount}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{conversation.property.title}</p>
                        <p className="text-xs text-gray-500 truncate">{conversation.lastMessage}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDate(conversation.lastMessageTime)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Chat Interface */}
                <div className="flex-1 flex flex-col">
                  {selectedConversation ? (
                    <>
                      {/* Chat Header */}
                      <div className="p-4 border-b border-gray-200 bg-gray-50">
                        <h3 className="font-semibold text-gray-900">
                          {selectedConversation.guest.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {selectedConversation.property.title} • {selectedConversation.guest.email}
                        </p>
                      </div>

                      {/* Messages */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {selectedConversation.messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${
                              message.sender.id === 'host' ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <div
                              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                message.sender.id === 'host'
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-200 text-gray-900'
                              }`}
                            >
                              <p className="text-sm">{message.message}</p>
                              <p
                                className={`text-xs mt-1 ${
                                  message.sender.id === 'host'
                                    ? 'text-blue-100'
                                    : 'text-gray-500'
                                }`}
                              >
                                {formatTime(message.created_at)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Message Input */}
                      <div className="p-4 border-t border-gray-200">
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Type a message..."
                            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <button
                            onClick={handleSendMessage}
                            disabled={!newMessage.trim()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <PaperAirplaneIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-center text-gray-500">
                        <ChatBubbleLeftRightIcon className="h-12 w-12 mx-auto mb-4" />
                        <p>Select a conversation to start messaging</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Response Templates */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Response Templates</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <button
                  onClick={() => setNewMessage('Check-in is available from 3:00 PM. I\'ll send you the access instructions closer to your arrival date.')}
                  className="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <p className="font-medium text-gray-900">Check-in Instructions</p>
                  <p className="text-sm text-gray-600">Standard check-in response</p>
                </button>
                <button
                  onClick={() => setNewMessage('Thank you for your booking! I\'m here to help if you have any questions about your stay.')}
                  className="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <p className="font-medium text-gray-900">Welcome Message</p>
                  <p className="text-sm text-gray-600">Greeting for new guests</p>
                </button>
                <button
                  onClick={() => setNewMessage('Check-out is by 11:00 AM. Please leave the keys on the counter and lock the door behind you.')}
                  className="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <p className="font-medium text-gray-900">Check-out Instructions</p>
                  <p className="text-sm text-gray-600">Standard check-out response</p>
                </button>
              </div>
            </div>
          </div>
        </DashboardLayout>
      </SignedIn>
      
      <SignedOut>
        <div className="flex flex-col items-center justify-center h-screen">
          <p className="mb-4 text-lg">You must be signed in to view Messages.</p>
          <SignInButton />
        </div>
      </SignedOut>
    </>
  );
};

export default MessagesPage; 