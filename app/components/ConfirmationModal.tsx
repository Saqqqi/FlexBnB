import React from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  card: string;
  expiry: string;
  property: {
    title: string;
    startDate: string;
    endDate: string;
    totalPrice: number;
  };
}

const maskCard = (card: string) => {
  if (!card) return '';
  return card.replace(/.(?=.{4})/g, '*');
};

const ConfirmationModal = ({ isOpen, onClose, onConfirm, card, expiry, property }: ConfirmationModalProps) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Confirm Reservation</h2>
        <div className="mb-4">
          <div className="mb-2 font-semibold">Card Details</div>
          <div>Card: {maskCard(card)}</div>
          <div>Expiry: {expiry}</div>
        </div>
        <div className="mb-4">
          <div className="mb-2 font-semibold">Property Details</div>
          <div>Title: {property.title}</div>
          <div>Check-in: {property.startDate}</div>
          <div>Check-out: {property.endDate}</div>
          <div>Total: ${property.totalPrice}</div>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 bg-green-600 text-white rounded">Confirm</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal; 