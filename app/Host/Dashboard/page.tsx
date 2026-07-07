"use client";
import { useEffect, useState } from 'react';
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { 
  HomeIcon, 
  CurrencyDollarIcon, 
  InboxIcon, 
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import DashboardLayout from '../../components/Host/DashboardLayout';
import StatsCard from '../../components/Host/StatsCard';
import DataTable from '../../components/Host/DataTable';
import DonutChart from '../../components/Host/DonutChart';
import { hostAPI } from '../../lib/api';

interface DashboardStats {
  total_properties: number;
  total_reservations: number;
  pending_requests: number;
  total_earnings: number;
  this_month_earnings: number;
  occupancy_rate: number;
  average_rating: number;
  unread_messages: number;
}

interface Reservation {
  id: string;
  property: {
    id: string;
    title: string;
    image_url: string;
  };
  guest: {
    id: string;
    email: string;
    name: string;
  };
  check_in_date: string;
  check_out_date: string;
  total_price: number;
  status: string;
  created_at: string;
}

const HostDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentReservations, setRecentReservations] = useState<Reservation[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // For demo purposes, using mock data
        setStats({
          total_properties: 5,
          total_reservations: 24,
          pending_requests: 3,
          total_earnings: 12500.00,
          this_month_earnings: 2450.00,
          occupancy_rate: 78,
          average_rating: 4.6,
          unread_messages: 2
        });

        setRecentReservations([
          {
            id: '1',
            property: { id: '1', title: 'Modern Apartment Downtown', image_url: '/placeholder.jpg' },
            guest: { id: '1', email: 'john@example.com', name: 'John Doe' },
            check_in_date: '2024-02-15',
            check_out_date: '2024-02-18',
            total_price: 450.00,
            status: 'approved',
            created_at: '2024-02-10'
          }
        ]);

        setPendingRequests([
          {
            id: '2',
            property: { id: '2', title: 'Cozy Studio', image_url: '/placeholder.jpg' },
            guest: { id: '2', email: 'jane@example.com', name: 'Jane Smith' },
            check_in_date: '2024-02-20',
            check_out_date: '2024-02-22',
            total_price: 280.00,
            status: 'pending',
            created_at: '2024-02-12'
          }
        ]);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleApproveReservation = async (reservationId: string) => {
    try {
      // For demo purposes, just update the local state
      setPendingRequests(prev => 
        prev.map(req => 
          req.id === reservationId ? { ...req, status: 'approved' } : req
        ).filter(req => req.status === 'pending')
      );
    } catch (err) {
      console.error('Error approving reservation:', err);
    }
  };

  const handleDeclineReservation = async (reservationId: string) => {
    try {
      // For demo purposes, just update the local state
      setPendingRequests(prev => 
        prev.filter(req => req.id !== reservationId)
      );
    } catch (err) {
      console.error('Error declining reservation:', err);
    }
  };

  // Table columns for recent reservations
  const reservationColumns = [
    {
      key: 'property.title',
      label: 'Property',
      render: (value: string, row: Reservation) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center">
            <HomeIcon className="h-5 w-5 text-gray-500" />
          </div>
          <span className="font-medium">{value}</span>
        </div>
      )
    },
    { key: 'guest.name', label: 'Guest' },
    { key: 'check_in_date', label: 'Check-in' },
    { key: 'check_out_date', label: 'Check-out' },
    { 
      key: 'total_price', 
      label: 'Amount',
      render: (value: number) => `$${value.toFixed(2)}`
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          value === 'approved' ? 'bg-green-100 text-green-800' :
          value === 'pending' ? 'bg-yellow-100 text-yellow-800' :
          value === 'declined' ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
      )
    }
  ];

  // Table columns for pending requests
  const pendingColumns = [
    ...reservationColumns,
    {
      key: 'actions',
      label: 'Actions',
      render: (value: any, row: Reservation) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleApproveReservation(row.id)}
            className="px-3 py-1 text-xs bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Approve
          </button>
          <button
            onClick={() => handleDeclineReservation(row.id)}
            className="px-3 py-1 text-xs bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Decline
          </button>
        </div>
      )
    }
  ];

  // Chart data for occupancy
  const occupancyData = [
    { label: 'Occupied', value: stats?.occupancy_rate || 0, color: '#10B981' },
    { label: 'Available', value: 100 - (stats?.occupancy_rate || 0), color: '#3B82F6' }
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <SignedIn>
        <DashboardLayout title="Dashboard" subtitle="Home">
          {error ? (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Stats Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                  title="Total Properties"
                  value={stats?.total_properties || 0}
                  icon={<HomeIcon className="h-6 w-6 text-blue-600" />}
                />
                
                <StatsCard
                  title="This Month Earnings"
                  value={`$${(stats?.this_month_earnings || 0).toFixed(2)}`}
                  subtitle="USD"
                  icon={<CurrencyDollarIcon className="h-6 w-6 text-green-600" />}
                  trend={{
                    value: "12% increase",
                    isPositive: true
                  }}
                />
                
                <StatsCard
                  title="Pending Requests"
                  value={stats?.pending_requests || 0}
                  icon={<InboxIcon className="h-6 w-6 text-yellow-600" />}
                />
                
                <StatsCard
                  title="Total Reservations"
                  value={stats?.total_reservations || 0}
                  icon={<UsersIcon className="h-6 w-6 text-purple-600" />}
                  trend={{
                    value: "8% increase",
                    isPositive: true
                  }}
                />
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Reservations */}
                <div className="lg:col-span-2">
                  <DataTable
                    title="Recent Reservations"
                    subtitle="Today"
                    columns={reservationColumns}
                    data={recentReservations}
                    pageSize={5}
                    emptyMessage="No reservations found"
                  />
                </div>

                {/* Occupancy Chart */}
                <div className="lg:col-span-1">
                  <DonutChart
                    title="Occupancy Rate"
                    data={occupancyData}
                  />
                </div>
              </div>

              {/* Pending Requests */}
              <div>
                <DataTable
                  title="Pending Booking Requests"
                  subtitle="Awaiting your approval"
                  columns={pendingColumns}
                  data={pendingRequests}
                  pageSize={5}
                  emptyMessage="No pending requests"
                />
              </div>

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Quick Actions
                  </h3>
                  <div className="space-y-3">
                    <button className="w-full text-left p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors">
                      <div className="flex items-center space-x-3">
                        <HomeIcon className="h-5 w-5 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">Add New Property</span>
                      </div>
                    </button>
                    <button className="w-full text-left p-3 rounded-lg bg-green-50 hover:bg-green-100 transition-colors">
                      <div className="flex items-center space-x-3">
                        <CurrencyDollarIcon className="h-5 w-5 text-green-600" />
                        <span className="text-sm font-medium text-green-900">View Earnings</span>
                      </div>
                    </button>
                    <button className="w-full text-left p-3 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors">
                      <div className="flex items-center space-x-3">
                        <ChatBubbleLeftRightIcon className="h-5 w-5 text-purple-600" />
                        <span className="text-sm font-medium text-purple-900">Check Messages</span>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Performance Metrics
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Average Rating</span>
                        <span className="font-medium">{(stats?.average_rating || 0).toFixed(1)}/5.0</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-yellow-400 h-2 rounded-full" 
                          style={{ width: `${(stats?.average_rating || 0) * 20}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Occupancy Rate</span>
                        <span className="font-medium">{(stats?.occupancy_rate || 0).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${stats?.occupancy_rate || 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Earnings Summary
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Earnings</span>
                      <span className="font-medium text-green-600">
                        ${(stats?.total_earnings || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">This Month</span>
                      <span className="font-medium">
                        ${(stats?.this_month_earnings || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Unread Messages</span>
                      <span className="font-medium text-red-600">
                        {stats?.unread_messages || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DashboardLayout>
      </SignedIn>
      
      <SignedOut>
        <div className="flex flex-col items-center justify-center h-screen">
          <p className="mb-4 text-lg">You must be signed in to view the Host Dashboard.</p>
          <SignInButton />
        </div>
      </SignedOut>
    </>
  );
};

export default HostDashboard; 