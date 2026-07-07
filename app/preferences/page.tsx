'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import {
    UserCircleIcon,
    CogIcon,
    HeartIcon,
    MapPinIcon,
    CurrencyDollarIcon,
    HomeIcon,
    SparklesIcon,
    BellIcon,
    CheckIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface UserPreference {
    preferred_categories: string[];
    preferred_countries: string[];
    min_bedrooms: number;
    max_price_per_night: number | null;
    budget_preference: string;
    travel_style: string;
    preferred_amenities: string[];
    typical_group_size: number;
    prefers_pet_friendly: boolean;
    prefers_accessibility: boolean;
    price_drop_alerts: boolean;
    new_listing_alerts: boolean;
}

const PreferencesPage = () => {
    const { getToken, isSignedIn, isLoaded } = useAuth();
    const router = useRouter();
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [preferences, setPreferences] = useState<UserPreference>({
        preferred_categories: [],
        preferred_countries: [],
        min_bedrooms: 1,
        max_price_per_night: null,
        budget_preference: 'any',
        travel_style: 'relaxation',
        preferred_amenities: [],
        typical_group_size: 2,
        prefers_pet_friendly: false,
        prefers_accessibility: false,
        price_drop_alerts: true,
        new_listing_alerts: true,
    });

    const categories = [
        { id: 'Beach', label: 'Beach', emoji: '🏖️' },
        { id: 'Mountain', label: 'Mountain', emoji: '🏔️' },
        { id: 'City', label: 'City', emoji: '🏙️' },
        { id: 'Countryside', label: 'Countryside', emoji: '🌾' },
        { id: 'Lake', label: 'Lakefront', emoji: '🏞️' },
        { id: 'Tropical', label: 'Tropical', emoji: '🌴' },
        { id: 'Ski', label: 'Ski Resort', emoji: '⛷️' },
        { id: 'Desert', label: 'Desert', emoji: '🏜️' },
    ];

    const budgetOptions = [
        { id: 'budget', label: 'Budget-Friendly', desc: 'Under $100/night' },
        { id: 'moderate', label: 'Moderate', desc: '$100-200/night' },
        { id: 'luxury', label: 'Luxury', desc: '$200+/night' },
        { id: 'any', label: 'Any Budget', desc: 'Show everything' },
    ];

    const travelStyles = [
        { id: 'adventure', label: 'Adventure', emoji: '🎒' },
        { id: 'relaxation', label: 'Relaxation', emoji: '😌' },
        { id: 'business', label: 'Business', emoji: '💼' },
        { id: 'family', label: 'Family', emoji: '👨‍👩‍👧‍👦' },
        { id: 'romantic', label: 'Romantic', emoji: '💕' },
        { id: 'solo', label: 'Solo', emoji: '🎭' },
    ];

    const amenities = [
        'WiFi', 'Pool', 'Kitchen', 'Parking', 'AC', 'Washer', 
        'Gym', 'Hot Tub', 'Fireplace', 'Beach Access', 'Workspace'
    ];

    const countries = [
        'United States', 'France', 'Italy', 'Spain', 'Japan', 
        'Thailand', 'Mexico', 'Greece', 'Portugal', 'Australia'
    ];

    useEffect(() => {
        if (isLoaded && isSignedIn) {
            fetchPreferences();
        } else if (isLoaded && !isSignedIn) {
            setLoading(false);
        }
    }, [isLoaded, isSignedIn]);

    const fetchPreferences = async () => {
        try {
            const token = await getToken();
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_HOST}/api/recommendation/preferences/`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    }
                }
            );

            if (response.ok) {
                const data = await response.json();
                setPreferences(prev => ({ ...prev, ...data }));
            }
        } catch (error) {
            console.error('Error fetching preferences:', error);
        } finally {
            setLoading(false);
        }
    };

    const savePreferences = async () => {
        setSaving(true);
        try {
            const token = await getToken();
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_HOST}/api/recommendation/preferences/`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(preferences)
                }
            );

            if (response.ok) {
                toast.success('Preferences saved successfully!');
            } else {
                throw new Error('Failed to save');
            }
        } catch (error) {
            console.error('Error saving preferences:', error);
            toast.error('Failed to save preferences');
        } finally {
            setSaving(false);
        }
    };

    const toggleArrayItem = (key: keyof UserPreference, value: string) => {
        setPreferences(prev => {
            const array = prev[key] as string[];
            const newArray = array.includes(value)
                ? array.filter(item => item !== value)
                : [...array, value];
            return { ...prev, [key]: newArray };
        });
    };

    if (!isLoaded || loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-24">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!isSignedIn) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 pt-32 px-4">
                <div className="max-w-md mx-auto text-center">
                    <UserCircleIcon className="w-16 h-16 text-purple-500 mx-auto mb-6" />
                    <h1 className="text-3xl font-bold text-gray-800 mb-4">
                        Your Preferences
                    </h1>
                    <p className="text-gray-600 mb-8">
                        Sign in to set your travel preferences and get personalized recommendations.
                    </p>
                    <button
                        onClick={() => router.push('/')}
                        className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
                    >
                        Sign In to Continue
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 pt-24 pb-12 px-4">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-full mb-4">
                        <SparklesIcon className="w-5 h-5" />
                        <span className="text-sm font-medium">Personalization</span>
                    </div>
                    <h1 className="text-4xl font-bold text-gray-800 mb-2">
                        Your Travel Preferences
                    </h1>
                    <p className="text-gray-600">
                        Help us understand your travel style for better recommendations
                    </p>
                </div>

                <div className="space-y-6">
                    {/* Property Categories */}
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <HomeIcon className="w-5 h-5 text-purple-600" />
                            Favorite Property Types
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => toggleArrayItem('preferred_categories', cat.id)}
                                    className={`p-4 rounded-xl border-2 transition-all ${
                                        preferences.preferred_categories.includes(cat.id)
                                            ? 'border-purple-600 bg-purple-50 text-purple-700'
                                            : 'border-gray-200 hover:border-purple-300'
                                    }`}
                                >
                                    <span className="text-2xl block mb-1">{cat.emoji}</span>
                                    <span className="text-sm font-medium">{cat.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Budget Preference */}
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <CurrencyDollarIcon className="w-5 h-5 text-purple-600" />
                            Budget Preference
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {budgetOptions.map((opt) => (
                                <button
                                    key={opt.id}
                                    onClick={() => setPreferences(prev => ({ ...prev, budget_preference: opt.id }))}
                                    className={`p-4 rounded-xl border-2 transition-all text-center ${
                                        preferences.budget_preference === opt.id
                                            ? 'border-purple-600 bg-purple-50'
                                            : 'border-gray-200 hover:border-purple-300'
                                    }`}
                                >
                                    <span className="font-medium block">{opt.label}</span>
                                    <span className="text-xs text-gray-500">{opt.desc}</span>
                                </button>
                            ))}
                        </div>

                        {/* Max Price Slider */}
                        <div className="mt-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Maximum Price Per Night: ${preferences.max_price_per_night || 'Any'}
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="500"
                                step="25"
                                value={preferences.max_price_per_night || 500}
                                onChange={(e) => setPreferences(prev => ({
                                    ...prev,
                                    max_price_per_night: parseInt(e.target.value) === 500 ? null : parseInt(e.target.value)
                                }))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>$0</span>
                                <span>$250</span>
                                <span>$500+</span>
                            </div>
                        </div>
                    </div>

                    {/* Travel Style */}
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <HeartIcon className="w-5 h-5 text-purple-600" />
                            Travel Style
                        </h2>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                            {travelStyles.map((style) => (
                                <button
                                    key={style.id}
                                    onClick={() => setPreferences(prev => ({ ...prev, travel_style: style.id }))}
                                    className={`p-3 rounded-xl border-2 transition-all text-center ${
                                        preferences.travel_style === style.id
                                            ? 'border-purple-600 bg-purple-50'
                                            : 'border-gray-200 hover:border-purple-300'
                                    }`}
                                >
                                    <span className="text-xl block">{style.emoji}</span>
                                    <span className="text-xs font-medium">{style.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Group Size & Bedrooms */}
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <CogIcon className="w-5 h-5 text-purple-600" />
                            Property Requirements
                        </h2>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Typical Group Size
                                </label>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setPreferences(prev => ({
                                            ...prev,
                                            typical_group_size: Math.max(1, prev.typical_group_size - 1)
                                        }))}
                                        className="w-10 h-10 rounded-full border-2 border-gray-300 hover:border-purple-600 transition-colors"
                                    >
                                        -
                                    </button>
                                    <span className="w-12 text-center text-xl font-semibold">
                                        {preferences.typical_group_size}
                                    </span>
                                    <button
                                        onClick={() => setPreferences(prev => ({
                                            ...prev,
                                            typical_group_size: Math.min(20, prev.typical_group_size + 1)
                                        }))}
                                        className="w-10 h-10 rounded-full border-2 border-gray-300 hover:border-purple-600 transition-colors"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Minimum Bedrooms
                                </label>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setPreferences(prev => ({
                                            ...prev,
                                            min_bedrooms: Math.max(1, prev.min_bedrooms - 1)
                                        }))}
                                        className="w-10 h-10 rounded-full border-2 border-gray-300 hover:border-purple-600 transition-colors"
                                    >
                                        -
                                    </button>
                                    <span className="w-12 text-center text-xl font-semibold">
                                        {preferences.min_bedrooms}
                                    </span>
                                    <button
                                        onClick={() => setPreferences(prev => ({
                                            ...prev,
                                            min_bedrooms: Math.min(10, prev.min_bedrooms + 1)
                                        }))}
                                        className="w-10 h-10 rounded-full border-2 border-gray-300 hover:border-purple-600 transition-colors"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Accessibility Options */}
                        <div className="mt-6 flex flex-wrap gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={preferences.prefers_pet_friendly}
                                    onChange={(e) => setPreferences(prev => ({
                                        ...prev,
                                        prefers_pet_friendly: e.target.checked
                                    }))}
                                    className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                />
                                <span className="text-sm">🐕 Pet-Friendly</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={preferences.prefers_accessibility}
                                    onChange={(e) => setPreferences(prev => ({
                                        ...prev,
                                        prefers_accessibility: e.target.checked
                                    }))}
                                    className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                />
                                <span className="text-sm">♿ Accessible</span>
                            </label>
                        </div>
                    </div>

                    {/* Preferred Amenities */}
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">
                            Must-Have Amenities
                        </h2>
                        <div className="flex flex-wrap gap-2">
                            {amenities.map((amenity) => (
                                <button
                                    key={amenity}
                                    onClick={() => toggleArrayItem('preferred_amenities', amenity)}
                                    className={`px-4 py-2 rounded-full border-2 transition-all ${
                                        preferences.preferred_amenities.includes(amenity)
                                            ? 'border-purple-600 bg-purple-50 text-purple-700'
                                            : 'border-gray-200 hover:border-purple-300'
                                    }`}
                                >
                                    {amenity}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Favorite Destinations */}
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <MapPinIcon className="w-5 h-5 text-purple-600" />
                            Favorite Destinations
                        </h2>
                        <div className="flex flex-wrap gap-2">
                            {countries.map((country) => (
                                <button
                                    key={country}
                                    onClick={() => toggleArrayItem('preferred_countries', country)}
                                    className={`px-4 py-2 rounded-full border-2 transition-all ${
                                        preferences.preferred_countries.includes(country)
                                            ? 'border-purple-600 bg-purple-50 text-purple-700'
                                            : 'border-gray-200 hover:border-purple-300'
                                    }`}
                                >
                                    {country}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Notification Preferences */}
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <BellIcon className="w-5 h-5 text-purple-600" />
                            Notification Preferences
                        </h2>
                        <div className="space-y-3">
                            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer">
                                <span className="text-sm">Price drop alerts for saved properties</span>
                                <input
                                    type="checkbox"
                                    checked={preferences.price_drop_alerts}
                                    onChange={(e) => setPreferences(prev => ({
                                        ...prev,
                                        price_drop_alerts: e.target.checked
                                    }))}
                                    className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                />
                            </label>
                            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer">
                                <span className="text-sm">New listings in favorite destinations</span>
                                <input
                                    type="checkbox"
                                    checked={preferences.new_listing_alerts}
                                    onChange={(e) => setPreferences(prev => ({
                                        ...prev,
                                        new_listing_alerts: e.target.checked
                                    }))}
                                    className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                />
                            </label>
                        </div>
                    </div>

                    {/* Save Button */}
                    <button
                        onClick={savePreferences}
                        disabled={saving}
                        className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg"
                    >
                        {saving ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Saving...
                            </>
                        ) : (
                            <>
                                <CheckIcon className="w-5 h-5" />
                                Save Preferences
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PreferencesPage;

