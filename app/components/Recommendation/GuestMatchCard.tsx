'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { 
    SparklesIcon, 
    HeartIcon,
    CheckCircleIcon,
    XMarkIcon,
    ArrowRightIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';

interface PropertyMatch {
    id: string;
    property: string;
    property_details: {
        id: string;
        title: string;
        price_per_night: number;
        image_url: string;
        country: string;
        category: string;
    };
    overall_match_score: number;
    category_match: number;
    price_match: number;
    location_match: number;
    match_reasons: string[];
    is_viewed: boolean;
    is_dismissed: boolean;
}

const GuestMatchCard = () => {
    const { getToken, isSignedIn } = useAuth();
    const [matches, setMatches] = useState<PropertyMatch[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (isSignedIn) {
            fetchMatches();
        } else {
            setLoading(false);
        }
    }, [isSignedIn]);

    const fetchMatches = async () => {
        setLoading(true);
        try {
            const token = await getToken();
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_HOST}/api/recommendation/matches/`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    }
                }
            );

            if (!response.ok) throw new Error('Failed to fetch matches');

            const data = await response.json();
            setMatches(data.matches || []);
        } catch (error) {
            console.error('Error fetching matches:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDismiss = () => {
        if (currentIndex < matches.length - 1) {
            setCurrentIndex(prev => prev + 1);
        }
    };

    if (!isSignedIn) return null;

    if (loading) {
        return (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
                <div className="h-48 bg-gray-200 rounded-xl"></div>
            </div>
        );
    }

    if (matches.length === 0) {
        return (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8 text-center">
                <SparklesIcon className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">No Matches Yet</h3>
                <p className="text-gray-600 mb-4">
                    Set your preferences to get personalized property matches!
                </p>
                <Link 
                    href="/preferences"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                    Set Preferences
                    <ArrowRightIcon className="w-4 h-4" />
                </Link>
            </div>
        );
    }

    const currentMatch = matches[currentIndex];
    const matchPercentage = Math.round(currentMatch.overall_match_score);

    return (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <SparklesIcon className="w-6 h-6 text-purple-600" />
                    <h3 className="text-lg font-semibold text-gray-800">Your Top Matches</h3>
                </div>
                <span className="text-sm text-gray-500">
                    {currentIndex + 1} of {matches.length}
                </span>
            </div>

            {/* Match Card */}
            <div className="relative bg-white rounded-xl overflow-hidden shadow-lg">
                {/* Match Score Badge */}
                <div className="absolute top-4 left-4 z-10">
                    <div className={`px-3 py-1.5 rounded-full font-bold text-white ${
                        matchPercentage >= 90 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                        matchPercentage >= 70 ? 'bg-gradient-to-r from-purple-500 to-pink-500' :
                        'bg-gradient-to-r from-blue-500 to-cyan-500'
                    }`}>
                        {matchPercentage}% Match
                    </div>
                </div>

                {/* Property Image */}
                <div className="relative h-48">
                    <img
                        src={currentMatch.property_details.image_url || '/placeholder-property.jpg'}
                        alt={currentMatch.property_details.title}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    
                    {/* Property Info Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                        <h4 className="text-lg font-bold truncate">
                            {currentMatch.property_details.title}
                        </h4>
                        <p className="text-sm opacity-90">
                            {currentMatch.property_details.country} • ${currentMatch.property_details.price_per_night}/night
                        </p>
                    </div>
                </div>

                {/* Match Details */}
                <div className="p-4">
                    {/* Match Scores Breakdown */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                        <div className="text-center p-2 bg-purple-50 rounded-lg">
                            <div className="text-lg font-bold text-purple-600">
                                {Math.round(currentMatch.category_match)}%
                            </div>
                            <div className="text-xs text-gray-500">Category</div>
                        </div>
                        <div className="text-center p-2 bg-pink-50 rounded-lg">
                            <div className="text-lg font-bold text-pink-600">
                                {Math.round(currentMatch.price_match)}%
                            </div>
                            <div className="text-xs text-gray-500">Price</div>
                        </div>
                        <div className="text-center p-2 bg-blue-50 rounded-lg">
                            <div className="text-lg font-bold text-blue-600">
                                {Math.round(currentMatch.location_match)}%
                            </div>
                            <div className="text-xs text-gray-500">Location</div>
                        </div>
                    </div>

                    {/* Match Reasons */}
                    {currentMatch.match_reasons.length > 0 && (
                        <div className="space-y-1 mb-4">
                            {currentMatch.match_reasons.slice(0, 3).map((reason, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                                    <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
                                    <span className="truncate">{reason}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleDismiss}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors"
                        >
                            <XMarkIcon className="w-5 h-5" />
                            <span>Skip</span>
                        </button>
                        <Link
                            href={`/properties/${currentMatch.property_details.id}`}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:opacity-90 transition-opacity"
                        >
                            <HeartIconSolid className="w-5 h-5" />
                            <span>View</span>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Navigation Dots */}
            {matches.length > 1 && (
                <div className="flex justify-center gap-1.5 mt-4">
                    {matches.slice(0, 5).map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentIndex(idx)}
                            className={`w-2 h-2 rounded-full transition-all ${
                                idx === currentIndex 
                                    ? 'w-6 bg-purple-600' 
                                    : 'bg-gray-300 hover:bg-purple-400'
                            }`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default GuestMatchCard;

