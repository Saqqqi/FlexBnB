'use client';

/**
 * PaymentModal — booking summary + Stripe Checkout redirect.
 *
 * Card data is NEVER collected here. Stripe Checkout handles all
 * PCI-sensitive input inside Stripe's own hosted page.
 */

import { useState } from 'react';
import {
  LockClosedIcon,
  ShieldCheckIcon,
  XMarkIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Subtotal in dollars (before service fee / taxes) */
  amount: number;
  propertyId: string;
  propertyTitle: string;
  startDate: string;
  endDate: string;
  guests: number;
}

const SERVICE_FEE_RATE = 0.029; // 2.9 %
const TAX_RATE = 0.08;          // 8 %

const PaymentModal = ({
  isOpen,
  onClose,
  amount,
  propertyId,
  propertyTitle,
  startDate,
  endDate,
  guests,
}: PaymentModalProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const serviceFee = Math.round(amount * SERVICE_FEE_RATE * 100) / 100;
  const taxes = Math.round(amount * TAX_RATE * 100) / 100;
  const total = Math.round((amount + serviceFee + taxes) * 100) / 100;

  const handleCheckout = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          propertyTitle,
          startDate,
          endDate,
          guests,
          amount: total, // send the final total to be charged
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.url) {
        setError(data.error || 'Failed to start checkout. Please try again.');
        setLoading(false);
        return;
      }

      // Redirect to Stripe Checkout — card data never touches this app
      window.location.href = data.url;
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-2">
            <LockClosedIcon className="h-5 w-5 text-green-500" />
            <h2 className="text-xl font-bold text-gray-900">Confirm &amp; Pay</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">

          {/* Stripe badge */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center space-x-3">
            <ShieldCheckIcon className="h-5 w-5 text-green-600 flex-shrink-0" />
            <p className="text-sm text-green-800">
              You'll be taken to Stripe's secure checkout. Card details are never shared with FlexBnB.
            </p>
          </div>

          {/* Booking summary */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3 text-sm">
            <h3 className="font-semibold text-gray-900">{propertyTitle}</h3>

            <div className="flex items-center space-x-2 text-gray-600">
              <CalendarDaysIcon className="h-4 w-4 flex-shrink-0" />
              <span>{startDate} → {endDate}</span>
            </div>

            <div className="flex items-center space-x-2 text-gray-600">
              <UserGroupIcon className="h-4 w-4 flex-shrink-0" />
              <span>{guests} guest{guests !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* Price breakdown */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>${amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Service fee (2.9%)</span>
              <span>${serviceFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Taxes (8%)</span>
              <span>${taxes.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 border-t pt-2">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
              {error}
            </p>
          )}

          {/* CTA */}
          <button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl transition-colors flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                <span>Redirecting to Stripe…</span>
              </>
            ) : (
              <>
                <CurrencyDollarIcon className="h-5 w-5" />
                <span>Pay ${total.toFixed(2)} with Stripe</span>
              </>
            )}
          </button>

          <p className="text-xs text-center text-gray-400">
            Powered by{' '}
            <a
              href="https://stripe.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Stripe
            </a>{' '}
            — PCI DSS Level 1 certified
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
