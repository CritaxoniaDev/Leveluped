import { useState } from "react"
import { supabase } from "@/packages/supabase/supabase"
import { Button } from "@/packages/shadcn/ui/button"
import { Input } from "@/packages/shadcn/ui/input"
import { Separator } from "@/packages/shadcn/ui/separator"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { ArrowLeft } from "lucide-react"

export default function Signup() {
    const [email, setEmail] = useState("")
    const [name, setName] = useState("")
    const [username, setUsername] = useState("")
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

    // Username validation
    const validateUsername = (usernameValue: string): boolean => {
        const usernameRegex = /^[a-z0-9_-]{3,20}$/
        return usernameRegex.test(usernameValue)
    }

    const handleMagicLink = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        // Validate inputs
        if (!validateEmail(email)) {
            toast.error("Invalid Email", { description: "Please enter a valid email address" })
            setLoading(false)
            return
        }

        if (!name.trim() || name.trim().length < 2) {
            toast.error("Invalid Name", { description: "Please enter your full name" })
            setLoading(false)
            return
        }

        if (!validateUsername(username)) {
            toast.error("Invalid Username", { description: "Username must be 3-20 characters" })
            setLoading(false)
            return
        }

        try {
            // Check if email already exists
            const { data: existingUser, error: userError } = await supabase
                .from("users")
                .select("id")
                .eq("email", email.toLowerCase())
                .single()

            if (existingUser) {
                toast.error("Email Already Registered", {
                    description: "This email is already in use. Please log in instead."
                })
                setLoading(false)
                return
            }

            if (userError && userError.code !== "PGRST116") {
                throw userError
            }

            // Check if username already exists
            const { data: existingUsername } = await supabase
                .from("users")
                .select("id")
                .eq("username", username.toLowerCase())
                .single()

            if (existingUsername) {
                toast.error("Username Already Taken", {
                    description: "This username is already registered. Please choose another."
                })
                setLoading(false)
                return
            }

            const { error } = await supabase.auth.signInWithOtp({
                email: email.toLowerCase(),
                options: {
                    emailRedirectTo: `${window.location.origin}/verify/user`,
                    data: {
                        name: name.trim(),
                        username: username.toLowerCase().trim(),
                        role: 'learner'
                    }
                }
            })

            if (error) {
                console.error("OTP error:", error)
                toast.error("Failed to Send Code", {
                    description: error.message || "Please try again"
                })
                setLoading(false)
                return
            }

            toast.success("Verification Code Sent!", {
                description: `Check your email at ${email}`
            })

            navigate(`/auth/input-otp?email=${encodeURIComponent(email)}`)

        } catch (err: any) {
            console.error("Sign up error:", err)
            toast.error("Error", { description: "An unexpected error occurred" })
            setLoading(false)
        }
    }

    return (
        <div className="flex items-center justify-center dark:from-[#18181b] dark:to-[#27272a] px-4">
            <main className="w-full max-w-7xl">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    {/* Left Side - Login Form */}
                    <div className="flex flex-col">
                        {/* Back Arrow */}
                        <Button
                            variant="ghost"
                            className="mb-4 w-fit text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                            onClick={() => navigate("/")}
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Back to Home
                        </Button>
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
                            {/* Note for first time users */}
                            <div className="rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 text-sm mb-2 flex items-center gap-2">
                                <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" />
                                </svg>
                                <span>
                                    <strong>Note:</strong> First time registered users will receive <span className="font-semibold">100 coins</span> as a welcome bonus!
                                </span>
                            </div>
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
                                            We'll send you a 8-digit verification code to sign in securely
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
                                            Sending Verification Code...
                                        </span>
                                    ) : (
                                        "Send Verification Code"
                                    )}
                                </Button>
                            </form>

                            <Separator />

                            {/* Footer Links */}
                            <div className="space-y-4">
                                <div className="text-center text-xs text-gray-500 dark:text-gray-400">
                                    By signing up, you agree to our{" "}
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