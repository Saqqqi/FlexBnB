'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import {
    CalendarDaysIcon,
    MapPinIcon,
    SparklesIcon,
    ClockIcon,
    SunIcon,
    BuildingOfficeIcon,
    TruckIcon,
    LightBulbIcon,
    PlusIcon,
    TrashIcon,
    ChevronDownIcon,
    ChevronUpIcon
} from '@heroicons/react/24/outline';

interface Activity {
    day: number;
    time: string;
    activity: string;
    duration: string;
    type: string;
    location: string;
}

interface Restaurant {
    day: number;
    meal: string;
    suggestion: string;
    cuisine: string;
    price_range: string;
    reservation_recommended: boolean;
}

interface Attraction {
    name: string;
    type: string;
    priority: string;
    estimated_time: string;
    best_time: string;
}

interface Transportation {
    type: string;
    tip: string;
    estimated_cost: string;
}

interface WeatherForecast {
    summary: string;
    temperature: {
        high: number;
        low: number;
        unit: string;
    };
    precipitation_chance: number;
    recommendation: string;
}

interface Itinerary {
    id: string;
    title: string;
    destination: string;
    start_date: string;
    end_date: string;
    duration_days: number;
    activities: Activity[];
    restaurants: Restaurant[];
    attractions: Attraction[];
    transportation: Transportation[];
    ai_suggestions: string[];
    weather_forecast: WeatherForecast;
}

