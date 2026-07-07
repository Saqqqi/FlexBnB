'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import PropertyListItem from '../Properties/PropertyListItem';
import { SparklesIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface RecommendedProperty {
    id: string;
    title: string;
    price_per_night: number;
    price_per_hour?: number;
    image_url: string;
    country: string;
    category: string;
    recommendation_score?: number;
    is_hourly_booking?: boolean;
    allow_room_pooling?: boolean;
}

interface RecommendationResponse {
    recommendations: RecommendedProperty[];
    recommendation_type: string;
    total_count: number;
    reasons: string[];
    personalization_score: number;
}

const RecommendedProperties = () => {
    const { getToken, isSignedIn } = useAuth();
    const [recommendations, setRecommendations] = useState<RecommendedProperty[]>([]);
    const [reasons, setReasons] = useState<string[]>([]);
    const [personalizationScore, setPersonalizationScore] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchRecommendations = async () => {
        setLoading(true);
        setError('');
        
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
                `${process.env.NEXT_PUBLIC_API_HOST}/api/recommendation/recommendations/?limit=6`,
                { headers }
            );
            
            if (!response.ok) throw new Error('Failed to fetch recommendations');
            
            const data: RecommendationResponse = await response.json();
            setRecommendations(data.recommendations);
            setReasons(data.reasons);
            setPersonalizationScore(data.personalization_score);
        } catch (err) {
            console.error('Error fetching recommendations:', err);
            setError('Unable to load recommendations');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecommendations();
    }, [isSignedIn]);

    if (loading) {
        return (
            <div className="my-12">
                <div className="flex items-center gap-2 mb-6">
                    <SparklesIcon className="w-6 h-6 text-amber-500 animate-pulse" />
                    <h2 className="text-2xl font-bold text-gray-800">Finding Perfect Stays...</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-gray-100 rounded-xl h-72 animate-pulse"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (error || recommendations.length === 0) {
        return null;
    }

    return (
        <div className="my-12 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 rounded-lg">
                        <SparklesIcon className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">
                            {isSignedIn ? 'Recommended For You' : 'Trending Properties'}
                        </h2>
                        {isSignedIn && personalizationScore > 0 && (
                            <div className="flex items-center gap-2 mt-1">
                                <div className="h-1.5 w-24 bg-gray-200 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                                        style={{ width: `${personalizationScore}%` }}
                                    />
                                </div>
                                <span className="text-sm text-gray-500">
                                    {personalizationScore}% personalized
                                </span>
                            </div>
                        )}
                    </div>
                </div>
                <button 
                    onClick={fetchRecommendations}
                    className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-100 rounded-lg transition-colors"
                    title="Refresh recommendations"
                >
                    <ArrowPathIcon className="w-5 h-5" />
                </button>
            </div>

            {/* Reasons */}
            {reasons.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                    {reasons.slice(0, 3).map((reason, idx) => (
                        <span 
                            key={idx}
                            className="px-3 py-1 bg-white text-sm text-gray-600 rounded-full shadow-sm"
                        >
                            ✨ {reason}
                        </span>
                    ))}
                </div>
            )}

            {/* Properties Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendations.map((property) => (
                    <div key={property.id} className="relative">
                        {property.recommendation_score && property.recommendation_score >= 90 && (
                            <div className="absolute -top-2 -right-2 z-10 px-2 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-full shadow-lg">
                                Top Match
                            </div>
                        )}
                        <PropertyListItem property={property} />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RecommendedProperties;

