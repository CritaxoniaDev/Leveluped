import { Elements } from '@stripe/react-stripe-js'
import { getStripe } from '@/packages/stripe/stripe'
import { useState, useEffect } from 'react'

interface StripeProviderProps {
    children: React.ReactNode
}

export function StripeProvider({ children }: StripeProviderProps) {
    const [stripe, setStripe] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const initStripe = async () => {
            try {
                const stripeInstance = await getStripe()
                setStripe(stripeInstance)
            } catch (error) {
                console.error('Error loading Stripe:', error)
            } finally {
                setLoading(false)
            }
        }

        initStripe()
    }, [])

    if (loading) {
        return <div>{children}</div>
    }

    return stripe ? (
        <Elements stripe={stripe}>
            {children}
        </Elements>
    ) : (
        <div>{children}</div>
    )
}