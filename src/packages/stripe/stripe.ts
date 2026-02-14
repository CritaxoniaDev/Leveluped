import { loadStripe } from '@stripe/stripe-js'

let stripePromise: Promise<any> | null = null

export const getStripe = async () => {
    if (!stripePromise) {
        stripePromise = loadStripe(import.meta.env.VITE_PUBLIC_STRIPE_PUBLIC_KEY)
    }
    return stripePromise
}