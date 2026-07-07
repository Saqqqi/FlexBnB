"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useAuth, SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import ReviewForm from "../components/Reviews/ReviewForm";
import Link from "next/link";
import { 
  CalendarIcon, 
  CheckCircleIcon,
  StarIcon,
  UserGroupIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

interface PoolInfo {
  pool_id: string;
  pool_title: string;
  my_share: number;
  amount_paid: number;
  payment_status: string;
  is_creator: boolean;
  total_members: number;
}

interface Reservation {
  id: string;
  property: {
    id: string;
    title: string;
    image_url: string;
  };
  check_in_date: string;
  check_out_date: string;
  guests_count: number;
  total_price: number | string; // Can be string from Django DecimalField
  status: string;
  special_requests: string;
  created_at: string;
  hasReview?: boolean;
  // Room pooling fields
  is_room_pool?: boolean;
  booking_type?: string;
  room_pool_id?: string;
  pool_members_count?: number;
  pool_info?: PoolInfo;
}

const MyReservationsPage = () => {
  const { getToken } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [poolReservations, setPoolReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'individual' | 'pool'>('individual');

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      
      // Fetch individual reservations
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_HOST}/api/booking/guest-reservations/`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        // Filter individual reservations (not room pool)
        const individual = data.filter((r: Reservation) => !r.is_room_pool);
        setReservations(individual);
      } else {
        console.log('Failed to fetch reservations, using mock data');
        setReservations(getMockReservations());
      }
      
      // Fetch pool member reservations
      const poolResponse = await fetch(`${process.env.NEXT_PUBLIC_API_HOST}/api/booking/pool-member-reservations/`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (poolResponse.ok) {
        const poolData = await poolResponse.json();
        setPoolReservations(poolData);
      }
    } catch (error) {
      console.error('Error fetching reservations:', error);
      setReservations(getMockReservations());
    } finally {
      setLoading(false);
    }
  };

  const getMockReservations = (): Reservation[] => [
    {
      id: '1',
      property: { id: '1', title: 'Modern Apartment Downtown', image_url: '/aliImgFinal.jpeg' },
      check_in_date: '2024-02-15',
      check_out_date: '2024-02-18',
      guests_count: 2,
      total_price: 450.00,
      status: 'completed',
      special_requests: 'Late check-in requested',
      created_at: '2024-02-10T10:30:00Z',
      hasReview: false
    },
    {
      id: '2',
      property: { id: '2', title: 'Cozy Studio', image_url: '/aliImgFinal.jpeg' },
      check_in_date: '2024-02-20',
      check_out_date: '2024-02-22',
      guests_count: 1,
      total_price: 280.00,
      status: 'approved',
      special_requests: '',
      created_at: '2024-02-12T14:15:00Z',
      hasReview: false
    },
    {
      id: '3',
      property: { id: '3', title: 'Luxury Villa', image_url: '/aliImgFinal.jpeg' },
      check_in_date: '2024-01-25',
      check_out_date: '2024-01-28',
      guests_count: 3,
      total_price: 675.00,
      status: 'completed',
      special_requests: 'Extra towels needed',
      created_at: '2024-01-20T09:00:00Z',
      hasReview: true
    }
  ];

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      declined: 'bg-red-100 text-red-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    return badges[status] || badges.cancelled;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", { timeZone: "UTC" });
  };

  const calculateNights = (checkIn: string, checkOut: string) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const isCheckoutDatePassed = (checkOutDate: string) => {
    const checkout = new Date(checkOutDate);
    const today = new Date();
    checkout.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return checkout <= today;
  };

  const handleReviewSubmitted = (reservationId: string) => {
    setReservations(prev => 
      prev.map(res => 
        res.id === reservationId ? { ...res, hasReview: true } : res
      )
    );
  };

  if (loading) {
    return (
      <main className="max-w-[1500px] mx-auto p-6 pt-4">
        <h1 className="mt-6 mb-2 text-2xl">My Reservations</h1>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </main>
    );
  }

  const currentReservations = activeTab === 'individual' ? reservations : poolReservations;

  return (
    <>
      <SignedIn>
        <main className="max-w-[1500px] mx-auto p-6 pt-4">
          <h1 className="mt-6 mb-6 text-2xl font-bold">My Reservations</h1>
          
          {/* Tab Navigation */}
          <div className="flex gap-4 mb-6 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('individual')}
              className={`pb-3 px-4 text-sm font-medium transition-colors relative ${
                activeTab === 'individual'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                Individual Bookings
                {reservations.length > 0 && (
                  <span className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full">
                    {reservations.length}
                  </span>
                )}
              </div>
            </button>
            <button
              onClick={() => setActiveTab('pool')}
              className={`pb-3 px-4 text-sm font-medium transition-colors relative ${
                activeTab === 'pool'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <UserGroupIcon className="w-5 h-5" />
                Pool Bookings
                {poolReservations.length > 0 && (
                  <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full">
                    {poolReservations.length}
                  </span>
                )}
              </div>
            </button>
          </div>
          
          {currentReservations.length === 0 ? (
            <div className="text-center py-12">
              {activeTab === 'individual' ? (
                <>
                  <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No individual reservations</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by making your first booking.</p>
                </>
              ) : (
                <>
                  <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No pool bookings</h3>
                  <p className="mt-1 text-sm text-gray-500">Join a room pool to share costs with others.</p>
                  <Link href="/room-pooling" className="mt-4 inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                    Browse Room Pools
                  </Link>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {currentReservations.map((reservation) => (
                <div key={reservation.id} className={`p-4 m-4 grid grid-cols-1 lg:grid-cols-4 gap-4 shadow-md border rounded-xl ${
                  reservation.is_room_pool ? 'border-indigo-200 bg-indigo-50/30' : 'border-gray-300'
                }`}>
                  <div className="lg:col-span-1">
                    <div className="relative overflow-hidden aspect-square rounded-xl">
                      <Image
                        fill
                        src={reservation.property.image_url}
                        className="hover:scale-110 object-cover transition h-full w-full"
                        alt={reservation.property.title}
                      />
                      {reservation.is_room_pool && (
                        <div className="absolute top-2 left-2 bg-indigo-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                          <UserGroupIcon className="w-3 h-3" />
                          Pool
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="lg:col-span-3 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-xl font-semibold">{reservation.property.title}</h2>
                        {reservation.pool_info && (
                          <p className="text-sm text-indigo-600 mt-1">
                            Pool: {reservation.pool_info.pool_title}
                            {reservation.pool_info.is_creator && (
                              <span className="ml-2 bg-indigo-100 text-indigo-800 text-xs px-2 py-0.5 rounded-full">Creator</span>
                            )}
                          </p>
                        )}
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(reservation.status)}`}>
                        {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <p><strong>Check In:</strong> {formatDate(reservation.check_in_date)}</p>
                      <p><strong>Check Out:</strong> {formatDate(reservation.check_out_date)}</p>
                      <p><strong>Nights:</strong> {calculateNights(reservation.check_in_date, reservation.check_out_date)}</p>
                      <p><strong>Guests:</strong> {reservation.guests_count}</p>
                      {reservation.pool_info ? (
                        <>
                          <p><strong>Your Share:</strong> <span className="text-emerald-600 font-semibold">${reservation.pool_info.my_share.toFixed(2)}</span></p>
                          <p><strong>Pool Members:</strong> {reservation.pool_info.total_members}</p>
                        </>
                      ) : (
                        <p><strong>Total Price:</strong> ${Number(reservation.total_price).toFixed(2)}</p>
                      )}
                      <p><strong>Booked:</strong> {formatDate(reservation.created_at)}</p>
                    </div>
                    
                    {reservation.pool_info && (
                      <div className="flex items-center gap-4 text-sm bg-white p-3 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-1">
                          <CurrencyDollarIcon className="w-4 h-4 text-gray-500" />
                          <span>Paid: ${reservation.pool_info.amount_paid.toFixed(2)}</span>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs ${
                          reservation.pool_info.payment_status === 'paid' 
                            ? 'bg-green-100 text-green-800' 
                            : reservation.pool_info.payment_status === 'partial'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {reservation.pool_info.payment_status.charAt(0).toUpperCase() + reservation.pool_info.payment_status.slice(1)}
                        </div>
                      </div>
                    )}
                    
                    {reservation.special_requests && (
                      <div className="text-sm">
                        <strong>Special Requests:</strong> {reservation.special_requests}
                      </div>
                    )}
                    
                    <div className="flex flex-wrap gap-3 mt-4">
                      <a 
                        href={`/Properties/${reservation.property.id}`}
                        className="inline-block cursor-pointer py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        View Property
                      </a>
                      
                      {reservation.pool_info && (
                        <Link
                          href={`/room-pooling/${reservation.pool_info.pool_id}`}
                          className="inline-block cursor-pointer py-2 px-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          View Pool
                        </Link>
                      )}
                      
                      {((reservation.status === 'completed' || 
                         (reservation.status === 'approved' && isCheckoutDatePassed(reservation.check_out_date))) 
                        && !reservation.hasReview) && (
                        <div className="flex items-center space-x-2">
                          <StarIcon className="h-4 w-4 text-yellow-400" />
                          <span className="text-sm text-gray-600">Review this stay</span>
                        </div>
                      )}
                      
                      {((reservation.status === 'completed' || 
                         (reservation.status === 'approved' && isCheckoutDatePassed(reservation.check_out_date))) 
                        && reservation.hasReview) && (
                        <div className="flex items-center space-x-2">
                          <CheckCircleIcon className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-green-600">Review submitted</span>
                        </div>
                      )}
                    </div>
                    
                    {((reservation.status === 'completed' || 
                       (reservation.status === 'approved' && isCheckoutDatePassed(reservation.check_out_date))) 
                      && !reservation.hasReview) && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <ReviewForm 
                          reservationId={reservation.id} 
                          onSubmitted={() => handleReviewSubmitted(reservation.id)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </SignedIn>
      
      <SignedOut>
        <main className="max-w-[1500px] mx-auto p-6 pt-4">
          <div className="flex flex-col items-center justify-center h-64">
            <h1 className="text-2xl font-bold mb-4">My Reservations</h1>
            <p className="mb-4 text-lg">You must be signed in to view your reservations.</p>
            <SignInButton />
          </div>
        </main>
      </SignedOut>
    </>
  );
};

export default MyReservationsPage;
