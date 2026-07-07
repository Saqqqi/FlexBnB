'use client';

import React from 'react';
import { RoommateMatch } from './types';
import {
  UserCircleIcon,
  CheckCircleIcon,
  SparklesIcon,
  MoonIcon,
  SunIcon,
  MusicalNoteIcon,
  FireIcon,
  HeartIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';

interface RoommateMatchCardProps {
  match: RoommateMatch;
  onConnect?: (profileId: string) => void;
  onInvite?: (profileId: string) => void;
}

const RoommateMatchCard: React.FC<RoommateMatchCardProps> = ({
  match,
  onConnect,
  onInvite,
}) => {
  const { profile, compatibility_score, match_reasons, compatibility_breakdown } = match;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50';
    if (score >= 60) return 'text-blue-600 bg-blue-50';
    if (score >= 40) return 'text-amber-600 bg-amber-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return 'from-emerald-500 to-teal-500';
    if (score >= 60) return 'from-blue-500 to-indigo-500';
    if (score >= 40) return 'from-amber-500 to-orange-500';
    return 'from-gray-400 to-gray-500';
  };

  const getSleepIcon = () => {
    switch (profile.sleep_schedule) {
      case 'early_bird':
        return <SunIcon className="w-4 h-4" />;
      case 'night_owl':
        return <MoonIcon className="w-4 h-4" />;
      default:
        return <SparklesIcon className="w-4 h-4" />;
    }
  };

  const formatLabel = (value: string) => {
    return value.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-shadow duration-300">
      {/* Header with score */}
      <div className={`relative bg-gradient-to-r ${getScoreGradient(compatibility_score)} p-6 text-white`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                <UserCircleIcon className="w-12 h-12 text-white" />
              </div>
              {profile.is_verified && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                  <CheckCircleIcon className="w-5 h-5 text-emerald-500" />
                </div>
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold">{profile.user_name}</h3>
              {profile.occupation && (
                <p className="text-white/80 text-sm">{profile.occupation}</p>
              )}
            </div>
          </div>
          
          {/* Score badge */}
          <div className="text-center bg-white/20 rounded-xl px-4 py-2 backdrop-blur-sm">
            <p className="text-3xl font-bold">{compatibility_score}%</p>
            <p className="text-xs text-white/80">Match</p>
          </div>
        </div>
        
        {/* Match reasons */}
        {match_reasons.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {match_reasons.slice(0, 3).map((reason, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-white/20 rounded-full text-xs backdrop-blur-sm"
              >
                ✨ {reason}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-5 space-y-4">
        {/* Bio */}
        {profile.bio && (
          <p className="text-gray-600 text-sm italic">&ldquo;{profile.bio}&rdquo;</p>
        )}

        {/* Quick info */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-sm">
            {getSleepIcon()}
            <span className="text-gray-600">{formatLabel(profile.sleep_schedule)}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <SparklesIcon className="w-4 h-4 text-indigo-500" />
            <span className="text-gray-600">{formatLabel(profile.cleanliness)}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <MusicalNoteIcon className="w-4 h-4 text-pink-500" />
            <span className="text-gray-600">{formatLabel(profile.noise_preference)}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <FireIcon className="w-4 h-4 text-orange-500" />
            <span className="text-gray-600">{formatLabel(profile.smoking)}</span>
          </div>
        </div>

        {/* Compatibility breakdown */}
        <div className="space-y-2 pt-3 border-t border-gray-100">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Compatibility Breakdown
          </h4>
          <div className="space-y-2">
            {Object.entries(compatibility_breakdown).slice(0, 4).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-20 capitalize">{key}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${getScoreGradient(
                      (value.score / value.max) * 100
                    )}`}
                    style={{ width: `${(value.score / value.max) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-600 w-12 text-right">
                  {value.score}/{value.max}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Shared interests */}
        {profile.interests.length > 0 && (
          <div className="pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <HeartIcon className="w-4 h-4 text-rose-500" />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Interests
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.interests.slice(0, 6).map((interest, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full hover:bg-indigo-100 hover:text-indigo-700 transition-colors"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Languages */}
        {profile.languages.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <ChatBubbleLeftRightIcon className="w-4 h-4 text-blue-500" />
            <span>Speaks: {profile.languages.join(', ')}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-5 pb-5 flex gap-3">
        <button
          onClick={() => onConnect?.(profile.id)}
          className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
        >
          View Profile
        </button>
        <button
          onClick={() => onInvite?.(profile.id)}
          className="flex-1 py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg transition-all"
        >
          Invite to Pool
        </button>
      </div>
    </div>
  );
};

export default RoommateMatchCard;

