// src/app/lib/apiClient.js

export const BASE_URL = process.env.NEXT_PUBLIC_API_URL;
export const STORAGE_URL = process.env.NEXT_PUBLIC_STORAGE_URL;

const DEFAULT_TIMEOUT = 30000; // 30 Seconds

/**
 * General request handler with Timeout support
 */
async function request(endpoint, options = {}) {
   // Setup AbortController for timeout
   const controller = new AbortController();
   const id = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

   const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options.headers,
   };

   const config = {
      ...options,
      headers,
      signal: controller.signal, // Connect signal to fetch
      cache: 'no-store', // Ensure fresh data
   };

   try {
      const res = await fetch(`${BASE_URL}${endpoint}`, config);
      console.log("-  - - - - - - - -");
      console.log(res);
      console.log("-  - - - - - - - -");
      clearTimeout(id); 

      if (!res.ok) {
         throw new Error(`API Error: ${res.status} - ${res.statusText}`);
      }

      const json = await res.json();
      return json;
   } catch (error) {
      clearTimeout(id);

      // Handle AbortError (Timeout)
      if (error.name === 'AbortError') {
         console.error('API Request Timed Out');
         throw new Error('Timeout: Server took too long to respond.');
      }

      console.error('API Request Failed:', error);
      throw error;
   }
}

export const api = {
   get: (endpoint) => request(endpoint, { method: 'GET' }),
   post: (endpoint, body) =>
      request(endpoint, {
         method: 'POST',
         body: JSON.stringify(body),
      }),
};
