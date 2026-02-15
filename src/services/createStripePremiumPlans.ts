export interface PremiumPlanConfig {
    name: string
    description: string
    price: number
    billingPeriod: 'monthly' | 'yearly'
    stripeProductId: string
    stripePriceId: string
    features: {
        avatar_borders: boolean
        custom_themes: boolean
        ad_free: boolean
        priority_support: boolean
    }
}

const PREMIUM_PLANS: PremiumPlanConfig[] = [
    {
        name: 'Premium Monthly',
        description: 'Unlock premium features for one month',
        price: 999, // $9.99 in cents
        billingPeriod: 'monthly',
        stripeProductId: 'prod_TyxFwQfGgiSe7Q',
        stripePriceId: 'price_1T0zL5DEfPXUqeRiLectdX6Y', 
        features: {
            avatar_borders: true,
            custom_themes: true,
            ad_free: true,
            priority_support: true
        }
    },
    {
        name: 'Premium Yearly',
        description: 'Unlock premium features for one year - Save 20%',
        price: 9999, // $99.99 in cents
        billingPeriod: 'yearly',
        stripeProductId: 'prod_TyxGNAK4hwR4LN', 
        stripePriceId: 'price_1T0zLVDEfPXUqeRiIMoVORZr', 
        features: {
            avatar_borders: true,
            custom_themes: true,
            ad_free: true,
            priority_support: true
        }
    }
]

export const seedStripePremiumPlans = async (): Promise<{ success: boolean; message: string; plans?: any[] }> => {
    try {
        const { supabase } = await import('@/packages/supabase/supabase')

        // Validate that Stripe IDs are configured
        const unconfiguredPlans = PREMIUM_PLANS.filter(
            plan => plan.stripeProductId.includes('your_') || plan.stripePriceId.includes('your_')
        )

        if (unconfiguredPlans.length > 0) {
            return {
                success: false,
                message: `Please update the Stripe Product IDs and Price IDs in createStripePremiumPlans.ts first.\n\nUnconfigured plans: ${unconfiguredPlans.map(p => p.name).join(', ')}`
            }
        }

        // Check if plans already exist
        const { data: existingPlans, error: fetchError } = await supabase
            .from('premium_plans')
            .select('id, stripe_product_id')

        if (fetchError) {
            console.error('Error fetching existing plans:', fetchError)
            throw fetchError
        }

        console.log('Existing plans:', existingPlans)

        // Insert or update plans
        const plansToInsert = PREMIUM_PLANS.map(plan => ({
            name: plan.name,
            description: plan.description,
            price: plan.price,
            currency: 'usd',
            billing_period: plan.billingPeriod,
            stripe_product_id: plan.stripeProductId,
            stripe_price_id: plan.stripePriceId,
            features: plan.features,
            is_active: true
        }))

        const { data: insertedPlans, error: insertError } = await supabase
            .from('premium_plans')
            .upsert(plansToInsert, {
                onConflict: 'stripe_product_id'
            })
            .select()

        if (insertError) {
            console.error('Error inserting premium plans:', insertError)
            throw insertError
        }

        console.log('Inserted premium plans:', insertedPlans)

        return {
            success: true,
            message: `Successfully seeded ${insertedPlans?.length || 0} premium plans`,
            plans: insertedPlans
        }
    } catch (error: any) {
        console.error('Error seeding premium plans:', error)
        return {
            success: false,
            message: `Error: ${error.message}`
        }
    }
}

export const fetchPremiumPlans = async (): Promise<PremiumPlanConfig[]> => {
    try {
        const { supabase } = await import('@/packages/supabase/supabase')

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