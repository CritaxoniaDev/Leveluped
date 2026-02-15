import { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { supabase } from "@/packages/supabase/supabase"
import { Button } from "@/packages/shadcn/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/packages/shadcn/ui/card"
import { Badge } from "@/packages/shadcn/ui/badge"
import { toast } from "sonner"
import { Crown, Check, Loader2, X } from "lucide-react"
import { 
    fetchPremiumPlans, 
    getUserPremiumSubscription, 
    createPremiumCheckoutSession,
    completePremiumSubscription,
    cancelPremiumSubscription
} from "@/services/StripeService"
import type { PremiumPlan, UserPremiumSubscription } from "@/services/StripeService"

export default function Premium() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const [userId, setUserId] = useState<string | null>(null)
    const [plans, setPlans] = useState<PremiumPlan[]>([])
    const [currentSubscription, setCurrentSubscription] = useState<UserPremiumSubscription | null>(null)
    const [loading, setLoading] = useState(true)
    const [subscribing, setSubscribing] = useState<string | null>(null)
    const [canceling, setCanceling] = useState(false)

    useEffect(() => {
        const handleSuccessRedirect = async () => {
            const success = searchParams.get('success')
            const sessionId = searchParams.get('session_id')
            const currentUserId = userId

            if (success === 'true' && sessionId && currentUserId) {
                try {
                    console.log('Processing successful premium subscription...')
                    
                    const result = await completePremiumSubscription(currentUserId, sessionId)

                    if (result?.success) {
                        toast.success('Premium Activated!', {
                            description: 'Welcome to premium membership. Enjoy exclusive features!'
                        })

                        // Refresh subscription data
                        const updatedSubscription = await getUserPremiumSubscription(currentUserId)
                        setCurrentSubscription(updatedSubscription)

                        // Clear the URL params
                        window.history.replaceState({}, document.title, window.location.pathname)

                        // Clear stored session ID
                        localStorage.removeItem('stripe_premium_session_id')
                    } else {
                        throw new Error('Failed to activate premium subscription')
                    }
                } catch (error: any) {
                    console.error('Error processing premium subscription:', error)
                    toast.error('Premium Activation Failed', {
                        description: error.message || 'Please contact support if the issue persists'
                    })
                }
            }
        }

        handleSuccessRedirect()
    }, [searchParams, userId])

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()
                
                if (!session) {
                    navigate("/login")
                    return
                }

                setUserId(session.user.id)

                const [premiumPlans, subscription] = await Promise.all([
                    fetchPremiumPlans(),
                    getUserPremiumSubscription(session.user.id)
                ])

                setPlans(premiumPlans)
                setCurrentSubscription(subscription)
            } catch (error) {
                console.error("Error fetching premium data:", error)
                toast.error("Error", {
                    description: "Failed to load premium plans"
                })
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [navigate])

    const handleSubscribe = async (planId: string) => {
        if (!userId) {
            toast.error("Error", {
                description: "User not found. Please log in."
            })
            return
        }

        try {
            setSubscribing(planId)

            const baseUrl = window.location.origin
            const sessionData = await createPremiumCheckoutSession(
                userId,
                planId,
                `${baseUrl}/dashboard/learner/premium?success=true`,
                `${baseUrl}/dashboard/learner/premium?cancelled=true`
            )

            if (!sessionData?.checkoutUrl) {
                throw new Error("Failed to create checkout session")
            }

            localStorage.setItem('stripe_premium_session_id', sessionData.sessionId)
            window.location.href = sessionData.checkoutUrl
        } catch (error: any) {
            console.error("Subscription error:", error)
            toast.error("Subscription Failed", {
                description: error.message || "An error occurred while processing your subscription"
            })
        } finally {
            setSubscribing(null)
        }
    }

    const handleCancelSubscription = async () => {
        if (!userId) return

        try {
            setCanceling(true)

            const success = await cancelPremiumSubscription(userId)

            if (success) {
                toast.success("Subscription Cancelled", {
                    description: "Your premium subscription will end at the end of your current billing period"
                })
                setCurrentSubscription(null)
            } else {
                throw new Error("Failed to cancel subscription")
            }
        } catch (error: any) {
            console.error("Cancel error:", error)
            toast.error("Error", {
                description: error.message || "Failed to cancel subscription"
            })
        } finally {
            setCanceling(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
                    <p className="text-gray-600 dark:text-gray-400">Loading premium plans...</p>
                </div>
            </div>
        )
    }

    const canSubscribe = !currentSubscription

    return (
        <div className="pt-10 p-4 sm:p-6 lg:p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <Crown className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                            Premium Membership
                        </h1>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        Unlock exclusive features and enhance your learning experience with our premium subscription plans
                    </p>
                </div>

                {/* Current Subscription Status */}
                {currentSubscription && (
                    <div className="mb-8 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <Crown className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                                <div>
                                    <h3 className="font-semibold text-purple-900 dark:text-purple-100">
                                        You have an active premium subscription
                                    </h3>
                                    <p className="text-sm text-purple-700 dark:text-purple-300">
                                        Valid until {new Date(currentSubscription.current_period_end).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <Button
                                onClick={handleCancelSubscription}
                                disabled={canceling}
                                variant="destructive"
                                size="sm"
                                className="flex-shrink-0"
                            >
                                {canceling ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                        Canceling...
                                    </>
                                ) : (
                                    <>
                                        <X className="w-4 h-4 mr-1" />
                                        Cancel
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                )}

                {/* Plans Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {plans.map((plan) => (
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
                                <CardTitle className="text-2xl">{plan.name}</CardTitle>
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
                                    onClick={() => handleSubscribe(plan.id)}
                                    disabled={subscribing !== null || !canSubscribe}
                                    className={`w-full h-10 font-semibold ${
                                        canSubscribe
                                            ? 'bg-purple-600 hover:bg-purple-700 text-white'
                                            : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                    }`}
                                >
                                    {subscribing === plan.id ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Processing...
                                        </>
                                    ) : canSubscribe ? (
                                        'Subscribe Now'
                                    ) : (
                                        'Already Subscribed'
                                    )}
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    )
}