import { loadStripe, Stripe } from '@stripe/stripe-js';

let stripeInstance: Stripe | null = null;
let stripePromise: Promise<Stripe | null> | null = null;

export const getStripe = (): Promise<Stripe | null> => {
  if (!stripePromise) {
    stripePromise = loadStripeWithRetry();
  }
  return stripePromise;
};

const loadStripeWithRetry = async (): Promise<Stripe | null> => {
  if (stripeInstance) {
    return stripeInstance;
  }

  if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
    console.warn('Missing Stripe public key');
    return null;
  }

  try {
    stripeInstance = await loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);
    return stripeInstance;
  } catch (error) {
    console.warn('Failed to load Stripe:', error);
    return null;
  }
};

export const isStripeAvailable = async (): Promise<boolean> => {
  const stripe = await getStripe();
  return stripe !== null;
};