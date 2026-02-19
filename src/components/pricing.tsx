import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
    fetchCoinPackages,
    fetchPremiumPlans,
} from "@/services/StripeService"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/packages/shadcn/ui/card"
import { Button } from "@/packages/shadcn/ui/button"
import { Badge } from "@/packages/shadcn/ui/badge"
import { toast } from "sonner"
import {
    Coins,
    Check,
    Loader2,
    Crown,
    TrendingUp,
    AlertCircle
} from "lucide-react"
import NavMenu from "@/components/partials/nav-menu"

interface CoinPackage {
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

interface PremiumPlan {
    id: string
    name: string
    description: string
    price: number
    billing_period: 'monthly' | 'yearly'
    features: Record<string, boolean>
    stripe_product_id: string
    stripe_price_id: string
    is_active: boolean
    created_at: string
}

export default function Pricing() {
    const navigate = useNavigate()
    const [coinPackages, setCoinPackages] = useState<CoinPackage[]>([])
    const [premiumPlans, setPremiumPlans] = useState<PremiumPlan[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)

                const [packagesData, plansData] = await Promise.all([
                    fetchCoinPackages(),
                    fetchPremiumPlans()
                ])

                if (packagesData) {
                    const mappedPackages: CoinPackage[] = packagesData.map(pkg => ({
                        id: pkg.id,
                        name: pkg.name,
                        description: pkg.description || '',
                        amount: pkg.amount,
                        currency: pkg.currency,
                        coins: pkg.coins,
                        stripe_product_id: pkg.stripe_product_id,
                        stripe_price_id: pkg.stripe_price_id,
                        is_active: pkg.is_active,
                        created_at: pkg.created_at
                    }))
                    setCoinPackages(mappedPackages)
                }

                if (plansData) {
                    const mappedPlans: PremiumPlan[] = plansData.map(plan => ({
                        id: plan.id,
                        name: plan.name,
                        description: plan.description,
                        price: plan.price,
                        billing_period: plan.billing_period,
                        features: plan.features,
                        stripe_product_id: plan.stripe_product_id,
                        stripe_price_id: plan.stripe_price_id,
                        is_active: plan.is_active,
                        created_at: new Date().toISOString()
                    }))
                    setPremiumPlans(mappedPlans)
                }
            } catch (error) {
                console.error("Error fetching pricing data:", error)
                toast.error("Error", {
                    description: "Failed to load pricing information"
                })
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    const formatPrice = (amount: number, currency: string) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency.toUpperCase(),
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount / 100)
    }

    const getCoinValue = (coins: number, amount: number) => {
        return (coins / amount * 100).toFixed(2)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                    <p className="text-gray-600 dark:text-gray-400">Loading pricing...</p>
                </div>
            </div>
        )
    }

    return (
        <>
            <NavMenu />
            <div className="min-h-screen py-12 px-4">
                <div className="max-w-7xl mx-auto space-y-12">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                            Simple, Transparent Pricing
                        </h1>
                        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                            Choose the plan that works best for you. Upgrade or downgrade anytime.
                        </p>
                    </div>

                    {/* Coin Packages Section */}
                    <div>
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                                <Coins className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                            </div>
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                                Coin Packages
                            </h2>
                        </div>

                        {coinPackages.length === 0 ? (
                            <Card>
                                <CardContent className="p-12 text-center">
                                    <AlertCircle className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                        No Packages Available
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400">
                                        Coin packages are not currently available.
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                                {coinPackages.map((pkg, index) => {
                                    const coinValue = getCoinValue(pkg.coins, pkg.amount)
                                    const isPopular = index === 1

                                    return (
                                        <Card
                                            key={pkg.id}
                                            className={`relative overflow-hidden transition-all hover:shadow-lg ${isPopular
                                                ? 'ring-2 ring-amber-400 dark:ring-amber-500 lg:scale-105'
                                                : ''
                                                }`}
                                        >
                                            {isPopular && (
                                                <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-400 to-amber-500 text-white px-3 py-1 text-xs font-bold rounded-bl-lg">
                                                    POPULAR
                                                </div>
                                            )}

                                            <CardHeader className={isPopular ? 'pt-8' : ''}>
                                                <div className="flex items-center justify-between mb-2">
                                                    <CardTitle className="flex items-center gap-2">
                                                        <Coins className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                                        {pkg.name}
                                                    </CardTitle>
                                                </div>
                                                <CardDescription>
                                                    {pkg.description}
                                                </CardDescription>
                                            </CardHeader>

                                            <CardContent className="space-y-6">
                                                {/* Coin Amount */}
                                                <div className="text-center">
                                                    <div className="text-4xl font-bold text-transparent bg-gradient-to-r from-amber-600 to-amber-500 bg-clip-text mb-2">
                                                        {pkg.coins.toLocaleString()}
                                                    </div>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                                        Coins
                                                    </p>
                                                </div>

                                                {/* Price */}
                                                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                    <div className="text-center">
                                                        <p className="text-3xl font-bold text-gray-900 dark:text-white">
                                                            {formatPrice(pkg.amount, pkg.currency)}
                                                        </p>
                                                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                                            {coinValue} coins per $1
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Value percentage */}
                                                {isPopular && (
                                                    <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                                                        <TrendingUp className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                                                        <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                                                            Best Value!
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Features */}
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                                        <Check className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                                                        <span>Never expires</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                                        <Check className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                                                        <span>Instant delivery</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                                        <Check className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                                                        <span>Secure checkout</span>
                                                    </div>
                                                </div>

                                                {/* Purchase Button */}
                                                <Button
                                                    onClick={() => navigate("/signup")}
                                                    className={`w-full ${isPopular
                                                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700'
                                                        : 'bg-blue-600 hover:bg-blue-700'
                                                        } text-white font-semibold`}
                                                >
                                                    Get Started
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    {/* Premium Plans Section */}
                    <div>
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                <Crown className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                                Premium Membership
                            </h2>
                        </div>

                        {premiumPlans.length === 0 ? (
                            <Card>
                                <CardContent className="p-12 text-center">
                                    <AlertCircle className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                        No Plans Available
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400">
                                        Premium plans are not currently available.
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {premiumPlans.map((plan) => (
                                    <Card
                                        key={plan.id}
                                        className="relative overflow-hidden border-2 border-gray-200 dark:border-gray-800 hover:border-purple-300 dark:hover:border-purple-700 transition-colors"
                                    >
                                        {plan.billing_period === 'yearly' && (
                                            <div className="absolute top-4 right-4">
                                                <Badge className="bg-green-500 hover:bg-green-600">
                                                    Save 20%
                                                </Badge>
                                            </div>
                                        )}

                                        <CardHeader>
                                            <CardTitle className="text-2xl flex items-center gap-2">
                                                <Crown className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                                {plan.name}
                                            </CardTitle>
                                            <CardDescription>{plan.description}</CardDescription>
                                        </CardHeader>

                                        <CardContent className="space-y-6">
                                            {/* Price */}
                                            <div>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                                                        ${(plan.price / 100).toFixed(2)}
                                                    </span>
                                                    <span className="text-gray-600 dark:text-gray-400">
                                                        /{plan.billing_period === 'monthly' ? 'month' : 'year'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Features */}
                                            <div className="space-y-3">
                                                <h4 className="font-semibold text-gray-900 dark:text-white">
                                                    Included Features:
                                                </h4>
                                                <div className="space-y-2">
                                                    {Object.entries(plan.features).map(([key, enabled]) => (
                                                        <div
                                                            key={key}
                                                            className="flex items-center gap-2"
                                                        >
                                                            {enabled ? (
                                                                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                                                            ) : (
                                                                <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 rounded flex-shrink-0" />
                                                            )}
                                                            <span className={`text-sm ${enabled ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-600'}`}>
                                                                {key.replace(/_/g, ' ').charAt(0).toUpperCase() + key.replace(/_/g, ' ').slice(1)}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Subscribe Button */}
                                            <Button
                                                onClick={() => navigate("/signup")}
                                                className="w-full h-10 font-semibold bg-purple-600 hover:bg-purple-700 text-white"
                                            >
                                                Get Started
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Call to Action */}
                    <div className="text-center py-12">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            Ready to level up your learning?
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Create an account to start purchasing coins or upgrading to premium
                        </p>
                        <Button
                            onClick={() => navigate("/signup")}
                            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-8 py-3 rounded-lg"
                        >
                            Create Account
                        </Button>
                    </div>
                </div>
            </div>
        </>
    )
}