const ItineraryPlanner = () => {
    const { getToken, isSignedIn, isLoaded } = useAuth();
    const router = useRouter();
    
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [itinerary, setItinerary] = useState<Itinerary | null>(null);
    const [myItineraries, setMyItineraries] = useState<Itinerary[]>([]);
    const [showMyItineraries, setShowMyItineraries] = useState(false);
    const [expandedDays, setExpandedDays] = useState<number[]>([1]);
    
    // Form state
    const [destination, setDestination] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [interests, setInterests] = useState<string[]>([]);
    const [pace, setPace] = useState('moderate');

    const interestOptions = [
        { id: 'adventure', label: 'Adventure', emoji: '🏔️' },
        { id: 'culture', label: 'Culture', emoji: '🏛️' },
        { id: 'food', label: 'Food', emoji: '🍽️' },
        { id: 'relaxation', label: 'Relaxation', emoji: '🧘' },
        { id: 'shopping', label: 'Shopping', emoji: '🛍️' },
        { id: 'nightlife', label: 'Nightlife', emoji: '🎉' },
        { id: 'nature', label: 'Nature', emoji: '🌿' },
        { id: 'history', label: 'History', emoji: '📜' },
    ];

    const paceOptions = [
        { id: 'relaxed', label: 'Relaxed', desc: '2 activities/day' },
        { id: 'moderate', label: 'Moderate', desc: '3-4 activities/day' },
        { id: 'packed', label: 'Packed', desc: '5+ activities/day' },
    ];

    useEffect(() => {
        if (isLoaded && !isSignedIn) {
            // User needs to be signed in
        } else if (isSignedIn) {
            fetchMyItineraries();
        }
    }, [isLoaded, isSignedIn]);

    const fetchMyItineraries = async () => {
        try {
            const token = await getToken();
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_HOST}/api/recommendation/itinerary/generate/`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    }
                }
            );
            if (response.ok) {
                const data = await response.json();
                setMyItineraries(data);
            }
        } catch (error) {
            console.error('Error fetching itineraries:', error);
        }
    };

    const toggleInterest = (id: string) => {
        setInterests(prev => 
            prev.includes(id) 
                ? prev.filter(i => i !== id)
                : [...prev, id]
        );
    };

    const generateItinerary = async () => {
        if (!destination || !startDate || !endDate) return;

        setLoading(true);
        try {
            const token = await getToken();
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_HOST}/api/recommendation/itinerary/generate/`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        destination,
                        start_date: startDate,
                        end_date: endDate,
                        interests,
                        pace
                    })
                }
            );

            if (!response.ok) throw new Error('Failed to generate itinerary');

            const data = await response.json();
            setItinerary(data);
            setStep(3);
        } catch (error) {
            console.error('Error generating itinerary:', error);
            alert('Failed to generate itinerary. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const toggleDay = (day: number) => {
        setExpandedDays(prev =>
            prev.includes(day)
                ? prev.filter(d => d !== day)
                : [...prev, day]
        );
    };

    if (!isLoaded) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!isSignedIn) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 pt-32 px-4">
                <div className="max-w-md mx-auto text-center">
                    <SparklesIcon className="w-16 h-16 text-indigo-500 mx-auto mb-6" />
                    <h1 className="text-3xl font-bold text-gray-800 mb-4">
                        Smart Itinerary Planner
                    </h1>
                    <p className="text-gray-600 mb-8">
                        Sign in to create personalized travel itineraries powered by AI.
                    </p>
                    <button
                        onClick={() => router.push('/')}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
                    >
                        Sign In to Continue
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 pt-24 pb-12 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full mb-4">
                        <SparklesIcon className="w-5 h-5" />
                        <span className="text-sm font-medium">AI-Powered Planning</span>
                    </div>
                    <h1 className="text-4xl font-bold text-gray-800 mb-2">
                        Smart Itinerary Planner
                    </h1>
                    <p className="text-gray-600">
                        Let AI create the perfect day-by-day travel plan for you
                    </p>
                </div>

                {/* Progress Steps */}
                {step < 3 && (
                    <div className="flex items-center justify-center mb-8">
                        <div className="flex items-center gap-4">
                            <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${step >= 1 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                <span className="w-6 h-6 flex items-center justify-center rounded-full bg-white/20 text-sm">1</span>
                                <span className="font-medium">Destination</span>
                            </div>
                            <div className="w-12 h-0.5 bg-gray-300"></div>
                            <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${step >= 2 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                <span className="w-6 h-6 flex items-center justify-center rounded-full bg-white/20 text-sm">2</span>
                                <span className="font-medium">Preferences</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* My Itineraries Toggle */}
                {myItineraries.length > 0 && step < 3 && (
                    <button
                        onClick={() => setShowMyItineraries(!showMyItineraries)}
                        className="w-full mb-6 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow flex items-center justify-between"
                    >
                        <span className="font-medium text-gray-700">
                            View My Saved Itineraries ({myItineraries.length})
                        </span>
                        {showMyItineraries ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
                    </button>
                )}

                {/* Step 1: Destination & Dates */}
                {step === 1 && (
                    <div className="bg-white rounded-2xl shadow-lg p-8">
                        <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                            <MapPinIcon className="w-6 h-6 text-indigo-600" />
                            Where are you going?
                        </h2>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Destination
                                </label>
                                <input
                                    type="text"
                                    value={destination}
                                    onChange={(e) => setDestination(e.target.value)}
                                    placeholder="e.g., Paris, Tokyo, New York"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Start Date
                                    </label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        min={new Date().toISOString().split('T')[0]}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        End Date
                                    </label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        min={startDate || new Date().toISOString().split('T')[0]}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={() => setStep(2)}
                                disabled={!destination || !startDate || !endDate}
                                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                            >
                                Continue to Preferences
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2: Preferences */}
                {step === 2 && (
                    <div className="bg-white rounded-2xl shadow-lg p-8">
                        <button
                            onClick={() => setStep(1)}
                            className="text-indigo-600 hover:text-indigo-700 mb-4 flex items-center gap-1"
                        >
                            ← Back
                        </button>

                        <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                            <SparklesIcon className="w-6 h-6 text-indigo-600" />
                            What are your interests?
                        </h2>

                        <div className="space-y-8">
                            {/* Interests */}
                            <div>
                                <p className="text-sm text-gray-500 mb-4">Select all that apply</p>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {interestOptions.map((option) => (
                                        <button
                                            key={option.id}
                                            onClick={() => toggleInterest(option.id)}
                                            className={`p-4 rounded-xl border-2 transition-all ${
                                                interests.includes(option.id)
                                                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                                                    : 'border-gray-200 hover:border-indigo-300'
                                            }`}
                                        >
                                            <span className="text-2xl block mb-1">{option.emoji}</span>
                                            <span className="text-sm font-medium">{option.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Pace */}
                            <div>
                                <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center gap-2">
                                    <ClockIcon className="w-5 h-5 text-indigo-600" />
                                    Travel Pace
                                </h3>
                                <div className="grid grid-cols-3 gap-3">
                                    {paceOptions.map((option) => (
                                        <button
                                            key={option.id}
                                            onClick={() => setPace(option.id)}
                                            className={`p-4 rounded-xl border-2 transition-all text-center ${
                                                pace === option.id
                                                    ? 'border-indigo-600 bg-indigo-50'
                                                    : 'border-gray-200 hover:border-indigo-300'
                                            }`}
                                        >
                                            <span className="font-medium block">{option.label}</span>
                                            <span className="text-xs text-gray-500">{option.desc}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={generateItinerary}
                                disabled={loading}
                                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Generating Your Itinerary...
                                    </>
                                ) : (
                                    <>
                                        <SparklesIcon className="w-5 h-5" />
                                        Generate Smart Itinerary
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Generated Itinerary */}
                {step === 3 && itinerary && (
                    <div className="space-y-6">
                        {/* Itinerary Header */}
                        <div className="bg-white rounded-2xl shadow-lg p-6">
                            <button
                                onClick={() => {
                                    setStep(1);
                                    setItinerary(null);
                                }}
                                className="text-indigo-600 hover:text-indigo-700 mb-4 flex items-center gap-1"
                            >
                                ← Create New Itinerary
                            </button>

                            <div className="flex items-start justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-800">{itinerary.title}</h2>
                                    <div className="flex items-center gap-4 mt-2 text-gray-600">
                                        <span className="flex items-center gap-1">
                                            <MapPinIcon className="w-4 h-4" />
                                            {itinerary.destination}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <CalendarDaysIcon className="w-4 h-4" />
                                            {itinerary.duration_days} days
                                        </span>
                                    </div>
                                </div>
                                <div className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                                    AI Generated
                                </div>
                            </div>

                            {/* Weather */}
                            {itinerary.weather_forecast && (
                                <div className="mt-4 p-4 bg-blue-50 rounded-xl flex items-center gap-4">
                                    <SunIcon className="w-8 h-8 text-yellow-500" />
                                    <div>
                                        <p className="font-medium text-gray-800">{itinerary.weather_forecast.summary}</p>
                                        <p className="text-sm text-gray-600">
                                            {itinerary.weather_forecast.temperature.high}°/{itinerary.weather_forecast.temperature.low}° • 
                                            {itinerary.weather_forecast.precipitation_chance}% rain chance
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">{itinerary.weather_forecast.recommendation}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* AI Suggestions */}
                        {itinerary.ai_suggestions && itinerary.ai_suggestions.length > 0 && (
                            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6">
                                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    <LightBulbIcon className="w-5 h-5 text-amber-600" />
                                    AI Tips for Your Trip
                                </h3>
                                <div className="space-y-2">
                                    {itinerary.ai_suggestions.map((tip, idx) => (
                                        <p key={idx} className="text-gray-700">{tip}</p>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Day-by-Day Activities */}
                        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                            <div className="p-6 border-b">
                                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                    <CalendarDaysIcon className="w-5 h-5 text-indigo-600" />
                                    Day-by-Day Itinerary
                                </h3>
                            </div>

                            {Array.from({ length: itinerary.duration_days }, (_, i) => i + 1).map((day) => {
                                const dayActivities = itinerary.activities.filter(a => a.day === day);
                                const dayRestaurants = itinerary.restaurants.filter(r => r.day === day);
                                const isExpanded = expandedDays.includes(day);

                                return (
                                    <div key={day} className="border-b last:border-b-0">
                                        <button
                                            onClick={() => toggleDay(day)}
                                            className="w-full p-4 flex items-center justify-between hover:bg-gray-50"
                                        >
                                            <span className="font-medium text-gray-800">
                                                Day {day}
                                            </span>
                                            {isExpanded ? (
                                                <ChevronUpIcon className="w-5 h-5 text-gray-400" />
                                            ) : (
                                                <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                                            )}
                                        </button>

                                        {isExpanded && (
                                            <div className="px-4 pb-4 space-y-3">
                                                {dayActivities.map((activity, idx) => (
                                                    <div key={idx} className="flex items-start gap-3 p-3 bg-indigo-50 rounded-lg">
                                                        <div className="w-16 text-sm font-medium text-indigo-600">
                                                            {activity.time}
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="font-medium text-gray-800">{activity.activity}</p>
                                                            <p className="text-sm text-gray-500">
                                                                {activity.duration} • {activity.location}
                                                            </p>
                                                        </div>
                                                        <span className="px-2 py-1 bg-white text-xs text-indigo-600 rounded">
                                                            {activity.type}
                                                        </span>
                                                    </div>
                                                ))}

                                                {dayRestaurants.length > 0 && (
                                                    <div className="mt-4">
                                                        <p className="text-sm font-medium text-gray-500 mb-2">🍽️ Dining Suggestions</p>
                                                        <div className="grid grid-cols-3 gap-2">
                                                            {dayRestaurants.map((r, idx) => (
                                                                <div key={idx} className="p-2 bg-orange-50 rounded-lg text-center">
                                                                    <p className="text-xs text-gray-500 capitalize">{r.meal}</p>
                                                                    <p className="text-sm font-medium text-gray-700">{r.suggestion}</p>
                                                                    <p className="text-xs text-gray-500">{r.price_range}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Must-See Attractions */}
                        {itinerary.attractions && itinerary.attractions.length > 0 && (
                            <div className="bg-white rounded-2xl shadow-lg p-6">
                                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    <BuildingOfficeIcon className="w-5 h-5 text-indigo-600" />
                                    Must-See Attractions
                                </h3>
                                <div className="grid gap-3">
                                    {itinerary.attractions.map((attraction, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                            <div>
                                                <p className="font-medium text-gray-800">{attraction.name}</p>
                                                <p className="text-sm text-gray-500">
                                                    {attraction.estimated_time} • Best: {attraction.best_time}
                                                </p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                attraction.priority === 'must-see' 
                                                    ? 'bg-red-100 text-red-700' 
                                                    : 'bg-blue-100 text-blue-700'
                                            }`}>
                                                {attraction.priority}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Transportation Tips */}
                        {itinerary.transportation && itinerary.transportation.length > 0 && (
                            <div className="bg-white rounded-2xl shadow-lg p-6">
                                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    <TruckIcon className="w-5 h-5 text-indigo-600" />
                                    Getting Around
                                </h3>
                                <div className="space-y-3">
                                    {itinerary.transportation.map((tip, idx) => (
                                        <div key={idx} className="p-4 bg-green-50 rounded-xl">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-medium text-gray-800 capitalize">{tip.type}</span>
                                                <span className="text-sm text-green-600">{tip.estimated_cost}</span>
                                            </div>
                                            <p className="text-sm text-gray-600">{tip.tip}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ItineraryPlanner;

