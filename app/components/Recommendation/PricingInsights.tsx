'use client';

import { useEffect, useState } from 'react';
import {
    ChartBarIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
    MinusIcon,
    CalendarDaysIcon,
    FireIcon,
    ClockIcon,
    CurrencyDollarIcon,
    InformationCircleIcon
} from '@heroicons/react/24/outline';

interface PriceForecast {
    date: string;
    day_name: string;
    predicted_price: number;
    confidence: number;
    is_weekend: boolean;
}

interface PriceFactor {
    factor: string;
    impact: string;
    description: string;
}

interface PricingData {
    property_id: string;
    property_title: string;
    current_price: number;
    average_price: number;
    min_price_30_days: number;
    max_price_30_days: number;
    price_trend: 'rising' | 'falling' | 'stable';
    trend_percentage: number;
    best_time_to_book: string;
    potential_savings: number;
    price_forecast: PriceForecast[];
    demand_level: 'low' | 'medium' | 'high' | 'very_high';
    demand_score: number;
    similar_properties_booked: number;
    booking_recommendation: string;
    price_factors: PriceFactor[];
}

interface PricingInsightsProps {
    propertyId: string;
    checkIn?: string;
    checkOut?: string;
}

const PricingInsights: React.FC<PricingInsightsProps> = ({ propertyId, checkIn, checkOut }) => {
    const [data, setData] = useState<PricingData | null>(null);
    const [loading, setLoading] = useState(true);
    const [showForecast, setShowForecast] = useState(false);

    useEffect(() => {
        const fetchPricingInsights = async () => {
            setLoading(true);
            try {
                let url = `${process.env.NEXT_PUBLIC_API_HOST}/api/recommendation/pricing-insights/${propertyId}/`;
                const params = new URLSearchParams();
                if (checkIn) params.append('check_in', checkIn);
                if (checkOut) params.append('check_out', checkOut);
                if (params.toString()) url += `?${params}`;

                const response = await fetch(url);
                if (!response.ok) throw new Error('Failed to fetch');
                
                const result = await response.json();
                setData(result);
            } catch (error) {
                console.error('Error fetching pricing insights:', error);
            } finally {
                setLoading(false);
            }
        };

        if (propertyId) {
            fetchPricingInsights();
        }
    }, [propertyId, checkIn, checkOut]);

    if (loading) {
        return (
            <div className="bg-white rounded-xl p-6 shadow-sm animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
                <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const getTrendIcon = () => {
        switch (data.price_trend) {
            case 'rising':
                return <ArrowTrendingUpIcon className="w-5 h-5 text-red-500" />;
            case 'falling':
                return <ArrowTrendingDownIcon className="w-5 h-5 text-green-500" />;
            default:
                return <MinusIcon className="w-5 h-5 text-gray-500" />;
        }
    };

    const getDemandColor = () => {
        switch (data.demand_level) {
            case 'very_high': return 'text-red-600 bg-red-50';
            case 'high': return 'text-orange-600 bg-orange-50';
            case 'medium': return 'text-yellow-600 bg-yellow-50';
            default: return 'text-green-600 bg-green-50';
        }
    };

    const getDemandText = () => {
        switch (data.demand_level) {
            case 'very_high': return 'Very High Demand';
            case 'high': return 'High Demand';
            case 'medium': return 'Moderate Demand';
            default: return 'Low Demand';
        }
    };

    return (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 shadow-sm">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <ChartBarIcon className="w-6 h-6 text-indigo-600" />
                <h3 className="text-lg font-semibold text-gray-800">Pricing Insights</h3>
            </div>

            {/* Price Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                        <CurrencyDollarIcon className="w-4 h-4" />
                        <span>Current Price</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-800">
                        ${data.current_price}
                        <span className="text-sm font-normal text-gray-500">/night</span>
                    </div>
                </div>
                
                <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                        {getTrendIcon()}
                        <span>Price Trend</span>
                    </div>
                    <div className="text-lg font-semibold capitalize">
                        {data.price_trend}
                        {data.trend_percentage !== 0 && (
                            <span className={`text-sm ml-1 ${data.trend_percentage > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                ({data.trend_percentage > 0 ? '+' : ''}{data.trend_percentage.toFixed(1)}%)
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Price Range */}
            <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
                <p className="text-sm text-gray-500 mb-2">30-Day Price Range</p>
                <div className="relative h-2 bg-gray-200 rounded-full">
                    <div 
                        className="absolute h-full bg-gradient-to-r from-green-400 to-red-400 rounded-full"
                        style={{ 
                            left: '0%',
                            width: '100%'
                        }}
                    />
                    <div 
                        className="absolute w-3 h-3 bg-indigo-600 rounded-full -top-0.5 border-2 border-white shadow"
                        style={{ 
                            left: `${((data.current_price - data.min_price_30_days) / (data.max_price_30_days - data.min_price_30_days)) * 100}%`,
                            transform: 'translateX(-50%)'
                        }}
                    />
                </div>
                <div className="flex justify-between mt-2 text-sm">
                    <span className="text-green-600 font-medium">${data.min_price_30_days}</span>
                    <span className="text-gray-500">Avg: ${data.average_price.toFixed(0)}</span>
                    <span className="text-red-600 font-medium">${data.max_price_30_days}</span>
                </div>
            </div>

            {/* Demand Indicator */}
            <div className={`rounded-lg p-4 mb-4 ${getDemandColor()}`}>
                <div className="flex items-center gap-2">
                    <FireIcon className="w-5 h-5" />
                    <span className="font-semibold">{getDemandText()}</span>
                </div>
                <p className="text-sm mt-1 opacity-80">
                    {data.similar_properties_booked} similar properties booked this week
                </p>
            </div>

            {/* Best Time to Book */}
            <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
                <div className="flex items-center gap-2 mb-2">
                    <CalendarDaysIcon className="w-5 h-5 text-indigo-600" />
                    <span className="font-medium text-gray-800">Best Time to Book</span>
                </div>
                <p className="text-gray-600">
                    <span className="font-semibold text-indigo-600">{data.best_time_to_book}</span>
                    {data.potential_savings > 0 && (
                        <span className="text-green-600 ml-2">
                            (Save up to ${data.potential_savings})
                        </span>
                    )}
                </p>
            </div>

            {/* Booking Recommendation */}
            <div className="bg-indigo-600 text-white rounded-lg p-4 mb-4">
                <p className="text-sm">{data.booking_recommendation}</p>
            </div>

            {/* 7-Day Price Forecast */}
            <button 
                onClick={() => setShowForecast(!showForecast)}
                className="w-full flex items-center justify-between p-3 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <ClockIcon className="w-5 h-5 text-indigo-600" />
                    <span className="font-medium text-gray-800">7-Day Price Forecast</span>
                </div>
                <span className="text-indigo-600">{showForecast ? '▲' : '▼'}</span>
            </button>

            {showForecast && data.price_forecast && (
                <div className="mt-4 bg-white rounded-lg p-4 shadow-sm">
                    <div className="space-y-2">
                        {data.price_forecast.map((day, idx) => (
                            <div 
                                key={idx} 
                                className={`flex items-center justify-between p-2 rounded ${day.is_weekend ? 'bg-amber-50' : 'bg-gray-50'}`}
                            >
                                <div>
                                    <span className="font-medium">{day.day_name}</span>
                                    {day.is_weekend && (
                                        <span className="ml-2 text-xs px-2 py-0.5 bg-amber-200 text-amber-800 rounded">
                                            Weekend
                                        </span>
                                    )}
                                </div>
                                <div className="text-right">
                                    <span className="font-semibold">${day.predicted_price}</span>
                                    <span className="text-xs text-gray-500 ml-1">
                                        ({(day.confidence * 100).toFixed(0)}% confidence)
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Price Factors */}
            {data.price_factors && data.price_factors.length > 0 && (
                <div className="mt-4">
                    <div className="flex items-center gap-2 mb-2">
                        <InformationCircleIcon className="w-5 h-5 text-gray-500" />
                        <span className="text-sm font-medium text-gray-600">Price Factors</span>
                    </div>
                    <div className="space-y-2">
                        {data.price_factors.map((factor, idx) => (
                            <div key={idx} className="bg-white rounded-lg p-3 shadow-sm text-sm">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="font-medium">{factor.factor}</span>
                                    <span className="text-indigo-600 font-semibold">{factor.impact}</span>
                                </div>
                                <p className="text-gray-500 text-xs">{factor.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PricingInsights;

