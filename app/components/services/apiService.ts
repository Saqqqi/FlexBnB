'use client';

const apiService = {
  get: async function (url: string, token: string | null): Promise<any> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_HOST}${url}`, {
      method: 'GET',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch');
    }
    
    return response.json();
  },

  post: async function (url: string, data: any, token: string | null): Promise<any> {
    try {
      if (!token) {
        throw new Error('No authentication token provided');
      }

      console.log('Making POST request to:', `${process.env.NEXT_PUBLIC_API_HOST}${url}`);
      console.log('With token:', token);

      const headers: Record<string, string> = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      };

      // Don't set Content-Type for FormData
      if (!(data instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
      }

      console.log('Request headers:', headers);
      console.log('Request data:', data instanceof FormData ? 'FormData object' : data);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_HOST}${url}`, {
        method: 'POST',
        body: data,
        headers,
        credentials: 'include',
      });

      console.log('Response status:', response.status);
      
      let responseData;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
        console.log('Response data:', responseData);
      } else {
        const textData = await response.text();
        console.log('Response text:', textData);
        try {
          responseData = JSON.parse(textData);
        } catch (e) {
          responseData = { message: textData };
        }
      }

      if (!response.ok) {
        throw {
          status: response.status,
          ...responseData
        };
      }

      return responseData;
    } catch (error) {
      console.error('Detailed error in POST request:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  },

  postWithoutToken: async function (url: string, data: any): Promise<any> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_HOST}${url}`, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        throw {
          status: response.status,
          ...responseData
        };
      }

      return responseData;
    } catch (error) {
      console.error('Error in POST request (without token):', error);
      throw error;
    }
  },
};

export default apiService;


