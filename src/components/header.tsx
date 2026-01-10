import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Menu, LogOut, User } from "lucide-react"
import { toast } from "sonner"

interface HeaderProps {
    onMenuClick?: () => void
    userName?: string
    userRole?: string
}

export function Header({ onMenuClick, userName, userRole }: HeaderProps) {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)

    const handleLogout = async () => {
        setLoading(true)
        try {
            const { error } = await supabase.auth.signOut()
            if (error) throw error
            
            toast.success("Logged out", {
                description: "You have been logged out successfully"
            })
            navigate("/login")
        } catch (err: any) {
            toast.error("Logout failed", {
                description: err.message
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <header className="sticky top-0 z-40 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
            <div className="flex items-center justify-between h-16 px-6">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onMenuClick}
                        className="lg:hidden"
                    >
                        <Menu className="w-5 h-5" />
                    </Button>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                        LevelUpED
                    </h1>
                </div>

                <div className="flex items-center gap-4">
                    {userName && (
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {userName}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                {userRole}
                            </p>
                        </div>
                    )}

                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleLogout}
                        disabled={loading}
                        className="text-red-600 hover:text-red-700 dark:text-red-400"
                    >
                        <LogOut className="w-5 h-5" />
                    </Button>
                </div>
            </div>
        </header>
    )
}