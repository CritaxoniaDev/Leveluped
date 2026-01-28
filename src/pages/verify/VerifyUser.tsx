import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

export default function VerifyUser() {
  const [, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const verifyUserAndRedirect = async () => {
      try {
        // Get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError || !session) {
          toast.error("Verification Failed", {
            description: "Unable to verify your email. Please try again."
          })
          navigate("/signup")
          return
        }

        // Fetch user profile from users table
        const { data: userProfile, error: profileError } = await supabase
          .from("users")
          .select("id, email, role, name, is_verified")
          .eq("id", session.user.id)
          .single()

        if (profileError || !userProfile) {
          toast.error("Profile Not Found", {
            description: "Unable to load your profile. Please try again."
          })
          navigate("/signup")
          return
        }

        // Check if email is verified
        if (!userProfile.is_verified) {
          toast.error("Email Not Verified", {
            description: "Your email has not been verified yet. Please check your inbox."
          })
          navigate("/login")
          return
        }

        // Show success message
        toast.success("Email Verified!", {
          description: `Welcome to LevelUpED, ${userProfile.name}!`
        })

        // Route based on user role
        switch (userProfile.role) {
          case 'admin':
            navigate("/admin")
            break
          case 'instructor':
            navigate("/dashboard/instructor")
            break
          case 'learner':
          default:
            navigate("/dashboard/learner")
            break
        }
      } catch (err) {
        toast.error("Error", {
          description: "An unexpected error occurred during verification."
        })
        navigate("/signup")
      } finally {
        setLoading(false)
      }
    }

    verifyUserAndRedirect()
  }, [navigate])

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#18181b] dark:to-[#27272a]">
      <div className="text-center">
        <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <h2 className="mt-6 text-2xl font-bold text-gray-900 dark:text-white">Verifying Your Email</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Please wait while we verify your account...</p>
        <p className="mt-6 text-sm text-gray-500 dark:text-gray-500">You'll be redirected to your dashboard shortly</p>
      </div>
    </div>
  )
}