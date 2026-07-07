'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { 
    ChatBubbleLeftRightIcon, 
    XMarkIcon, 
    PaperAirplaneIcon,
    SparklesIcon,
    HomeIcon,
    CalendarIcon,
    CurrencyDollarIcon,
    QuestionMarkCircleIcon,
    MinusIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface ChatMessage {
    id: string;
    type: 'user' | 'bot';
    message: string;
    timestamp: Date;
    suggestions?: Array<{ text: string; action?: string; url?: string }>;
    properties?: any[];
    actions?: Array<{ text: string; url?: string; action?: string }>;
    follow_up?: string[];
}

const TravelChatbot = () => {
    const { getToken, isSignedIn } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            // Send greeting when chat opens
            handleBotResponse({
                response: "Hello! 👋 Welcome to FlexBnB! I'm your AI travel assistant. How can I help you today?",
                suggestions: [
                    { text: '🔍 Search properties', action: 'search' },
                    { text: '💡 Get recommendations', action: 'recommend' },
                    { text: '💰 Check prices', action: 'pricing' },
                    { text: '📅 Plan a trip', action: 'itinerary' }
                ],
                follow_up: [
                    'Where would you like to stay?',
                    'What type of property are you looking for?'
                ]
            });
        }
        if (isOpen) {
            inputRef.current?.focus();
        }
    }, [isOpen]);

    const handleBotResponse = (data: any) => {
        const botMessage: ChatMessage = {
            id: `bot_${Date.now()}`,
            type: 'bot',
            message: data.response,
            timestamp: new Date(),
            suggestions: data.suggestions,
            properties: data.properties,
            actions: data.actions,
            follow_up: data.follow_up
        };
        setMessages(prev => [...prev, botMessage]);
    };

    const sendMessage = async (text: string) => {
        if (!text.trim()) return;

        // Add user message
        const userMessage: ChatMessage = {
            id: `user_${Date.now()}`,
            type: 'user',
            message: text,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsTyping(true);

        try {
            const headers: HeadersInit = {
                'Content-Type': 'application/json',
            };

            if (isSignedIn) {
                const token = await getToken();
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }
            }

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_HOST}/api/recommendation/chatbot/`,
                {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        message: text,
                        session_id: sessionId
                    })
                }
            );

            if (!response.ok) throw new Error('Failed to send message');

            const data = await response.json();
            handleBotResponse(data);
        } catch (error) {
            console.error('Chatbot error:', error);
            handleBotResponse({
                response: "I'm having trouble connecting right now. Please try again in a moment! 🔄"
            });
        } finally {
            setIsTyping(false);
        }
    };

    const handleSuggestionClick = (suggestion: { text: string; action?: string; url?: string }) => {
        if (suggestion.url) {
            window.location.href = suggestion.url;
        } else if (suggestion.action) {
            // Convert action to a natural language query
            const actionQueries: Record<string, string> = {
                search: 'I want to search for properties',
                recommend: 'Give me some recommendations',
                pricing: 'Tell me about pricing',
                itinerary: 'Help me plan a trip',
                support: 'I need help with something'
            };
            sendMessage(actionQueries[suggestion.action] || suggestion.text);
        } else {
            sendMessage(suggestion.text);
        }
    };

    const quickActions = [
        { icon: HomeIcon, label: 'Properties', action: 'search' },
        { icon: SparklesIcon, label: 'Recommend', action: 'recommend' },
        { icon: CurrencyDollarIcon, label: 'Prices', action: 'pricing' },
        { icon: CalendarIcon, label: 'Plan Trip', action: 'itinerary' },
    ];

    return (
        <>
            {/* Floating Chat Button */}
            <button
                onClick={() => setIsOpen(true)}
                className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 p-3 sm:p-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 z-50 ${isOpen ? 'hidden' : ''}`}
            >
                <ChatBubbleLeftRightIcon className="w-6 h-6 sm:w-7 sm:h-7" />
                <span className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></span>
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-0 right-0 sm:bottom-4 sm:right-4 w-full h-[75vh] sm:w-[350px] sm:h-[450px] md:w-[370px] md:h-[480px] lg:w-[390px] lg:h-[500px] max-h-[calc(100vh-100px)] bg-white sm:rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden border-0 sm:border border-gray-200">
                    {/* Header - Compact */}
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-3 py-2 sm:px-4 sm:py-2.5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-white/20 rounded-full flex items-center justify-center">
                                        <SparklesIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </div>
                                    <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-400 rounded-full border border-indigo-600"></span>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-sm">FlexBnB Assistant</h3>
                                    <p className="text-[10px] text-white/70">AI Travel Help</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button 
                                    onClick={() => setIsOpen(false)}
                                    className="p-1.5 hover:bg-white/30 bg-white/10 rounded-md transition-colors"
                                    title="Minimize"
                                >
                                    <MinusIcon className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => setIsOpen(false)}
                                    className="p-1.5 hover:bg-red-500 bg-white/10 rounded-md transition-colors"
                                    title="Close chat"
                                >
                                    <XMarkIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions - Compact */}
                    <div className="flex justify-around px-2 py-1.5 bg-gray-50 border-b">
                        {quickActions.map((action, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleSuggestionClick({ action: action.action, text: action.label })}
                                className="flex flex-col items-center p-1 hover:bg-indigo-50 rounded-md transition-colors group"
                            >
                                <action.icon className="w-4 h-4 text-gray-500 group-hover:text-indigo-600" />
                                <span className="text-[9px] sm:text-[10px] text-gray-500 group-hover:text-indigo-600 mt-0.5">
                                    {action.label}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 bg-gray-50">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                                        msg.type === 'user'
                                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-md'
                                            : 'bg-white text-gray-800 shadow-sm border rounded-bl-md'
                                    }`}
                                >
                                    <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                                    
                                    {/* Property Cards */}
                                    {msg.properties && msg.properties.length > 0 && (
                                        <div className="mt-3 space-y-2">
                                            {msg.properties.slice(0, 3).map((prop: any, idx: number) => (
                                                <Link
                                                    key={idx}
                                                    href={`/properties/${prop.id}`}
                                                    className="block p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        {prop.image_url && (
                                                            <img 
                                                                src={prop.image_url} 
                                                                alt={prop.title}
                                                                className="w-12 h-12 rounded object-cover"
                                                            />
                                                        )}
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium truncate">{prop.title}</p>
                                                            <p className="text-xs text-gray-500">
                                                                ${prop.price_per_night}/night • {prop.country}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    )}

                                    {/* Suggestions */}
                                    {msg.suggestions && msg.suggestions.length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {msg.suggestions.map((sug, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => handleSuggestionClick(sug)}
                                                    className="px-3 py-1.5 text-xs bg-indigo-50 text-indigo-700 rounded-full hover:bg-indigo-100 transition-colors"
                                                >
                                                    {sug.text}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Actions */}
                                    {msg.actions && msg.actions.length > 0 && (
                                        <div className="mt-3 space-y-1">
                                            {msg.actions.map((action, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => action.url ? window.location.href = action.url : handleSuggestionClick(action)}
                                                    className="w-full px-3 py-2 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-left"
                                                >
                                                    {action.text}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Typing Indicator */}
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="bg-white text-gray-800 shadow-sm border rounded-2xl rounded-bl-md px-4 py-3">
                                    <div className="flex gap-1">
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area - Compact */}
                    <div className="p-2 sm:p-3 bg-white border-t">
                        <form 
                            onSubmit={(e) => {
                                e.preventDefault();
                                sendMessage(inputValue);
                            }}
                            className="flex items-center gap-2"
                        >
                            <input
                                ref={inputRef}
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="Ask me anything..."
                                className="flex-1 px-3 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                                disabled={isTyping}
                            />
                            <button
                                type="submit"
                                disabled={!inputValue.trim() || isTyping}
                                className="p-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex-shrink-0"
                            >
                                <PaperAirplaneIcon className="w-4 h-4" />
                            </button>
                        </form>
                        <p className="text-[9px] text-center text-gray-400 mt-1">
                            Powered by AI
                        </p>
                    </div>
                </div>
            )}
        </>
    );
};

export default TravelChatbot;

