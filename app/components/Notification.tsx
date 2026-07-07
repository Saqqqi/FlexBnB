import toast from 'react-hot-toast';

export function showBookingConfirmation(propertyTitle: string) {
  toast.success(`Your booking for ${propertyTitle} is confirmed!`, {
    duration: 5000,
    position: 'top-center',
  });
} 