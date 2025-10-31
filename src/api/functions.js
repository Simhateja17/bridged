import { base44 } from './base44Client';

// Export functions safely with error handling
export const createStripeCheckout = (...args) => {
  if (!base44.functions?.createStripeCheckout) {
    console.error('createStripeCheckout function not available');
    return Promise.reject(new Error('Stripe checkout function not configured'));
  }
  return base44.functions.createStripeCheckout(...args);
};

export const stripeWebhook = (...args) => {
  if (!base44.functions?.stripeWebhook) {
    console.error('stripeWebhook function not available');
    return Promise.reject(new Error('Stripe webhook function not configured'));
  }
  return base44.functions.stripeWebhook(...args);
};

export const sendScheduledNewsletters = (...args) => {
  if (!base44.functions?.sendScheduledNewsletters) {
    console.error('sendScheduledNewsletters function not available');
    return Promise.reject(new Error('Newsletter function not configured'));
  }
  return base44.functions.sendScheduledNewsletters(...args);
};

export const createAdminUser = (...args) => {
  if (!base44.functions?.createAdminUser) {
    console.error('createAdminUser function not available');
    return Promise.reject(new Error('Admin user function not configured'));
  }
  return base44.functions.createAdminUser(...args);
};

