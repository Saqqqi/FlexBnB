const API_BASE_URL = process.env.NEXT_PUBLIC_API_HOST + '/api';

// Helper function to get auth headers
const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Get Clerk token
  if (typeof window !== 'undefined') {
    try {
      const { useAuth } = await import('@clerk/nextjs');
      // For server-side or static usage, we'll handle auth differently
      // This is a simplified version - in production you'd want to use useAuth hook properly
      return headers;
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
  }
  
  return headers;
};

// API service functions
export const hostAPI = {
  // Dashboard Stats
  getDashboardStats: async () => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/booking/dashboard/stats/`, {
      headers,
    });
    if (!response.ok) throw new Error('Failed to fetch dashboard stats');
    return response.json();
  },

  // Reservations
  getReservations: async (status?: string) => {
    const headers = await getAuthHeaders();
    const url = status 
      ? `${API_BASE_URL}/booking/reservations/?status=${status}`
      : `${API_BASE_URL}/booking/reservations/`;
    
    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error('Failed to fetch reservations');
    return response.json();
  },

  updateReservationStatus: async (reservationId: string, status: 'approved' | 'declined') => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/booking/reservations/${reservationId}/status/`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ status }),
    });
    if (!response.ok) throw new Error('Failed to update reservation status');
    return response.json();
  },

  // Earnings
  getEarnings: async (startDate?: string, endDate?: string) => {
    const headers = await getAuthHeaders();
    let url = `${API_BASE_URL}/booking/earnings/`;
    
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    if (params.toString()) {
      url += '?' + params.toString();
    }
    
    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error('Failed to fetch earnings');
    return response.json();
  },

  // Messages
  getMessages: async () => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/booking/messages/`, {
      headers,
    });
    if (!response.ok) throw new Error('Failed to fetch messages');
    return response.json();
  },

  sendMessage: async (reservationId: string, message: string) => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/booking/messages/send/`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        reservation_id: reservationId,
        message,
      }),
    });
    if (!response.ok) throw new Error('Failed to send message');
    return response.json();
  },

  // Analytics
  getPropertyAnalytics: async () => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/booking/analytics/`, {
      headers,
    });
    if (!response.ok) throw new Error('Failed to fetch analytics');
    return response.json();
  },

  // Reviews
  getPropertyReviews: async () => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/booking/reviews/`, {
      headers,
    });
    if (!response.ok) throw new Error('Failed to fetch reviews');
    return response.json();
  },

  // Properties
  getProperties: async () => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/properties/`, {
      headers,
    });
    if (!response.ok) throw new Error('Failed to fetch properties');
    return response.json();
  },
}; 