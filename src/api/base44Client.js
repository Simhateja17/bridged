import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client - auth is optional, allowing public access to certain endpoints
export const base44 = createClient({
  appId: "68f05187ddeac353e5298844", 
  requiresAuth: false // Allow public access - individual requests can require auth as needed
});
