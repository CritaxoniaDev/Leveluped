import { useState } from 'react'
import { Button } from '@/packages/shadcn/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/packages/shadcn/ui/card'
import { Badge } from '@/packages/shadcn/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/packages/shadcn/ui/tabs'
import { toast } from 'sonner'
import { seedStripeProducts } from '@/services/createStripeProducts'
import { seedStripePremiumPlans, fetchPremiumPlans } from '@/services/createStripePremiumPlans'
import { fetchCoinPackages } from '@/services/StripeService'
import { AlertCircle, CheckCircle2, Loader2, Coins, Crown } from 'lucide-react'

export default function StripeProducts() {
    const [loading, setLoading] = useState(false)
    const [coinPackages, setCoinPackages] = useState<any[]>([])
    const [premiumPlans, setPremiumPlans] = useState<any[]>([])
    const [seededCoins, setSeededCoins] = useState(false)
    const [seededPremium, setSeededPremium] = useState(false)

    // Coin Products Handlers
    const handleSeedCoinProducts = async () => {
        try {
            setLoading(true)
            const result = await seedStripeProducts()
            
            if (result.success && result.data) {
                toast.success('Success', {
                    description: 'Stripe coin products seeded successfully'
                })
                setSeededCoins(true)
                
                const fetchedPackages = await fetchCoinPackages()
                setCoinPackages(fetchedPackages)
            } else {
                const errorMessage = result.error instanceof Error 
                    ? result.error.message 
                    : 'Failed to seed Stripe coin products'
                
                toast.error('Error', {
                    description: errorMessage
                })
            }
        } catch (error: any) {
            console.error('Error:', error)
            toast.error('Error', {
                description: error.message || 'An error occurred while seeding coin products'
            })
        } finally {
            setLoading(false)
        }
    }

    const handleFetchCoinProducts = async () => {
        try {
            setLoading(true)
            const fetchedPackages = await fetchCoinPackages()
            setCoinPackages(fetchedPackages)
            
            if (fetchedPackages.length > 0) {
                toast.success('Success', {
                    description: `Loaded ${fetchedPackages.length} coin packages`
                })
            } else {
                toast.info('No packages', {
                    description: 'No coin packages found. Seed them first.'
                })
            }
        } catch (error: any) {
            console.error('Error:', error)
            toast.error('Error', {
                description: error.message || 'Failed to fetch coin packages'
            })
        } finally {
            setLoading(false)
        }
    }

    // Premium Plans Handlers
    const handleSeedPremiumPlans = async () => {
        try {
            setLoading(true)
            const result = await seedStripePremiumPlans()
            
            if (result.success) {
                toast.success('Success', {
                    description: result.message
                })
                setSeededPremium(true)
                
                const fetchedPlans = await fetchPremiumPlans()
                setPremiumPlans(fetchedPlans)
            } else {
                toast.error('Error', {
                    description: result.message
                })
            }
        } catch (error: any) {
            console.error('Error:', error)
            toast.error('Error', {
                description: error.message || 'An error occurred while seeding premium plans'
            })
        } finally {
            setLoading(false)
        }
    }

    const handleFetchPremiumPlans = async () => {
        try {
            setLoading(true)
            const fetchedPlans = await fetchPremiumPlans()
            setPremiumPlans(fetchedPlans)
            
            if (fetchedPlans.length > 0) {
                toast.success('Success', {
                    description: `Loaded ${fetchedPlans.length} premium plans`
                })
            } else {
                toast.info('No plans', {
                    description: 'No premium plans found. Seed them first.'
                })
            }
        } catch (error: any) {
            console.error('Error:', error)
            toast.error('Error', {
                description: error.message || 'Failed to fetch premium plans'
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Stripe Products Management
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Manage coin packages and premium subscription plans
                </p>
            </div>

            <Tabs defaultValue="coins" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="coins" className="flex items-center gap-2">
                        <Coins className="w-4 h-4" />
                        Coin Packages
                    </TabsTrigger>
                    <TabsTrigger value="premium" className="flex items-center gap-2">
                        <Crown className="w-4 h-4" />
                        Premium Plans
                    </TabsTrigger>
                </TabsList>

                {/* Coin Packages Tab */}
                <TabsContent value="coins" className="space-y-6">
                    {/* Setup Card */}
                    <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                <CardTitle>Setup Stripe Coin Products</CardTitle>
                            </div>
                            <CardDescription>
                                Initialize your coin packages from Stripe
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                    Instructions:
                                </h3>
                                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300">
                                    <li>Verify you've created products in Stripe Dashboard</li>
                                    <li>Confirm the Product IDs and Price IDs are in createStripeProducts.ts</li>
                                    <li>Click "Seed Products" to import them into your database</li>
                                    <li>View the products below to confirm</li>
                                </ol>
                            </div>

                            <div className="flex gap-3">
                                <Button 
                                    onClick={handleSeedCoinProducts}
                                    disabled={loading}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Seeding...
                                        </>
                                    ) : (
                                        <>
                                            <Coins className="w-4 h-4 mr-2" />
                                            Seed Coin Products
                                        </>
                                    )}
                                </Button>
                                <Button 
                                    onClick={handleFetchCoinProducts}
                                    disabled={loading}
                                    variant="outline"
                                    className="flex-1"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Loading...
                                        </>
                                    ) : (
                                        'Fetch Products'
                                    )}
                                </Button>
                            </div>

                            {seededCoins && (
                                <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                                    <p className="text-sm text-green-700 dark:text-green-300">
                                        Coin products seeded successfully!
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Coin Products List */}
                    {coinPackages.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Coin Packages</CardTitle>
                                <CardDescription>
                                    {coinPackages.length} packages configured
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {coinPackages.map((pkg) => (
                                        <Card key={pkg.id} className="border-gray-200 dark:border-gray-800">
                                            <CardContent className="p-6">
                                                <div className="space-y-3">
                                                    <div>
                                                        <h3 className="font-semibold text-gray-900 dark:text-white">
                                                            {pkg.name}
                                                        </h3>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                                            {pkg.description}
                                                        </p>
                                                    </div>

                                                    <div className="space-y-2 py-3 border-t border-gray-200 dark:border-gray-800">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-xs text-gray-600 dark:text-gray-400">
                                                                Price:
                                                            </span>
                                                            <span className="font-bold text-gray-900 dark:text-white">
                                                                ${(pkg.amount / 100).toFixed(2)} {pkg.currency.toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-xs text-gray-600 dark:text-gray-400">
                                                                Coins:
                                                            </span>
                                                            <Badge className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                                                                {pkg.coins} coins
                                                            </Badge>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-1 py-3 border-t border-gray-200 dark:border-gray-800">
                                                        <p className="text-xs text-gray-600 dark:text-gray-400 break-all">
                                                            <span className="font-semibold">Product ID:</span><br />
                                                            {pkg.stripe_product_id}
                                                        </p>
                                                        <p className="text-xs text-gray-600 dark:text-gray-400 break-all mt-2">
                                                            <span className="font-semibold">Price ID:</span><br />
                                                            {pkg.stripe_price_id}
                                                        </p>
                                                    </div>

                                                    <div className="pt-3 border-t border-gray-200 dark:border-gray-800">
                                                        {pkg.is_active ? (
                                                            <Badge className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
                                                                Active
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="secondary">Inactive</Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {!loading && coinPackages.length === 0 && !seededCoins && (
                        <Card>
                            <CardContent className="p-12 text-center">
                                <Coins className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                    No Coin Products
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-6">
                                    Click "Seed Coin Products" above to get started
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* Premium Plans Tab */}
                <TabsContent value="premium" className="space-y-6">
                    {/* Setup Card */}
                    <Card className="border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                <CardTitle>Setup Premium Plans</CardTitle>
                            </div>
                            <CardDescription>
                                Initialize your premium subscription plans from Stripe
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                    Instructions:
                                </h3>
                                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300">
                                    <li>Create subscription products in Stripe Dashboard</li>
                                    <li>Update the Stripe Product IDs and Price IDs in src/services/createStripePremiumPlans.ts</li>
                                    <li>Click "Seed Premium Plans" to import them into your database</li>
                                    <li>View the plans below to confirm</li>
                                </ol>
                            </div>

                            <div className="flex gap-3">
                                <Button 
                                    onClick={handleSeedPremiumPlans}
                                    disabled={loading}
                                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Seeding...
                                        </>
                                    ) : (
                                        <>
                                            <Crown className="w-4 h-4 mr-2" />
                                            Seed Premium Plans
                                        </>
                                    )}
                                </Button>
                                <Button 
                                    onClick={handleFetchPremiumPlans}
                                    disabled={loading}
                                    variant="outline"
                                    className="flex-1"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Loading...
                                        </>
                                    ) : (
                                        'Fetch Plans'
                                    )}
                                </Button>
                            </div>

                            {seededPremium && (
                                <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                                    <p className="text-sm text-green-700 dark:text-green-300">
                                        Premium plans seeded successfully!
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Premium Plans List */}
                    {premiumPlans.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Premium Plans</CardTitle>
                                <CardDescription>
                                    {premiumPlans.length} plans configured
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {premiumPlans.map((plan) => (
                                        <Card key={plan.id} className="border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10">
                                            <CardContent className="p-6">
                                                <div className="space-y-3">
                                                    <div>
                                                        <h3 className="font-semibold text-gray-900 dark:text-white">
                                                            {plan.name}
                                                        </h3>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                                            {plan.description}
                                                        </p>
                                                    </div>

                                                    <div className="space-y-2 py-3 border-t border-purple-200 dark:border-purple-800">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-xs text-gray-600 dark:text-gray-400">
                                                                Price:
                                                            </span>
                                                            <span className="font-bold text-gray-900 dark:text-white">
                                                                ${(plan.price / 100).toFixed(2)}/{plan.billing_period.charAt(0)}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-xs text-gray-600 dark:text-gray-400">
                                                                Billing:
                                                            </span>
                                                            <Badge className="bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 capitalize">
                                                                {plan.billing_period}
                                                            </Badge>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-1 py-3 border-t border-purple-200 dark:border-purple-800">
                                                        <p className="text-xs font-semibold text-gray-900 dark:text-white mb-2">
                                                            Features:
                                                        </p>
                                                        <div className="space-y-1">
                                                            {Object.entries(plan.features || {}).map(([key, value]: [string, any]) => (
                                                                <div key={key} className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300">
                                                                    {value ? (
                                                                        <CheckCircle2 className="w-3 h-3 text-green-600" />
                                                                    ) : (
                                                                        <div className="w-3 h-3 border border-gray-400 rounded-full" />
                                                                    )}
                                                                    <span className="capitalize">
                                                                        {key.replace(/_/g, ' ')}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className="space-y-1 py-3 border-t border-purple-200 dark:border-purple-800">
                                                        <p className="text-xs text-gray-600 dark:text-gray-400 break-all">
                                                            <span className="font-semibold">Product ID:</span><br />
                                                            {plan.stripe_product_id}
                                                        </p>
                                                        <p className="text-xs text-gray-600 dark:text-gray-400 break-all mt-2">
                                                            <span className="font-semibold">Price ID:</span><br />
                                                            {plan.stripe_price_id}
                                                        </p>
                                                    </div>

                                                    <div className="pt-3 border-t border-purple-200 dark:border-purple-800">
                                                        {plan.is_active ? (
                                                            <Badge className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
                                                                Active
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="secondary">Inactive</Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {!loading && premiumPlans.length === 0 && !seededPremium && (
                        <Card>
                            <CardContent className="p-12 text-center">
                                <Crown className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                    No Premium Plans
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-6">
                                    Click "Seed Premium Plans" above to get started
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}