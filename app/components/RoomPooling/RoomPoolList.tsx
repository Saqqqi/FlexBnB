'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import RoomPoolCard from './RoomPoolCard';
import { RoomPool } from './types';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  MapPinIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface RoomPoolListProps {
  showFilters?: boolean;
  showCreateButton?: boolean;
  onCreatePool?: () => void;
}

const RoomPoolList: React.FC<RoomPoolListProps> = ({
  showFilters = true,
  showCreateButton = true,
  onCreatePool,
}) => {
  const { getToken, isSignedIn } = useAuth();
  const [pools, setPools] = useState<RoomPool[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  
  // Filters
  const [location, setLocation] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  
  const fetchPools = async () => {
    try {
      setLoading(true);
      let url = `${process.env.NEXT_PUBLIC_API_HOST}/api/roompooling/discover/?`;
      
      if (location) url += `location=${encodeURIComponent(location)}&`;
      if (checkIn) url += `check_in=${checkIn}&`;
      if (checkOut) url += `check_out=${checkOut}&`;
      if (maxPrice) url += `max_price=${maxPrice}&`;
      
      // Include auth token if signed in to get membership status
      const headers: HeadersInit = {};
      if (isSignedIn) {
        const token = await getToken();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }
      
      const res = await fetch(url, { headers });
      const data = await res.json();
      setPools(data.results || []);
    } catch (error) {
      console.error('Failed to fetch pools:', error);
      toast.error('Failed to load room pools');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchPools();
  }, []);
  
  const handleJoinPool = async (poolId: string) => {
    if (!isSignedIn) {
      toast('Please sign in to join a pool', { icon: 'ℹ️' });
      return;
    }
    
    try {
      const token = await getToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_HOST}/api/roompooling/pools/${poolId}/join/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ message: '' }),
        }
      );
      
      const data = await res.json();
      
      if (res.ok) {
        toast.success(data.message || 'Successfully joined the pool!');
        fetchPools(); // Refresh list
      } else {
        toast.error(data.error || 'Failed to join pool');
      }
    } catch (error) {
      console.error('Failed to join pool:', error);
      toast.error('Failed to join pool');
    }
  };
  
  const handleSearch = () => {
    fetchPools();
    setShowFilterPanel(false);
  };
  
  const clearFilters = () => {
    setLocation('');
    setCheckIn('');
    setCheckOut('');
    setMaxPrice('');
    fetchPools();
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Room Pools</h2>
          <p className="text-gray-600 mt-1">Find shared stays and split costs with compatible travelers</p>
        </div>
        {showCreateButton && (
          <button
            onClick={onCreatePool}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg transition-all"
          >
            Create Pool
          </button>
        )}
      </div>
      
      {/* Search & Filters */}
      {showFilters && (
        <div className="bg-white rounded-2xl shadow-md p-4 border border-gray-100">
          <div className="flex items-center gap-4">
            {/* Quick search */}
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by location..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            
            {/* Filter toggle */}
            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`px-4 py-3 rounded-xl border flex items-center gap-2 transition-colors ${
                showFilterPanel ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <FunnelIcon className="w-5 h-5" />
              Filters
            </button>
            
            <button
              onClick={handleSearch}
              className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors"
            >
              Search
            </button>
          </div>
          
          {/* Expanded filters */}
          {showFilterPanel && (
            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <CalendarIcon className="w-4 h-4 inline mr-1" />
                  Check-in
                </label>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <CalendarIcon className="w-4 h-4 inline mr-1" />
                  Check-out
                </label>
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <CurrencyDollarIcon className="w-4 h-4 inline mr-1" />
                  Max price/person
                </label>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="Any price"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="w-full px-4 py-2 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
                >
                  <XMarkIcon className="w-4 h-4" />
                  Clear all
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Pool Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-2xl shadow-md overflow-hidden animate-pulse">
              <div className="h-48 bg-gray-200" />
              <div className="p-5 space-y-4">
                <div className="h-6 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-10 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : pools.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl shadow-md">
          <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <MapPinIcon className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No room pools found</h3>
          <p className="text-gray-600 mb-6">Be the first to create a shared stay!</p>
          {showCreateButton && (
            <button
              onClick={onCreatePool}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg transition-all"
            >
              Create a Pool
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pools.map((pool) => (
            <RoomPoolCard
              key={pool.id}
              pool={pool}
              onJoin={handleJoinPool}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default RoomPoolList;

