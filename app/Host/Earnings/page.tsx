"use client";
import { useEffect, useState } from 'react';
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { 
  CurrencyDollarIcon, 
  ChartBarIcon, 
  BanknotesIcon,
  ArrowTrendingUpIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import DashboardLayout from '../../components/Host/DashboardLayout';
import DataTable from '../../components/Host/DataTable';
import StatsCard from '../../components/Host/StatsCard';
import DonutChart from '../../components/Host/DonutChart';

interface Earning {
  id: string;
  reservation: {
    id: string;
    property: {
      title: string;
    };
    guest: {
      name: string;
    };
    check_in_date: string;
    check_out_date: string;
  };
  gross_earnings: number;
  platform_fee: number;
  net_earnings: number;
  payout_status: string;
  payout_date: string | null;
  created_at: string;
}

const EarningsPage = () => {
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<string>('all');

  useEffect(() => {
    // Mock data for demonstration
    const mockEarnings: Earning[] = [
      {
        id: '1',
        reservation: {
          id: '1',
          property: { title: 'Modern Apartment Downtown' },
          guest: { name: 'John Doe' },
          check_in_date: '2024-02-15',
          check_out_date: '2024-02-18'
        },
        gross_earnings: 450.00,
        platform_fee: 45.00,
        net_earnings: 405.00,
        payout_status: 'paid',
        payout_date: '2024-02-20',
        created_at: '2024-02-10T10:30:00Z'
      },
      {
        id: '2',
        reservation: {
          id: '2',
          property: { title: 'Cozy Studio' },
          guest: { name: 'Jane Smith' },
          check_in_date: '2024-02-20',
          check_out_date: '2024-02-22'
        },
        gross_earnings: 280.00,
        platform_fee: 28.00,
        net_earnings: 252.00,
        payout_status: 'processing',
        payout_date: null,
        created_at: '2024-02-12T14:15:00Z'
      },
      {
        id: '3',
        reservation: {
          id: '3',
          property: { title: 'Modern Apartment Downtown' },
          guest: { name: 'Bob Johnson' },
          check_in_date: '2024-01-25',
          check_out_date: '2024-01-28'
        },
        gross_earnings: 675.00,
        platform_fee: 67.50,
        net_earnings: 607.50,
        payout_status: 'paid',
        payout_date: '2024-01-30',
        created_at: '2024-01-20T09:00:00Z'
      }
    ];

    setEarnings(mockEarnings);
    setLoading(false);
  }, []);

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800'
    };
    return badges[status as keyof typeof badges] || badges.pending;
  };

  const columns = [
    {
      key: 'reservation.property.title',
      label: 'Property',
      sortable: true,
      render: (value: string, row: Earning) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">
            {new Date(row.reservation.check_in_date).toLocaleDateString()} - {new Date(row.reservation.check_out_date).toLocaleDateString()}
          </div>
        </div>
      )
    },
    {
      key: 'reservation.guest.name',
      label: 'Guest',
      sortable: true
    },
    {
      key: 'gross_earnings',
      label: 'Gross Earnings',
      sortable: true,
      render: (value: number) => `$${value.toFixed(2)}`
    },
    {
      key: 'platform_fee',
      label: 'Platform Fee',
      sortable: true,
      render: (value: number) => `$${value.toFixed(2)}`
    },
    {
      key: 'net_earnings',
      label: 'Net Earnings',
      sortable: true,
      render: (value: number) => (
        <span className="font-medium text-green-600">${value.toFixed(2)}</span>
      )
    },
    {
      key: 'payout_status',
      label: 'Payout Status',
      sortable: true,
      render: (value: string) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(value)}`}>
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
      )
    },
    {
      key: 'payout_date',
      label: 'Payout Date',
      sortable: true,
      render: (value: string | null) => 
        value ? new Date(value).toLocaleDateString() : 'Pending'
    }
  ];

  // Calculate stats
  const stats = {
    totalEarnings: earnings.reduce((sum, earning) => sum + earning.net_earnings, 0),
    totalGross: earnings.reduce((sum, earning) => sum + earning.gross_earnings, 0),
    totalFees: earnings.reduce((sum, earning) => sum + earning.platform_fee, 0),
    pendingPayouts: earnings.filter(e => e.payout_status === 'pending' || e.payout_status === 'processing').length
  };

  // Chart data for earnings breakdown
  const earningsBreakdown = [
    { label: 'Net Earnings', value: stats.totalEarnings, color: '#10B981' },
    { label: 'Platform Fees', value: stats.totalFees, color: '#EF4444' }
  ];

  if (loading) {
    return (
      <DashboardLayout title="Earnings" subtitle="Track your financial performance">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <SignedIn>
        <DashboardLayout title="Earnings" subtitle="Track your financial performance">
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <StatsCard
                title="Total Net Earnings"
                value={`$${stats.totalEarnings.toFixed(2)}`}
                icon={<CurrencyDollarIcon className="h-6 w-6 text-green-600" />}
                trend={{
                  value: "15% increase",
                  isPositive: true
                }}
              />
              <StatsCard
                title="Gross Revenue"
                value={`$${stats.totalGross.toFixed(2)}`}
                icon={<ArrowTrendingUpIcon className="h-6 w-6 text-blue-600" />}
              />
              <StatsCard
                title="Platform Fees"
                value={`$${stats.totalFees.toFixed(2)}`}
                icon={<ChartBarIcon className="h-6 w-6 text-orange-600" />}
              />
              <StatsCard
                title="Pending Payouts"
                value={stats.pendingPayouts}
                icon={<BanknotesIcon className="h-6 w-6 text-yellow-600" />}
              />
            </div>

            {/* Charts and Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Earnings Breakdown Chart */}
              <div className="lg:col-span-1">
                <DonutChart
                  title="Earnings Breakdown"
                  data={earningsBreakdown}
                />
              </div>

              {/* Monthly Summary */}
              <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Monthly Performance
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">This Month</span>
                    <span className="font-medium text-green-600">$657.00</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Last Month</span>
                    <span className="font-medium">$875.50</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Average per Booking</span>
                    <span className="font-medium">$421.50</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Platform Fee Rate</span>
                    <span className="font-medium">10%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setDateRange('all')}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    dateRange === 'all' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All Time
                </button>
                <button
                  onClick={() => setDateRange('month')}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    dateRange === 'month' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  This Month
                </button>
                <button
                  onClick={() => setDateRange('quarter')}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    dateRange === 'quarter' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  This Quarter
                </button>
                <button
                  onClick={() => setDateRange('year')}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    dateRange === 'year' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  This Year
                </button>
              </div>
            </div>

            {/* Earnings Table */}
            <DataTable
              title="Earnings History"
              subtitle={`${earnings.length} transactions found`}
              columns={columns}
              data={earnings}
              pageSize={10}
              emptyMessage="No earnings found"
            />

            {/* Payout Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Payout Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Next Payout</h4>
                  <p className="text-sm text-gray-600 mb-1">Amount: <span className="font-medium">$252.00</span></p>
                  <p className="text-sm text-gray-600 mb-1">Date: <span className="font-medium">March 1, 2024</span></p>
                  <p className="text-sm text-gray-600">Status: <span className="text-blue-600 font-medium">Processing</span></p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Payment Method</h4>
                  <p className="text-sm text-gray-600 mb-1">Bank Account: <span className="font-medium">****1234</span></p>
                  <p className="text-sm text-gray-600 mb-1">Routing: <span className="font-medium">****5678</span></p>
                  <button className="text-sm text-blue-600 hover:text-blue-800">
                    Update Payment Method
                  </button>
                </div>
              </div>
            </div>
          </div>
        </DashboardLayout>
      </SignedIn>
      
      <SignedOut>
        <div className="flex flex-col items-center justify-center h-screen">
          <p className="mb-4 text-lg">You must be signed in to view Earnings.</p>
          <SignInButton />
        </div>
      </SignedOut>
    </>
  );
};

export default EarningsPage; 