import { supabase } from '@/packages/supabase/supabase'

export interface StripeProduct {
    id: string
    name: string
    description: string
    amount: number
    currency: string
    coins: number
    stripe_product_id: string
    stripe_price_id: string
    is_active: boolean
    created_at: string
}

export interface PremiumPlan {
    id: string
    name: string
    description: string
    price: number
    currency: string
    billing_period: 'monthly' | 'yearly'
    stripe_price_id: string
    stripe_product_id: string
    features: {
        avatar_borders: boolean
        custom_themes: boolean
        ad_free: boolean
        priority_support: boolean
    }
    is_active: boolean
}

export interface UserPremiumSubscription {
    id: string
    user_id: string
    premium_plan_id: string
    stripe_subscription_id: string
    status: 'active' | 'canceled' | 'past_due' | 'expired'
    current_period_start: string
    current_period_end: string
    canceled_at: string | null
    created_at: string
}

export interface StripeCustomer {
    id: string
    user_id: string
    stripe_customer_id: string
    email: string
    name: string
    created_at: string
    updated_at: string
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

export const getOrCreateStripeCustomer = async (userId: string): Promise<string | null> => {
    try {
        const { data: existingCustomer } = await supabase
            .from('stripe_customers')
            .select('stripe_customer_id')
            .eq('user_id', userId)
            .maybeSingle()

        if (existingCustomer?.stripe_customer_id) {
            console.log('Returning existing customer:', existingCustomer.stripe_customer_id)
            return existingCustomer.stripe_customer_id
        }

        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('email, name, username')
            .eq('id', userId)
            .maybeSingle()

        if (userError || !userData) {
            console.error('User not found:', userError)
            throw new Error('User not found')
        }

        console.log('Creating new Stripe customer for user:', userId)

        const { data, error } = await supabase.functions.invoke('create-stripe-customer', {
            body: {
                userId,
                email: userData.email,
                name: userData.name || userData.username || 'Customer'
            }
        })

        if (error) {
            console.error('Edge Function error response:', {
                message: error.message,
                status: error.status,
                context: error.context
            })
            throw error
        }

        console.log('Edge Function response:', data)

        if (!data?.success || !data?.customerId) {
            console.error('Invalid response from Edge Function:', data)
            throw new Error('Invalid response: ' + JSON.stringify(data))
        }

        console.log('Storing customer in database:', data.customerId)

        const { error: insertError } = await supabase
            .from('stripe_customers')
            .insert({
                user_id: userId,
                stripe_customer_id: data.customerId,
                email: userData.email,
                name: userData.name || userData.username || 'Customer'
            })
            .select()

        if (insertError) {
            console.error('Database insert error:', insertError)
            throw insertError
        }

        console.log('Customer created and stored successfully:', data.customerId)
        return data.customerId
    } catch (error: any) {
        console.error('Error getting/creating Stripe customer:', {
            message: error.message,
            error: error
        })
        return null
    }
}

export const getStripeCustomer = async (userId: string): Promise<StripeCustomer | null> => {
    try {
        const { data, error } = await supabase
            .from('stripe_customers')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle()

        if (error) throw error
        return data || null
    } catch (error) {
        console.error('Error fetching Stripe customer:', error)
        return null
    }
}

export const updateStripeCustomer = async (
    customerId: string,
    updates: { email?: string; name?: string }
): Promise<boolean> => {
    try {
        const { error } = await supabase.functions.invoke('update-stripe-customer', {
            body: {
                customerId,
                ...updates
            }
        })

        if (error) throw error

        const { error: dbError } = await supabase
            .from('stripe_customers')
            .update({
                email: updates.email,
                name: updates.name,
                updated_at: new Date().toISOString()
            })
            .eq('stripe_customer_id', customerId)

        if (dbError) throw dbError
        return true
    } catch (error) {
        console.error('Error updating Stripe customer:', error)
        return false
    }
}

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

export const fetchPremiumPlans = async (): Promise<PremiumPlan[]> => {
    try {
        const { data, error } = await supabase
            .from('premium_plans')
            .select('*')
            .eq('is_active', true)
            .order('price', { ascending: true })

        if (error) throw error
        return data || []
    } catch (error) {
        console.error('Error fetching premium plans:', error)
        return []
    }
}

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

export const getUserPremiumSubscription = async (userId: string): Promise<UserPremiumSubscription | null> => {
    try {
        const { data, error } = await supabase
            .from('user_premium_subscriptions')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'active')
            .gt('current_period_end', new Date().toISOString())
            .maybeSingle()

        if (error) throw error
        return data || null
    } catch (error) {
        console.error('Error fetching premium subscription:', error)
        return null
    }
}

