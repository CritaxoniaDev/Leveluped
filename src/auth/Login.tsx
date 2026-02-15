import { useState } from "react"
import { supabase } from "@/packages/supabase/supabase"
import { Button } from "@/packages/shadcn/ui/button"
import { Input } from "@/packages/shadcn/ui/input"
import { Separator } from "@/packages/shadcn/ui/separator"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

export default function Login() {
    const [email, setEmail] = useState("")
    const [loading, setLoading] = useState(false)
    const [emailError, setEmailError] = useState("")
    const navigate = useNavigate()

    // Strict email validation
    const validateEmail = (emailValue: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        const isValid = emailRegex.test(emailValue)

        if (!isValid && emailValue.length > 0) {
            setEmailError("Please enter a valid email address")
            return false
        }

        if (emailValue.length === 0) {
            setEmailError("")
            return false
        }

        setEmailError("")
        return true
    }

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setEmail(value)
        validateEmail(value)
    }

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        console.log("Starting login process...")

        // Validate email strictly
        if (!validateEmail(email)) {
            console.warn("Email validation failed:", email)
            toast.error("Invalid Email", {
                description: "Please enter a valid email address"
            })
            setLoading(false)
            return
        }

        console.log("Email validation passed:", email)

        try {
            console.log("Checking if email exists in users table...")

            // Check if email exists in users table
            const { data: userExists, error: checkError, count } = await supabase
                .from("users")
                .select("id", { count: 'exact', head: true })
                .eq("email", email)

            console.log("Email check result:", { userExists, checkError, count })

            if (checkError) {
                console.error("Error checking email:", checkError)
                toast.error("Database Error", {
                    description: "An error occurred while checking your email. Please try again."
                })
                setLoading(false)
                return
            }

            if (count === 0 || !count) {
                console.warn("Email not found in database:", email)
                toast.error("Email Not Found", {
                    description: "This email is not registered. Please sign up first."
                })
                setLoading(false)
                return
            }

            console.log("Email found in database")
            console.log("Attempting to send OTP to:", email)

            // Send OTP for passwordless authentication
            const { error: otpError } = await supabase.auth.signInWithOtp({
                email
            })

            console.log("OTP response:", { error: otpError })

            if (otpError) {
                console.error("OTP error:", otpError)
                console.error("Error code:", otpError.code)
                console.error("Error message:", otpError.message)

                // Handle rate limiting error gracefully
                if (otpError.message.includes("18 seconds")) {
                    toast.error("Please Wait", {
                        description: "Too many sign-in attempts. Please try again in a moment."
                    })
                } else {
                    toast.error("Login Failed", {
                        description: otpError.message
                    })
                }
                setLoading(false)
                return
            }

            console.log("OTP sent successfully to:", email)

            // Successfully sent OTP
            toast.success("Verification Code Sent!", {
                description: `Check your email at ${email} for the 8-digit verification code`
            })

            console.log("Clearing form data...")
            setEmail("")
            setEmailError("")

            console.log("Redirecting to OTP input...")
            // Redirect to OTP input page
            navigate(`/auth/input-otp?email=${encodeURIComponent(email)}`)

        } catch (err: any) {
            console.error("Unexpected login error:", err)
            console.error("Error name:", err?.name)
            console.error("Error message:", err?.message)
            console.error("Error stack:", err?.stack)
            console.error("Full error object:", JSON.stringify(err, null, 2))

            toast.error("Error", {
                description: err?.message || "An unexpected error occurred. Please try again"
            })
        }

        setLoading(false)
        console.log("Login process finished, loading state set to false")
    }

    return (
        <div className="flex items-center justify-center dark:from-[#18181b] dark:to-[#27272a] px-4">
            <main className="w-full max-w-7xl">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    {/* Left Side - Login Form */}
                    <div className="flex flex-col">
                        {/* Logo Section */}
                        <div className="mb-8">
                            <h1 className="text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-2">
                                Welcome Back!
                            </h1>

                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Sign in to your LevelUpED account
                            </p>
                        </div>

                        {/* Form Container */}
                        <div className="space-y-8">
                            {/* Description */}
                            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900/50">
                                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                    Enter your email to access your <span className="font-semibold text-blue-600 dark:text-blue-400">LevelUpED dashboard</span>. You'll be routed to your role-specific dashboard.
                                </p>
                            </div>

                            {/* Login Form */}
                            <form onSubmit={handleLogin} className="space-y-6">
                                <div>
                                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        Email Address
                                    </label>
                                    <Input
                                        id="email"
                                        type="email"
                                        autoComplete="email"
                                        placeholder="student@example.com"
                                        value={email}
                                        onChange={handleEmailChange}
                                        className={`w-full px-4 py-5 rounded-lg border-2 transition-all ${emailError
                                            ? "border-red-500 dark:border-red-400 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-900"
                                            : "border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900"
                                            }`}
                                        disabled={loading}
                                        required
                                    />
                                    {emailError ? (
                                        <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                                            {emailError}
                                        </p>
                                    ) : (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            Enter your registered email to continue
                                        </p>
                                    )}
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full text-base font-semibold py-5 rounded-lg transition-all duration-200 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 dark:from-blue-500 dark:to-blue-600"
                                    disabled={loading || !email || !!emailError}
                                >
                                    {loading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                            Signing In...
                                        </span>
                                    ) : (
                                        "Sign In"
                                    )}
                                </Button>
                            </form>

                            <Separator />

                            {/* Footer Links */}
                            <div className="space-y-4">
                                <div className="text-center text-xs text-gray-500 dark:text-gray-400">
                                    By signing in, you agree to our{" "}
                                    <a 
                                        href="/terms-of-service" 
                                        rel="noopener noreferrer"
                                        className="underline hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                    >
                                        Terms of Service
                                    </a>
                                    {" "}and{" "}
                                    <a 
                                        href="/privacy-policy" 
                                        rel="noopener noreferrer"
                                        className="underline hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                    >
                                        Privacy Policy
                                    </a>
                                </div>
                                <p className="text-center text-xs text-gray-400 dark:text-gray-500">
                                    Don't have an account?{" "}
                                    <a href="/signup" className="font-semibold text-blue-600 dark:text-blue-400 hover:underline transition-colors">
                                        Sign Up
                                    </a>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Image Section */}
                    <div className="hidden lg:flex items-center justify-center">
                        <div className="relative w-full max-w-md">
                            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 via-blue-500 to-red-500 rounded-2xl blur-3xl opacity-20 animate-pulse"></div>
                            <div className="relative bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 dark:border-white/10">
                                <div className="aspect-square flex items-center justify-center">
                                    <img
                                        src="/images/leveluped-mainlogo.png"
                                        alt="LevelUpED Illustration"
                                        className="w-64 h-64 drop-shadow-2xl"
                                    />
                                </div>

                                {/* Feature Cards */}
                                <div className="mt-8 space-y-4">
                                    <div className="flex items-start gap-3 p-3 bg-white/10 dark:bg-white/5 rounded-lg backdrop-blur-sm">
                                        <div className="w-2 h-2 bg-yellow-500 rounded-full mt-1.5 flex-shrink-0"></div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white">Earn XP Points</p>
                                            <p className="text-xs text-gray-600 dark:text-gray-400">Complete challenges and grow</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 p-3 bg-white/10 dark:bg-white/5 rounded-lg backdrop-blur-sm">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white">Unlock Badges</p>
                                            <p className="text-xs text-gray-600 dark:text-gray-400">Achieve milestones and skills</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 p-3 bg-white/10 dark:bg-white/5 rounded-lg backdrop-blur-sm">
                                        <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white">Climb Leaderboards</p>
                                            <p className="text-xs text-gray-600 dark:text-gray-400">Compete with other students</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}