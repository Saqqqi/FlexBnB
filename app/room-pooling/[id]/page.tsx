'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth, useUser } from '@clerk/nextjs';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { RoomPool, RoomPoolMember, PaymentSummary } from '../../components/RoomPooling/types';
import PoolChat from '../../components/RoomPooling/PoolChat';
import CostSplitCalculator from '../../components/RoomPooling/CostSplitCalculator';
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  MapPinIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  PaperAirplaneIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

const PoolDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const { getToken, isSignedIn } = useAuth();
  const { user } = useUser();
  
  const [pool, setPool] = useState<RoomPool | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'costs' | 'chat'>('overview');
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary[]>([]);

  const fetchPool = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_HOST}/api/roompooling/pools/${params.id}/`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      
      if (res.ok) {
        const data = await res.json();
        setPool(data);
      } else {
        toast.error('Failed to load pool details');
      }
    } catch (error) {
      console.error('Failed to fetch pool:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCostSplit = async () => {
    if (!isSignedIn || !pool) return;
    
    try {
      const token = await getToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_HOST}/api/roompooling/pools/${params.id}/cost-split/`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      if (res.ok) {
        const data = await res.json();
        setPaymentSummary(data.payment_summary || []);
      }
    } catch (error) {
      console.error('Failed to fetch cost split:', error);
    }
  };

  useEffect(() => {
    fetchPool();
  }, [params.id]);

  useEffect(() => {
    if (pool && (pool.is_member || pool.is_creator)) {
      fetchCostSplit();
    }
  }, [pool]);

  const handleJoinPool = async () => {
    if (!isSignedIn) {
      toast.info('Please sign in to join this pool');
      return;
    }
    
    try {
      const token = await getToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_HOST}/api/roompooling/pools/${params.id}/join/`,
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
        toast.success(data.message || 'Request submitted!');
        fetchPool();
      } else {
        toast.error(data.error || 'Failed to join pool');
      }
    } catch (error) {
      console.error('Failed to join pool:', error);
      toast.error('Failed to join pool');
    }
  };

  const handleLeavePool = async () => {
    if (!confirm('Are you sure you want to leave this pool?')) return;
    
    try {
      const token = await getToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_HOST}/api/roompooling/pools/${params.id}/leave/`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      if (res.ok) {
        toast.success('You have left the pool');
        fetchPool();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to leave pool');
      }
    } catch (error) {
      console.error('Failed to leave pool:', error);
    }
  };

  const handleFinalizeBooking = async () => {
    if (!confirm('Are you sure you want to finalize this booking? This will create a reservation request to the property host.')) return;
    
    try {
      const token = await getToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_HOST}/api/roompooling/pools/${params.id}/finalize_booking/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      const data = await res.json();
      
      if (res.ok) {
        toast.success(data.message || 'Booking finalized! Awaiting host approval.');
        fetchPool();
      } else {
        toast.error(data.error || 'Failed to finalize booking');
      }
    } catch (error) {
      console.error('Failed to finalize booking:', error);
      toast.error('Failed to finalize booking');
    }
  };

  const handleApproveMember = async (memberId: string) => {
    try {
      const token = await getToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_HOST}/api/roompooling/pools/${params.id}/approve_member/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ member_id: memberId }),
        }
      );
      
      if (res.ok) {
        toast.success('Member approved!');
        fetchPool();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to approve member');
      }
    } catch (error) {
      console.error('Failed to approve member:', error);
    }
  };

  const handleRejectMember = async (memberId: string) => {
    try {
      const token = await getToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_HOST}/api/roompooling/pools/${params.id}/reject_member/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ member_id: memberId }),
        }
      );
      
      if (res.ok) {
        toast.success('Member rejected');
        fetchPool();
      }
    } catch (error) {
      console.error('Failed to reject member:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!pool) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Pool Not Found</h2>
          <button
            onClick={() => router.push('/room-pooling')}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700"
          >
            Back to Pools
          </button>
        </div>
      </div>
    );
  }

  const nights = Math.ceil(
    (new Date(pool.check_out_date).getTime() - new Date(pool.check_in_date).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const approvedMembers = pool.members?.filter((m) => m.status === 'approved') || [];
  const pendingMembers = pool.members?.filter((m) => m.status === 'pending') || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => router.push('/room-pooling')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to Pools
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Pool Header Card */}
            <div className="bg-white rounded-2xl shadow-md overflow-hidden">
              {/* Property Image */}
              <div className="relative h-64">
                {pool.property_details?.image_url ? (
                  <Image
                    src={pool.property_details.image_url}
                    alt={pool.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                    <UserGroupIcon className="w-20 h-20 text-white/50" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      pool.status === 'open' ? 'bg-emerald-500' :
                      pool.status === 'full' ? 'bg-amber-500' :
                      'bg-gray-500'
                    }`}>
                      {pool.status}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/20 backdrop-blur-sm">
                      {pool.visibility}
                    </span>
                  </div>
                  <h1 className="text-3xl font-bold mb-2">{pool.title}</h1>
                  <p className="flex items-center gap-2 text-white/80">
                    <MapPinIcon className="w-4 h-4" />
                    {pool.property_details?.country || pool.property_location || 'Location'}
                  </p>
                </div>
              </div>

              {/* Pool Info */}
              <div className="p-6">
                {pool.description && (
                  <p className="text-gray-600 mb-6">{pool.description}</p>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-gray-50 rounded-xl text-center">
                    <CalendarDaysIcon className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Dates</p>
                    <p className="font-semibold">
                      {new Date(pool.check_in_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - 
                      {new Date(pool.check_out_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                    <p className="text-xs text-gray-500">{nights} nights</p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-xl text-center">
                    <UserGroupIcon className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Members</p>
                    <p className="font-semibold">{pool.current_members}/{pool.max_members}</p>
                    <p className="text-xs text-gray-500">{pool.spots_available} spots left</p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-xl text-center">
                    <CurrencyDollarIcon className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Your Share</p>
                    <p className="font-semibold text-emerald-600">${Number(pool.price_per_person).toFixed(0)}</p>
                    <p className="text-xs text-gray-500">per person</p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-xl text-center">
                    <ClockIcon className="w-6 h-6 text-amber-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Deadline</p>
                    <p className="font-semibold">
                      {new Date(pool.booking_deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                    <p className="text-xs text-gray-500">to join</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-2xl shadow-md overflow-hidden">
              <div className="flex border-b">
                {['overview', 'members', 'costs', 'chat'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as typeof activeTab)}
                    className={`flex-1 py-4 text-sm font-medium transition-colors ${
                      activeTab === tab
                        ? 'text-indigo-600 border-b-2 border-indigo-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-4">Pool Requirements</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <span className="text-gray-600">Gender:</span>
                          <span className="font-medium">
                            {pool.gender_preference === 'no_preference' ? 'Any' : pool.gender_preference}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <span className="text-gray-600">Smoking:</span>
                          <span className="font-medium">
                            {pool.smoking_allowed ? 'Allowed' : 'Not Allowed'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <span className="text-gray-600">Pets:</span>
                          <span className="font-medium">
                            {pool.pets_allowed ? 'Allowed' : 'Not Allowed'}
                          </span>
                        </div>
                        {pool.use_compatibility_matching && (
                          <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg">
                            <ShieldCheckIcon className="w-5 h-5 text-indigo-600" />
                            <span className="font-medium text-indigo-600">
                              Min {pool.min_compatibility_score}% compatibility
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 mb-4">Property Details</h3>
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="font-medium text-lg">{pool.property_title}</p>
                        <p className="text-gray-600">Total: ${Number(pool.total_price).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Members Tab */}
                {activeTab === 'members' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-4">
                        Approved Members ({approvedMembers.length})
                      </h3>
                      <div className="space-y-3">
                        {approvedMembers.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-medium">
                                {member.user_name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium flex items-center gap-2">
                                  {member.user_name}
                                  {member.is_creator && (
                                    <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded">
                                      Creator
                                    </span>
                                  )}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {member.compatibility_score}% compatibility
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">${Number(member.share_amount).toFixed(2)}</p>
                              <p className={`text-xs ${
                                member.payment_status === 'paid' ? 'text-emerald-600' :
                                member.payment_status === 'partial' ? 'text-amber-600' :
                                'text-gray-500'
                              }`}>
                                {member.payment_status}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Pending requests (only visible to creator) */}
                    {pool.is_creator && pendingMembers.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <ExclamationTriangleIcon className="w-5 h-5 text-amber-500" />
                          Pending Requests ({pendingMembers.length})
                        </h3>
                        <div className="space-y-3">
                          {pendingMembers.map((member) => (
                            <div
                              key={member.id}
                              className="flex items-center justify-between p-4 bg-amber-50 rounded-xl border border-amber-200"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center text-amber-700 font-medium">
                                  {member.user_name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-medium">{member.user_name}</p>
                                  <p className="text-sm text-gray-500">
                                    {member.compatibility_score}% compatibility
                                  </p>
                                  {member.request_message && (
                                    <p className="text-sm text-gray-600 mt-1 italic">
                                      "{member.request_message}"
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleApproveMember(member.id)}
                                  className="p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200"
                                >
                                  <CheckCircleIcon className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => handleRejectMember(member.id)}
                                  className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                                >
                                  <XCircleIcon className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Costs Tab */}
                {activeTab === 'costs' && (
                  <div>
                    {pool.is_member || pool.is_creator ? (
                      <CostSplitCalculator
                        totalAmount={Number(pool.total_price)}
                        members={approvedMembers.map((m) => ({
                          id: m.user,
                          name: m.user_name,
                          amount: Number(m.share_amount),
                        }))}
                        readOnly={!pool.is_creator}
                      />
                    ) : (
                      <div className="text-center py-8">
                        <CurrencyDollarIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">Join the pool to see cost details</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Chat Tab */}
                {activeTab === 'chat' && (
                  <div>
                    {pool.is_member || pool.is_creator ? (
                      <PoolChat poolId={pool.id} poolTitle={pool.title} />
                    ) : (
                      <div className="text-center py-8">
                        <ChatBubbleLeftRightIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">Join the pool to access chat</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Action Card */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <div className="text-center mb-6">
                <p className="text-3xl font-bold text-indigo-600">${Number(pool.price_per_person).toFixed(0)}</p>
                <p className="text-gray-500">per person</p>
              </div>

              {!pool.is_member && !pool.is_creator && pool.status === 'open' && (
                <button
                  onClick={handleJoinPool}
                  className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
                >
                  Join This Pool
                </button>
              )}

              {pool.is_member && !pool.is_creator && (
                <button
                  onClick={handleLeavePool}
                  className="w-full py-4 bg-red-100 text-red-600 font-semibold rounded-xl hover:bg-red-200 transition-colors"
                >
                  Leave Pool
                </button>
              )}

              {pool.is_creator && (
                <div className="space-y-3">
                  {pool.status === 'open' || pool.status === 'full' ? (
                    <>
                      {pool.current_members >= 2 && (
                        <button
                          onClick={handleFinalizeBooking}
                          className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl hover:shadow-lg flex items-center justify-center gap-2"
                        >
                          <CheckCircleIcon className="w-5 h-5" />
                          Finalize Booking
                        </button>
                      )}
                      <button
                        className="w-full py-4 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 flex items-center justify-center gap-2"
                      >
                        <Cog6ToothIcon className="w-5 h-5" />
                        Manage Pool
                      </button>
                      <button
                        className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg flex items-center justify-center gap-2"
                      >
                        <PaperAirplaneIcon className="w-5 h-5" />
                        Invite Members
                      </button>
                    </>
                  ) : pool.status === 'booked' ? (
                    <div className="py-4 bg-emerald-50 text-emerald-700 font-medium rounded-xl text-center flex items-center justify-center gap-2">
                      <CheckCircleIcon className="w-5 h-5" />
                      Booking Confirmed
                    </div>
                  ) : null}
                </div>
              )}

              {pool.my_membership?.status === 'pending' && (
                <div className="py-4 bg-amber-50 text-amber-700 font-medium rounded-xl text-center">
                  Awaiting approval
                </div>
              )}
            </div>

            {/* Pool Stats */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Pool Stats</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Cost</span>
                  <span className="font-semibold">${Number(pool.total_price).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Per Person</span>
                  <span className="font-semibold text-emerald-600">${Number(pool.price_per_person).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Service Fee</span>
                  <span className="font-semibold">${Number(pool.booking_fee_per_person).toFixed(2)}</span>
                </div>
                <hr />
                <div className="flex justify-between">
                  <span className="text-gray-600">You Save</span>
                  <span className="font-semibold text-emerald-600">
                    ${(Number(pool.total_price) - Number(pool.price_per_person)).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Creator Info */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Created By</h3>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold">
                  {pool.creator_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium">{pool.creator_name}</p>
                  <p className="text-sm text-gray-500">Pool Creator</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PoolDetailPage;

