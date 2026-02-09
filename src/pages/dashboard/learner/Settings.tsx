import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"

interface UserProfile {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  created_at: string
  role: string
}

interface StarCurrency {
  total_stars: number
  earned_today: number
  login_streak: number
  last_login_date: string | null
}

export default function Settings() {
  const navigate = useNavigate()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [, setStarCurrency] = useState<StarCurrency | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchUserProfile()
    fetchStarCurrency()
  }, [])

  const fetchUserProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        navigate("/login")
        return
      }

      const { data, error } = await supabase
        .from("users")
        .select("id, email, full_name, avatar_url, created_at, role")
        .eq("id", session.user.id)
        .maybeSingle()

      if (error) {
        console.error("Error fetching from users table:", error)
        setUser({
          id: session.user.id,
          email: session.user.email || "",
          full_name: session.user.user_metadata?.full_name || "",
          avatar_url: session.user.user_metadata?.avatar_url,
          created_at: session.user.created_at || new Date().toISOString(),
          role: "learner",
        })
        return
      }

      if (!data) {
        setUser({
          id: session.user.id,
          email: session.user.email || "",
          full_name: session.user.user_metadata?.full_name || "",
          avatar_url: session.user.user_metadata?.avatar_url,
          created_at: session.user.created_at || new Date().toISOString(),
          role: "learner",
        })
        return
      }

      setUser({
        id: data.id,
        email: data.email || session.user.email || "",
        full_name: data.full_name || "",
        avatar_url: data.avatar_url,
        created_at: data.created_at,
        role: data.role || "learner",
      })
    } catch (error) {
      console.error("Error fetching profile:", error)
      toast.error("Error", {
        description: "Failed to load profile"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchStarCurrency = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data, error } = await supabase
        .from("star_currency")
        .select("total_stars, earned_today, login_streak, last_login_date")
        .eq("user_id", session.user.id)
        .maybeSingle()

      if (error) {
        console.error("Error fetching star currency:", error)
        setStarCurrency({
          total_stars: 0,
          earned_today: 0,
          login_streak: 0,
          last_login_date: null,
        })
        return
      }

      if (!data) {
        setStarCurrency({
          total_stars: 0,
          earned_today: 0,
          login_streak: 0,
          last_login_date: null,
        })
        return
      }

      setStarCurrency({
        total_stars: data.total_stars || 0,
        earned_today: data.earned_today || 0,
        login_streak: data.login_streak || 0,
        last_login_date: data.last_login_date || null,
      })
    } catch (error) {
      console.error("Error fetching star currency:", error)
      setStarCurrency({
        total_stars: 0,
        earned_today: 0,
        login_streak: 0,
        last_login_date: null,
      })
    }
  }

  const handleDeleteProfile = async () => {
    try {
      setIsDeleting(true)
      setError("")

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        navigate("/login")
        return
      }

      // Step 1: Delete user data from users table
      const { error: userError } = await supabase
        .from("users")
        .delete()
        .eq("id", session.user.id)

      if (userError) throw userError

      // Step 2: Delete related data
      try {
        await supabase
          .from("star_currency")
          .delete()
          .eq("user_id", session.user.id)
      } catch (e) {
        console.log("Star currency deletion skipped")
      }

      // Step 3: Delete user auth account
      const { error: deleteError } = await supabase.auth.admin.deleteUser(
        session.user.id
      )

      if (deleteError) {
        await supabase.auth.signOut()

        try {
          await supabase.rpc('delete_user_account', {
            user_id: session.user.id
          })
        } catch (rpcError) {
          console.warn("RPC delete failed, but user data was removed")
        }
      }

      toast.success("Account deleted", {
        description: "Your account has been permanently deleted"
      })

      await supabase.auth.signOut()
      navigate("/")
    } catch (error: any) {
      console.error("Error deleting account:", error)
      setError(error.message || "Failed to delete account. Please contact support.")
      setIsDeleting(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-muted-foreground">Loading settings...</p>
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-destructive">Failed to load profile</p>
        </div>
      </main>
    )
  }

  return (
    <main className="bg-white">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage your account and preferences
          </p>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {/* Danger Zone */}
          <div className="border border-destructive/50 rounded-lg p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-destructive">Danger Zone</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Irreversible actions for your account
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-foreground">Delete Profile</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
              </div>
              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
                disabled={isDeleting}
                className="w-full"
              >
                {isDeleting ? 'Deleting...' : 'Delete Profile'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Profile</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete your profile? This action cannot be undone
              and all your data will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            This is permanent. Please be certain.
          </div>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProfile}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}