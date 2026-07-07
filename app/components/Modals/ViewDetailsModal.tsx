"use client";

import { XMarkIcon, CalendarIcon, UserIcon, CurrencyDollarIcon, HomeIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

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
  guests_count: number;
  total_price: number | string;
  status: string;
  special_requests: string;
  created_at: string;
}

interface ViewDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: Reservation | null;
}

const ViewDetailsModal = ({ isOpen, onClose, reservation }: ViewDetailsModalProps) => {
  if (!isOpen || !reservation) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", { 
      timeZone: "UTC",
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateNights = (checkIn: string, checkOut: string) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Reservation Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <XMarkIcon className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Property Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <HomeIcon className="h-5 w-5 mr-2 text-blue-600" />
              Property Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative overflow-hidden aspect-square rounded-lg">
                <Image
                  fill
                  src={reservation.property.image_url}
                  className="object-cover"
                  alt={reservation.property.title}
                />
              </div>
              <div className="space-y-2">
                <h4 className="text-xl font-semibold">{reservation.property.title}</h4>
                <p className="text-sm text-gray-600">Property ID: {reservation.property.id}</p>
              </div>
            </div>
          </div>

          {/* Guest Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <UserIcon className="h-5 w-5 mr-2 text-green-600" />
              Guest Information
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <p><span className="font-medium">Name:</span> {reservation.guest.name}</p>
              <p><span className="font-medium">Email:</span> {reservation.guest.email}</p>
              <p><span className="font-medium">Guest ID:</span> {reservation.guest.id}</p>
            </div>
          </div>

          {/* Booking Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <CalendarIcon className="h-5 w-5 mr-2 text-purple-600" />
              Booking Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-500">Check-in Date</p>
                  <p className="text-lg">{formatDate(reservation.check_in_date)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Check-out Date</p>
                  <p className="text-lg">{formatDate(reservation.check_out_date)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Duration</p>
                  <p className="text-lg">{calculateNights(reservation.check_in_date, reservation.check_out_date)} nights</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-500">Number of Guests</p>
                  <p className="text-lg">{reservation.guests_count}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Booking Status</p>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusBadge(reservation.status)}`}>
                    {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Booking Date</p>
                  <p className="text-lg">{formatDate(reservation.created_at)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <CurrencyDollarIcon className="h-5 w-5 mr-2 text-green-600" />
              Financial Information
            </h3>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-2xl font-bold text-green-800">
                Total Amount: ${Number(reservation.total_price).toFixed(2)}
              </p>
            </div>
          </div>

          {/* Special Requests */}
          {reservation.special_requests && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Special Requests</h3>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-gray-700">{reservation.special_requests}</p>
              </div>
            </div>
          )}

          {/* Reservation ID */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900">Reservation ID</h3>
            <div className="bg-gray-100 p-3 rounded-lg">
              <p className="text-sm font-mono text-gray-600">{reservation.id}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewDetailsModal;
