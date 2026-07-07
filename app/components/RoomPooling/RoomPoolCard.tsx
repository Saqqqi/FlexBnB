'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RoomPool } from './types';
import {
  UserGroupIcon,
  CalendarDaysIcon,
  MapPinIcon,
  ClockIcon,
  CheckBadgeIcon,
  LockClosedIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';

interface RoomPoolCardProps {
  pool: RoomPool;
  showJoinButton?: boolean;
  onJoin?: (poolId: string) => void;
}

const RoomPoolCard: React.FC<RoomPoolCardProps> = ({ pool, showJoinButton = true, onJoin }) => {
  const router = useRouter();
  
  const nights = Math.ceil(
    (new Date(pool.check_out_date).getTime() - new Date(pool.check_in_date).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-emerald-100 text-emerald-700';
      case 'full':
        return 'bg-amber-100 text-amber-700';
      case 'booked':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getVisibilityIcon = () => {
    switch (pool.visibility) {
      case 'public':
        return <GlobeAltIcon className="w-4 h-4" />;
      case 'private':
        return <LockClosedIcon className="w-4 h-4" />;
      default:
        return <UserGroupIcon className="w-4 h-4" />;
    }
  };

  const handleCardClick = () => {
    router.push(`/room-pooling/${pool.id}`);
  };

  const handleJoinClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card navigation
    onJoin?.(pool.id);
  };

  return (
    <div 
      onClick={handleCardClick}
      className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 group cursor-pointer"
    >
      {/* Image Section */}
      <div className="relative h-48 overflow-hidden">
        {pool.property_image ? (
          <Image
            src={pool.property_image}
            alt={pool.property_title || pool.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
            <UserGroupIcon className="w-16 h-16 text-white/50" />
          </div>
        )}

        {/* Overlay badges */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(pool.status)}`}>
            {pool.spots_available} {pool.spots_available === 1 ? 'spot' : 'spots'} left
          </span>
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-white/90 text-gray-700 flex items-center gap-1">
            {getVisibilityIcon()}
            {pool.visibility}
          </span>
        </div>

        {/* Price badge */}
        <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-2 rounded-xl shadow-lg">
          <p className="text-lg font-bold text-indigo-600">${Number(pool.price_per_person).toFixed(0)}</p>
          <p className="text-xs text-gray-500">per person</p>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5">
        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
          {pool.title}
        </h3>

        <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
          <MapPinIcon className="w-4 h-4 text-gray-400" />
          {pool.property_location || 'Location not specified'}
        </p>

        {pool.description && (
          <p className="text-sm text-gray-500 mt-2 line-clamp-2">{pool.description}</p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 mt-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <CalendarDaysIcon className="w-4 h-4 text-indigo-500" />
            <span>
              {formatDate(pool.check_in_date)} - {formatDate(pool.check_out_date)}
            </span>
          </div>
          <span className="text-gray-300">|</span>
          <span>{nights} nights</span>
        </div>

        {/* Members */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {[...Array(Math.min(pool.current_members, 4))].map((_, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 border-2 border-white flex items-center justify-center text-white text-xs font-medium"
                >
                  {i + 1}
                </div>
              ))}
              {pool.current_members > 4 && (
                <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-gray-600 text-xs font-medium">
                  +{pool.current_members - 4}
                </div>
              )}
            </div>
            <span className="text-sm text-gray-600">
              {pool.current_members}/{pool.max_members} joined
            </span>
          </div>

          {pool.days_until_deadline !== undefined && pool.days_until_deadline < 7 && (
            <div className="flex items-center gap-1 text-amber-600 text-sm">
              <ClockIcon className="w-4 h-4" />
              <span>{pool.days_until_deadline}d left</span>
            </div>
          )}
        </div>

        {/* Join Button - only show if not already a member */}
        {showJoinButton && pool.status === 'open' && !pool.is_member && (
          <button
            onClick={handleJoinClick}
            className="w-full mt-4 py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg hover:from-indigo-700 hover:to-purple-700 transition-all"
          >
            Join Pool
          </button>
        )}

        {/* Member badge */}
        {pool.is_member && (
          <div className="mt-4 py-2 px-4 bg-emerald-50 text-emerald-700 font-medium rounded-xl text-center flex items-center justify-center gap-2">
            <CheckBadgeIcon className="w-5 h-5" />
            You're a member
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomPoolCard;

