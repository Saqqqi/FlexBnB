import { useAuth } from '@clerk/nextjs';

export const useApiAuth = () => {
  const { getToken } = useAuth();

  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    try {
      const token = await getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }

    return headers;
  };

  return { getAuthHeaders };
}; 