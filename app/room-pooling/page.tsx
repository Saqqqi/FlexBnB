'use client';

import React, { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import RoomPoolList from '../components/RoomPooling/RoomPoolList';
import CreatePoolModal from '../components/RoomPooling/CreatePoolModal';
import { RoomPool } from '../components/RoomPooling/types';
import {
  UserGroupIcon,
  PlusIcon,
  Squares2X2Icon,
  ListBulletIcon,
  SparklesIcon,
  HeartIcon,
  BanknotesIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';

const RoomPoolingPage: React.FC = () => {
  const { getToken, isSignedIn } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'discover' | 'my-pools'>('discover');
  const [myPools, setMyPools] = useState<{
    created: RoomPool[];
    joined: RoomPool[];
    pending: RoomPool[];
  }>({ created: [], joined: [], pending: [] });
  const [loadingMyPools, setLoadingMyPools] = useState(false);

  const fetchMyPools = async () => {
    if (!isSignedIn) return;
    
    try {
      setLoadingMyPools(true);
      const token = await getToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_HOST}/api/roompooling/pools/my_pools/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (res.ok) {
        const data = await res.json();
        setMyPools(data);
      }
    } catch (error) {
      console.error('Failed to fetch my pools:', error);
    } finally {
      setLoadingMyPools(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'my-pools' && isSignedIn) {
      fetchMyPools();
    }
  }, [activeTab, isSignedIn]);

  const features = [
    {
      icon: BanknotesIcon,
      title: 'Cost Sharing',
      description: 'Split accommodation costs with compatible travelers',
      color: 'bg-emerald-100 text-emerald-600',
    },
    {
      icon: HeartIcon,
      title: 'Roommate Matching',
      description: 'Find compatible roommates based on preferences',
      color: 'bg-rose-100 text-rose-600',
    },
    {
      icon: SparklesIcon,
      title: 'Flexible Billing',
      description: 'Custom or equal cost splitting options',
      color: 'bg-amber-100 text-amber-600',
    },
    {
      icon: ChatBubbleLeftRightIcon,
      title: 'Group Chat',
      description: 'Coordinate with your pool members instantly',
      color: 'bg-blue-100 text-blue-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Room Pooling & Cost Sharing
            </h1>
            <p className="text-xl text-white/80 max-w-2xl mx-auto mb-8">
              Share stays, split costs, and travel with compatible roommates. 
              Find or create shared accommodation pools for cost-effective trips.
            </p>
            
            {isSignedIn && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-600 font-semibold rounded-2xl hover:shadow-xl transition-all"
              >
                <PlusIcon className="w-5 h-5" />
                Create a Pool
              </button>
            )}
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center hover:bg-white/20 transition-colors"
              >
                <div className={`w-12 h-12 mx-auto rounded-full ${feature.color} flex items-center justify-center mb-3`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold mb-1">{feature.title}</h3>
                <p className="text-sm text-white/70">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Tabs */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex bg-white rounded-xl p-1 shadow-sm">
            <button
              onClick={() => setActiveTab('discover')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'discover'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Squares2X2Icon className="w-5 h-5 inline mr-2" />
              Discover Pools
            </button>
            {isSignedIn && (
              <button
                onClick={() => setActiveTab('my-pools')}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  activeTab === 'my-pools'
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <UserGroupIcon className="w-5 h-5 inline mr-2" />
                My Pools
              </button>
            )}
          </div>

          {isSignedIn && (
            <button
              onClick={() => router.push('/room-pooling/matching')}
              className="px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-medium rounded-xl hover:shadow-lg transition-all"
            >
              <HeartIcon className="w-5 h-5 inline mr-2" />
              Find Roommates
            </button>
          )}
        </div>

        {/* Tab Content */}
        {activeTab === 'discover' && (
          <RoomPoolList
            showCreateButton={false}
            onCreatePool={() => setShowCreateModal(true)}
          />
        )}

        {activeTab === 'my-pools' && (
          <div className="space-y-8">
            {/* Created Pools */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <SparklesIcon className="w-6 h-6 text-indigo-600" />
                Pools I Created ({myPools.created.length})
              </h3>
              {myPools.created.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myPools.created.map((pool) => (
                    <div
                      key={pool.id}
                      onClick={() => router.push(`/room-pooling/${pool.id}`)}
                      className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg cursor-pointer transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-gray-900">{pool.title}</h4>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          pool.status === 'open' ? 'bg-emerald-100 text-emerald-700' :
                          pool.status === 'full' ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {pool.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">
                        {pool.current_members}/{pool.max_members} members • ${Number(pool.price_per_person).toFixed(0)}/person
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{new Date(pool.check_in_date).toLocaleDateString()}</span>
                        <span>→</span>
                        <span>{new Date(pool.check_out_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-white rounded-2xl shadow-sm">
                  <p className="text-gray-500">You haven't created any pools yet</p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700"
                  >
                    Create Your First Pool
                  </button>
                </div>
              )}
            </div>

            {/* Joined Pools */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <UserGroupIcon className="w-6 h-6 text-emerald-600" />
                Pools I Joined ({myPools.joined.length})
              </h3>
              {myPools.joined.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myPools.joined.map((pool) => (
                    <div
                      key={pool.id}
                      onClick={() => router.push(`/room-pooling/${pool.id}`)}
                      className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg cursor-pointer transition-shadow border-l-4 border-emerald-500"
                    >
                      <h4 className="font-semibold text-gray-900 mb-2">{pool.title}</h4>
                      <p className="text-sm text-gray-600 mb-4">
                        {pool.current_members}/{pool.max_members} members • ${Number(pool.price_per_person).toFixed(0)}/person
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{new Date(pool.check_in_date).toLocaleDateString()}</span>
                        <span>→</span>
                        <span>{new Date(pool.check_out_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-white rounded-2xl shadow-sm">
                  <p className="text-gray-500">You haven't joined any pools yet</p>
                </div>
              )}
            </div>

            {/* Pending Requests */}
            {myPools.pending.length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <ListBulletIcon className="w-6 h-6 text-amber-600" />
                  Pending Requests ({myPools.pending.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myPools.pending.map((pool) => (
                    <div
                      key={pool.id}
                      className="bg-white rounded-2xl shadow-md p-6 border-l-4 border-amber-500"
                    >
                      <h4 className="font-semibold text-gray-900 mb-2">{pool.title}</h4>
                      <p className="text-sm text-amber-600 font-medium">
                        Awaiting approval
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <CreatePoolModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          fetchMyPools();
          setActiveTab('my-pools');
        }}
      />
    </div>
  );
};

export default RoomPoolingPage;

