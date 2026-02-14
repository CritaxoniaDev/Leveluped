import { supabase } from '@/packages/supabase/supabase'

export interface StripeProduct {
    id: string
    name: string
    description: string
    amount: number
    currency: string
    coins: number
    stripeProductId: string
    stripePriceId: string
    created_at: string
}

export interface UserWallet {
    user_id: string
    total_coins: number
    spent_coins: number
    available_coins: number
    updated_at: string
}

export interface CoinTransaction {
    id: string
    user_id: string
    amount: number
    type: 'purchase' | 'spend' | 'refund' | 'bonus'
    description: string
    reference_id: string | null
    created_at: string
}

// Fetch available coin packages
export const fetchCoinPackages = async (): Promise<StripeProduct[]> => {
    try {
        const { data, error } = await supabase
            .from('stripe_products')
            .select('*')
            .order('amount', { ascending: true })

        if (error) throw error
        return data || []
    } catch (error) {
        console.error('Error fetching coin packages:', error)
        return []
    }
}

// Get user's wallet info
export const getUserWallet = async (userId: string): Promise<UserWallet | null> => {
    try {
        const { data, error } = await supabase
            .from('user_wallets')
            .select('*')
            .eq('user_id', userId)
            .single()

        if (error && error.code !== 'PGRST116') throw error
        return data || null
    } catch (error) {
        console.error('Error fetching wallet:', error)
        return null
    }
}

// Get coin transactions
export const getUserTransactions = async (userId: string, limit = 50): Promise<CoinTransaction[]> => {
    try {
        const { data, error } = await supabase
            .from('coin_transactions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit)

        if (error) throw error
        return data || []
    } catch (error) {
        console.error('Error fetching transactions:', error)
        return []
    }
}

// Create a Stripe checkout session
export const createCheckoutSession = async (
    userId: string,
    priceId: string,
    successUrl: string,
    cancelUrl: string
): Promise<{ sessionId: string } | null> => {
    try {
        const { data, error } = await supabase.functions.invoke('create-checkout-session', {
            body: {
                userId,
                priceId,
                successUrl,
                cancelUrl
            }
        })

        if (error) throw error
        return data
    } catch (error) {
        console.error('Error creating checkout session:', error)
        return null
    }
}

// Complete a purchase after payment
export const completePurchase = async (
    userId: string,
    sessionId: string,
    productId: string
): Promise<boolean> => {
    try {
        const { data, error } = await supabase.functions.invoke('complete-purchase', {
            body: {
                userId,
                sessionId,
                productId
            }
        })

        if (error) throw error
        return data?.success || false
    } catch (error) {
        console.error('Error completing purchase:', error)
        return false
    }
}

// Spend coins (for premium courses, etc)
export const spendCoins = async (
    userId: string,
    amount: number,
    description: string,
    referenceId?: string
): Promise<boolean> => {
    try {
        const { data, error } = await supabase.functions.invoke('spend-coins', {
            body: {
                userId,
                amount,
                description,
                referenceId
            }
        })

        if (error) throw error
        return data?.success || false
    } catch (error) {
        console.error('Error spending coins:', error)
        return false
    }
}