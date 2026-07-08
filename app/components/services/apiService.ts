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

      const headers: Record<string, string> = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      };

      // Don't set Content-Type for FormData — browser sets it with boundary
      if (!(data instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_HOST}${url}`, {
        method: 'POST',
        body: data,
        headers,
        credentials: 'include',
      });

      let responseData;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        const textData = await response.text();
        try {
          responseData = JSON.parse(textData);
        } catch {
          responseData = { message: textData };
        }
      }

      if (!response.ok) {
        throw {
          status: response.status,
          ...responseData,
        };
      }

      return responseData;
    } catch (error) {
      // Log only the error message and status — never log tokens or headers
      if (process.env.NODE_ENV !== 'production') {
        console.error(
          'POST request failed:',
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
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
          ...responseData,
        };
      }

      return responseData;
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error(
          'POST (unauthenticated) request failed:',
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
      throw error;
    }
  },
};

export default apiService;