export const checkUserPremium = async (userId: string): Promise<boolean> => {
    try {
        const subscription = await getUserPremiumSubscription(userId)
        return !!subscription
    } catch (error) {
        console.error('Error checking premium status:', error)
        return false
    }
}

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

export const createCheckoutSession = async (
    userId: string,
    priceId: string,
    successUrl: string,
    cancelUrl: string
): Promise<{ sessionId: string; checkoutUrl: string } | null> => {
    try {
        const customerId = await getOrCreateStripeCustomer(userId)
        if (!customerId) throw new Error('Failed to create/get Stripe customer')

        const { data, error } = await supabase.functions.invoke('create-checkout-session', {
            body: {
                userId,
                customerId,
                priceId,
                successUrl,
                cancelUrl
            }
        })

        if (error) {
            console.error('create-checkout-session error:', error)
            throw error
        }

        console.log('Checkout session response:', data)

        if (data?.success && data?.sessionId && data?.checkoutUrl) {
            return { sessionId: data.sessionId, checkoutUrl: data.checkoutUrl }
        } else {
            throw new Error('Invalid response: ' + JSON.stringify(data))
        }
    } catch (error: any) {
        console.error('Error creating checkout session:', error.message)
        return null
    }
}

export const createPremiumCheckoutSession = async (
    userId: string,
    planId: string,
    successUrl: string,
    cancelUrl: string
): Promise<{ sessionId: string; checkoutUrl: string } | null> => {
    try {
        console.log('Creating premium checkout session for user:', userId, 'Plan:', planId)

        const { data, error } = await supabase.functions.invoke('create-premium-subscription', {
            body: {
                userId,
                planId,
                successUrl,
                cancelUrl,
            },
        })

        if (error) {
            console.error('create-premium-subscription error:', error)
            console.error('Error details:', error.context)
            throw error
        }

        if (!data?.success) {
            throw new Error(data?.error || 'Failed to create checkout session')
        }

        console.log('Checkout session created successfully:', data.sessionId)

        return {
            sessionId: data.sessionId,
            checkoutUrl: data.checkoutUrl,
        }
    } catch (error: any) {
        console.error('Error creating premium checkout session:', error.message)
        throw error
    }
}

export const completePurchase = async (
    userId: string,
    sessionId: string
): Promise<{ success: boolean; coins?: number } | null> => {
    try {
        const { data, error } = await supabase.functions.invoke('complete-purchase', {
            body: {
                userId,
                sessionId
            }
        })

        if (error) {
            console.error('complete-purchase error:', error)
            throw error
        }

        if (data?.success) {
            return { success: true, coins: data.coins }
        }
        throw new Error('Purchase failed')
    } catch (error: any) {
        console.error('Error completing purchase:', error.message)
        return null
    }
}

export const completePremiumSubscription = async (
    userId: string,
    sessionId: string
): Promise<{ success: boolean; subscription?: UserPremiumSubscription } | null> => {
    try {
        const { data, error } = await supabase.functions.invoke('complete-premium-subscription', {
            body: {
                userId,
                sessionId
            }
        })

        if (error) {
            console.error('complete-premium-subscription error:', error)
            throw error
        }

        if (data?.success) {
            return { success: true, subscription: data.subscription }
        }
        throw new Error('Failed to complete subscription')
    } catch (error: any) {
        console.error('Error completing premium subscription:', error.message)
        return null
    }
}

export const cancelPremiumSubscription = async (userId: string): Promise<boolean> => {
    try {
        const { data, error } = await supabase.functions.invoke('cancel-premium-subscription', {
            body: {
                userId
            }
        })

        if (error) {
            console.error('cancel-premium-subscription error:', error)
            throw error
        }

        if (data?.success) {
            return true
        }
        throw new Error('Failed to cancel subscription')
    } catch (error: any) {
        console.error('Error canceling premium subscription:', error.message)
        return false
    }
}

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

        if (error) {
            console.error('spend-coins error:', error)
            throw error
        }

        if (data?.success) {
            return true
        }
        throw new Error('Failed to spend coins')
    } catch (error: any) {
        console.error('Error spending coins:', error.message)
        return false
    }
}