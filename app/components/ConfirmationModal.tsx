import React from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  property: {
    title: string;
    startDate: string;
    endDate: string;
    totalPrice: number;
  };
}

const ConfirmationModal = ({ isOpen, onClose, onConfirm, property }: ConfirmationModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-xl">
        <h2 className="text-xl font-bold mb-4">Confirm Reservation</h2>

        <div className="mb-4 space-y-1 text-sm text-gray-700">
          <div className="mb-2 font-semibold text-gray-900">Booking Details</div>
          <div>Property: {property.title}</div>
          <div>Check-in: {property.startDate}</div>
          <div>Check-out: {property.endDate}</div>
          <div className="font-semibold mt-2">Total: ${property.totalPrice}</div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
