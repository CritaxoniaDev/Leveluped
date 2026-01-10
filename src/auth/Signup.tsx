import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"

export default function Signup() {
    const [email, setEmail] = useState("")
    const [name, setName] = useState("")
    const [username, setUsername] = useState("")
    const [loading, setLoading] = useState(false)
    const [emailError, setEmailError] = useState("")

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

    // Username validation
    const validateUsername = (usernameValue: string): boolean => {
        const usernameRegex = /^[a-z0-9_-]{3,20}$/
        return usernameRegex.test(usernameValue)
    }

    const handleMagicLink = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        console.log("Starting signup process...")

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

        // Validate name
        if (!name.trim() || name.trim().length < 2) {
            console.warn("Name validation failed:", name)
            toast.error("Invalid Name", {
                description: "Please enter your full name (at least 2 characters)"
            })
            setLoading(false)
            return
        }

        console.log("Name validation passed:", name.trim())

        // Validate username
        if (!validateUsername(username)) {
            console.warn("Username validation failed:", username)
            toast.error("Invalid Username", {
                description: "Username must be 3-20 characters, lowercase, and can only contain letters, numbers, hyphens, and underscores"
            })
            setLoading(false)
            return
        }

        console.log("Username validation passed:", username.toLowerCase())

        try {
            console.log("Skipping duplicate checks, relying on database constraints...")

            // Sign up with magic link
            console.log("Attempting to sign up with OTP...")
            console.log("Email:", email)
            console.log("Username:", username.toLowerCase())
            console.log("Name:", name.trim())
            
            const { data, error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                    data: {
                        name: name.trim(),
                        username: username.toLowerCase(),
                        role: 'learner',
                        is_verified: true
                    }
                }
            })

            console.log("OTP response:", { data, error })

            if (error) {
                console.error("Sign up error:", error)
                console.error("Error code:", error.code)
                console.error("Error message:", error.message)
                console.error("Error status:", error.status)
                
                // Handle specific errors
                if (error.message.includes("User already exists")) {
                    toast.error("Email Already Registered", {
                        description: "This email is already associated with an account"
                    })
                } else if (error.message.includes("duplicate key")) {
                    toast.error("Account Already Exists", {
                        description: "This email or username is already taken"
                    })
                } else {
                    toast.error("Sign Up Failed", {
                        description: error.message
                    })
                }
                setLoading(false)
                return
            }

            console.log("OTP sent successfully to:", email)

            // Success message
            toast.success("Magic Link Sent!", {
                description: `Check your email at ${email} for the confirmation link to complete your registration`
            })

            console.log("Clearing form data...")
            // Clear form
            setEmail("")
            setName("")
            setUsername("")
            setEmailError("")

            console.log("Signup process completed successfully")

        } catch (err: any) {
            console.error("Unexpected signup error:", err)
            console.error("Error name:", err?.name)
            console.error("Error message:", err?.message)
            console.error("Error stack:", err?.stack)
            console.error("Full error object:", JSON.stringify(err, null, 2))

            toast.error("Error", {
                description: err?.message || "An unexpected error occurred. Please try again"
            })
        }

        setLoading(false)
        console.log("Signup process finished, loading state set to false")
    }

    return (
        <div className="flex items-center justify-center dark:from-[#18181b] dark:to-[#27272a] px-4">
            <main className="w-full max-w-7xl">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    {/* Left Side - Login Form */}
                    <div className="flex flex-col">
                        {/* Logo Section */}
                        <div className="mb-4">
                            <h1 className="text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-2">
                                <span className="font-normal">Register to</span> LevelUpED
                            </h1>

                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Gamified Learning Management System
                            </p>
                        </div>

                        {/* Form Container */}
                        <div className="space-y-8">
                            {/* Login Form */}
                            <form onSubmit={handleMagicLink} className="space-y-6">
                                {/* Name and Username in one row */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                            Full Name
                                        </label>
                                        <Input
                                            id="name"
                                            type="text"
                                            placeholder="John Doe"
                                            value={name}
                                            onChange={e => setName(e.target.value)}
                                            className="w-full px-4 py-5 rounded-lg border-2 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 transition-all"
                                            disabled={loading}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="username" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                            Username
                                        </label>
                                        <Input
                                            id="username"
                                            type="text"
                                            placeholder="johndoe"
                                            value={username}
                                            onChange={e => setUsername(e.target.value.toLowerCase())}
                                            className="w-full px-4 py-5 rounded-lg border-2 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 transition-all"
                                            disabled={loading}
                                            required
                                        />
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            3-20 characters, lowercase only
                                        </p>
                                    </div>
                                </div>

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
                                            We'll send you a magic link to sign in securely
                                        </p>
                                    )}
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full text-base font-semibold py-5 rounded-lg transition-all duration-200 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 dark:from-blue-500 dark:to-blue-600"
                                    disabled={loading || !email || !name || !username || !!emailError}
                                >
                                    {loading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                            Sending Magic Link...
                                        </span>
                                    ) : (
                                        "Sign In with Magic Link"
                                    )}
                                </Button>
                            </form>

                            <Separator />

                            {/* Footer Links */}
                            <div className="space-y-4">
                                <div className="text-center text-xs text-gray-500 dark:text-gray-400">
                                    By signing in, you agree to our{" "}
                                    <a href="#" className="underline hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                        Terms of Service
                                    </a>
                                    {" "}and{" "}
                                    <a href="#" className="underline hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                        Privacy Policy
                                    </a>
                                </div>
                                <p className="text-center text-xs text-gray-400 dark:text-gray-500">
                                    Already have an account?{" "}
                                    <a href="/login" className="font-semibold text-blue-600 dark:text-blue-400 hover:underline transition-colors">
                                        Log In
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