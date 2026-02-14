import { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { supabase } from "@/packages/supabase/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

export default function InputOTP() {
    const [token, setToken] = useState("")
    const [loading, setLoading] = useState(false)
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const email = searchParams.get("email")

    useEffect(() => {
        if (!email) {
            toast.error("Error", {
                description: "Email not provided"
            })
            navigate("/login")
        }
    }, [email, navigate])

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        if (!token || token.length !== 8) {
            toast.error("Invalid Token", {
                description: "Please enter a valid 8-digit token"
            })
            setLoading(false)
            return
        }

        try {
            const { data, error } = await supabase.auth.verifyOtp({
                email: email!,
                token,
                type: 'email'
            })

            if (error) {
                toast.error("Verification Failed", {
                    description: error.message
                })
                setLoading(false)
                return
            }

            if (!data.user) {
                toast.error("Error", {
                    description: "User not found after verification"
                })
                setLoading(false)
                return
            }

            // Check if user exists in users table, if not create them
            const { data: existingUser } = await supabase
                .from("users")
                .select("id")
                .eq("id", data.user.id)
                .maybeSingle()

            if (!existingUser) {
                // Create user record from auth metadata
                const metadata = data.user.user_metadata
                const { error: createUserError } = await supabase
                    .from("users")
                    .insert({
                        id: data.user.id,
                        email: data.user.email,
                        name: metadata?.name || '',
                        username: metadata?.username || data.user.email?.split('@')[0] || '',
                        role: metadata?.role || 'learner',
                        is_verified: true
                    })

                if (createUserError) {
                    console.error("Error creating user:", createUserError)
                    toast.error("Error", {
                        description: "Failed to create user profile"
                    })
                    setLoading(false)
                    return
                }
            }

            // Generate session token
            const sessionToken = crypto.randomUUID()
            const expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days

            // Insert session into database
            const { error: sessionError } = await supabase
                .from("user_sessions")
                .insert({
                    user_id: data.user.id,
                    session_token: sessionToken,
                    expires_at: expiresAt.toISOString()
                })

            if (sessionError) {
                console.error("Error creating session:", sessionError)
                toast.error("Error", {
                    description: "Failed to create session"
                })
                setLoading(false)
                return
            }

            // Store session in localStorage
            localStorage.setItem('session_token', sessionToken)
            localStorage.setItem('expires_at', expiresAt.toISOString())

            toast.success("Verified!", {
                description: "You have been successfully signed in"
            })

            // Redirect to dashboard based on role
            const { data: userProfile } = await supabase
                .from("users")
                .select("role")
                .eq("id", data.user.id)
                .single()

            if (userProfile?.role === 'instructor') {
                navigate("/dashboard/instructor")
            } else if (userProfile?.role === 'admin') {
                navigate("/dashboard/admin")
            } else {
                navigate("/dashboard/learner")
            }

        } catch (err: any) {
            toast.error("Error", {
                description: err?.message || "An unexpected error occurred"
            })
        }

        setLoading(false)
    }

    const handleResend = async () => {
        setLoading(true)
        try {
            const { error } = await supabase.auth.signInWithOtp({
                email: email!
            })

            if (error) {
                toast.error("Resend Failed", {
                    description: error.message
                })
            } else {
                toast.success("Token Resent", {
                    description: "Check your email for the new token"
                })
            }
        } catch (err: any) {
            toast.error("Error", {
                description: err?.message || "Failed to resend token"
            })
        }
        setLoading(false)
    }

    return (
        <div className="flex items-center justify-center dark:from-[#18181b] dark:to-[#27272a] px-4">
            <main className="w-full max-w-md">
                <div className="p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            Enter Verification Code
                        </h1>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            We've sent a 8-digit code to {email}
                        </p>
                    </div>

                    <form onSubmit={handleVerify} className="space-y-6">
                        <div>
                            <label htmlFor="token" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Verification Code
                            </label>
                            <Input
                                id="token"
                                type="text"
                                placeholder="12345678"
                                value={token}
                                onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 8))}
                                className="w-full px-4 py-3 text-center text-lg tracking-widest"
                                disabled={loading}
                                required
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
                                Enter the 8-digit code from your email
                            </p>
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={loading || token.length !== 8}
                        >
                            {loading ? "Verifying..." : "Verify Code"}
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            onClick={handleResend}
                            disabled={loading}
                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        >
                            Didn't receive the code? Resend
                        </button>
                    </div>

                    <div className="mt-4 text-center">
                        <button
                            onClick={() => navigate("/login")}
                            className="text-sm text-gray-600 dark:text-gray-400 hover:underline"
                        >
                            Back to Login
                        </button>
                    </div>
                </div>
            </main>
        </div>
    )
}