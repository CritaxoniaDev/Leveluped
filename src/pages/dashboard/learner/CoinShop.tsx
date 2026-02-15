import { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { supabase } from "@/packages/supabase/supabase"
import {
    fetchCoinPackages,
    getUserWallet,
    createCheckoutSession,
    getOrCreateStripeCustomer,
    completePurchase
} from "@/services/StripeService"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/packages/shadcn/ui/card"
import { Button } from "@/packages/shadcn/ui/button"
import { toast } from "sonner"
import {
    ArrowLeft,
    Coins,
    Check,
    Loader2,
    ShoppingCart,
    TrendingUp,
    AlertCircle
} from "lucide-react"
import {
    Alert,
    AlertDescription,
} from "@/packages/shadcn/ui/alert"

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

interface UserWallet {
    user_id: string
    total_coins: number
    spent_coins: number
    available_coins: number
    updated_at: string
}

export default function CoinShop() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const [packages, setPackages] = useState<CoinPackage[]>([])
    const [, setWallet] = useState<UserWallet | null>(null)
    const [loading, setLoading] = useState(true)
    const [purchasing, setPurchasing] = useState<string | null>(null)
    const [userId, setUserId] = useState<string | null>(null)
    const [paymentStatus, setPaymentStatus] = useState<'success' | 'cancelled' | null>(null)

    // Get user ID and fetch data
    useEffect(() => {
        const initializeCoinShop = async () => {
            try {
                setLoading(true)
                const { data: { session } } = await supabase.auth.getSession()

                if (!session) {
                    toast.error("Error", {
                        description: "You must be logged in to access the coin shop"
                    })
                    navigate("/login")
                    return
                }

                setUserId(session.user.id)

                // Fetch coin packages
                const packagesData = await fetchCoinPackages()
                if (packagesData && packagesData.length > 0) {
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
                    setPackages(mappedPackages)
                }

                // Fetch user wallet
                const walletData = await getUserWallet(session.user.id)
                if (walletData) {
                    setWallet(walletData)
                }

                // Check for payment status
                const success = searchParams.get('success')
                const cancelled = searchParams.get('cancelled')

                if (success === 'true') {
                    setPaymentStatus('success')
                    toast.success("Purchase Successful! 🎉", {
                        description: "Your coins have been added to your wallet"
                    })
                    // Clear URL params
                    window.history.replaceState({}, document.title, window.location.pathname)
                } else if (cancelled === 'true') {
                    setPaymentStatus('cancelled')
                    toast.info("Purchase Cancelled", {
                        description: "Your payment was cancelled. No charges were made."
                    })
                    // Clear URL params
                    window.history.replaceState({}, document.title, window.location.pathname)
                }
            } catch (error) {
                console.error("Error initializing coin shop:", error)
                toast.error("Error", {
                    description: "Failed to load coin shop"
                })
            } finally {
                setLoading(false)
            }
        }

        initializeCoinShop()
    }, [navigate, searchParams])

    useEffect(() => {
        const handleSuccess = async () => {
            // Check if this is a success redirect from Stripe
            if (searchParams.get('success') === 'true') {
                // Get session ID from URL or localStorage
                const sessionId = localStorage.getItem('stripe_session_id')

                if (sessionId && userId) {
                    try {
                        const result = await completePurchase(userId, sessionId)

                        if (result?.success) {
                            toast.success("Purchase Successful!", {
                                description: `You received ${result.coins} coins!`
                            })
                            // Clear session ID
                            localStorage.removeItem('stripe_session_id')
                            // Refresh wallet
                            const wallet = await getUserWallet(userId)
                            if (wallet) {
                                setWallet(wallet)
                            }
                        }
                    } catch (error: any) {
                        console.error('Error completing purchase:', error)
                    }
                }
            }
        }

        handleSuccess()
    }, [searchParams, userId])

    // Set up real-time subscription for wallet updates
    useEffect(() => {
        if (!userId) return

        let channel: any = null
        let isSubscribed = true

        const setupSubscription = async () => {
            channel = supabase.channel(`coin_shop_wallet_${userId}_${Date.now()}`)
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'user_wallets',
                    filter: `user_id=eq.${userId}`
                }, (payload) => {
                    if (isSubscribed) {
                        const newWallet = payload.new as UserWallet
                        setWallet(newWallet)
                    }
                })
                .subscribe()
        }

        setupSubscription()

        return () => {
            isSubscribed = false
            if (channel) {
                supabase.removeChannel(channel)
            }
        }
    }, [userId])

    // @ts-ignore
    const handlePurchase = async (priceId: string, packageId: string) => {
        try {
            if (!userId) {
                toast.error("Error", { description: "User ID not found" })
                return
            }

            setPurchasing(priceId)

            const customerId = await getOrCreateStripeCustomer(userId)
            if (!customerId) throw new Error("Failed to create Stripe customer")

            const baseUrl = window.location.origin
            const sessionData = await createCheckoutSession(
                userId,
                priceId,
                `${baseUrl}/dashboard/learner/coin-shop?success=true`,
                `${baseUrl}/dashboard/learner/coin-shop?cancelled=true`
            )

            if (!sessionData?.sessionId || !sessionData?.checkoutUrl) {
                throw new Error("Failed to create checkout session")
            }

            // Store session ID for later verification
            localStorage.setItem('stripe_session_id', sessionData.sessionId)

            // Redirect to Stripe checkout
            window.location.href = sessionData.checkoutUrl

        } catch (error: any) {
            console.error("Purchase error:", error)
            toast.error("Purchase Failed", {
                description: error.message || "An error occurred"
            })
        } finally {
            setPurchasing(null)
        }
    }

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
                    <p className="text-gray-600 dark:text-gray-400">Loading coin shop...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen py-8 px-4">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="mb-8">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(-1)}
                        className="mb-4"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                            <Coins className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                Coin Shop
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400">
                                Purchase coins to unlock premium courses
                            </p>
                        </div>
                    </div>
                </div>

                {/* Payment Status Messages */}
                {paymentStatus === 'success' && (
                    <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                        <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <AlertDescription className="text-green-800 dark:text-green-300">
                            Payment successful! Your coins have been added to your wallet.
                        </AlertDescription>
                    </Alert>
                )}

                {paymentStatus === 'cancelled' && (
                    <Alert className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
                        <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                        <AlertDescription className="text-yellow-800 dark:text-yellow-300">
                            Payment was cancelled. No charges were made.
                        </AlertDescription>
                    </Alert>
                )}

                {/* Coin Packages */}
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                        Coin Packages
                    </h2>

                    {packages.length === 0 ? (
                        <Card>
                            <CardContent className="p-12 text-center">
                                <AlertCircle className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                    No Packages Available
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Coin packages are not currently available. Please try again later.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {packages.map((pkg, index) => {
                                const coinValue = getCoinValue(pkg.coins, pkg.amount)
                                const isPopular = index === 1 // Middle package is popular
                                const isPurchasing = purchasing === pkg.stripe_price_id

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
                                                onClick={() => handlePurchase(pkg.stripe_price_id, pkg.id)}
                                                disabled={isPurchasing}
                                                className={`w-full ${isPopular
                                                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700'
                                                    : 'bg-blue-600 hover:bg-blue-700'
                                                    } text-white font-semibold`}
                                            >
                                                {isPurchasing ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                        Processing...
                                                    </>
                                                ) : (
                                                    <>
                                                        <ShoppingCart className="w-4 h-4 mr-2" />
                                                        Buy Now
                                                    </>
                                                )}
                                            </Button>
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}