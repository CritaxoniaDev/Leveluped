import { supabase } from '@/packages/supabase/supabase'

const stripeProducts = [
    {
        name: '100 Coins',
        description: 'Get 100 coins',
        amount: 999, // $9.99 in cents
        currency: 'usd',
        coins: 100,
        stripe_product_id: 'prod_Tya7JHSBJgxXGk',
        stripe_price_id: 'price_1T0cxdDEfPXUqeRi0mua5WLU'
    },
    {
        name: '500 Coins',
        description: 'Get 500 coins - Best value!',
        amount: 3999,
        currency: 'usd',
        coins: 500,
        stripe_product_id: 'prod_Tya8UnzcHyug8i',
        stripe_price_id: 'price_1T0cyDDEfPXUqeRiBXIRuQpZ'
    },
    {
        name: '1000 Coins',
        description: 'Get 1000 coins - Ultimate bundle',
        amount: 6999,
        currency: 'usd',
        coins: 1000,
        stripe_product_id: 'prod_Tya9eLi2AyA8I4',
        stripe_price_id: 'price_1T0cykDEfPXUqeRiB17bFQpE'
    }
]

export const seedStripeProducts = async () => {
    try {
        const { data, error } = await supabase
            .from('stripe_products')
            .upsert(stripeProducts, { onConflict: 'stripe_product_id' })

        if (error) throw error
        console.log('Stripe products seeded successfully:', data)
        return { success: true, data }
    } catch (error) {
        console.error('Error seeding Stripe products:', error)
        return { success: false, error }
    }
}