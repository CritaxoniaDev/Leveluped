import { useEffect, useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { Header } from "@/components/header"
import {
    SidebarProvider,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarFooter,
    SidebarSeparator,
    useSidebar,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import {
    LayoutDashboard as LayoutDashboardIcon,
    BookOpen,
    Users,
    BarChart3,
    Settings,
    Trophy,
    MessageSquare,
    ChevronLeft,
    ChevronRight,
} from "lucide-react"

interface LayoutDashboardProps {
    children: React.ReactNode
    allowedRoles?: ("learner" | "instructor" | "admin")[]
}

function SidebarContent() {
    const location = useLocation()
    const navigate = useNavigate()
    const { state } = useSidebar()
    const [userProfile, setUserProfile] = useState<any>(null)

    useEffect(() => {
        const fetchUserRole = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (session) {
                const { data: profile } = await supabase
                    .from("users")
                    .select("role")
                    .eq("id", session.user.id)
                    .single()
                setUserProfile(profile)
            }
        }
        fetchUserRole()
    }, [])

    const getLearnerMenuItems = () => [
        { icon: LayoutDashboardIcon, label: "Dashboard", href: "/dashboard/learner" },
        { icon: BookOpen, label: "My Courses", href: "/dashboard/learner/courses" },
        { icon: Trophy, label: "Achievements", href: "/dashboard/learner/achievements" },
        { icon: BarChart3, label: "Progress", href: "/dashboard/learner/progress" },
        { icon: MessageSquare, label: "Messages", href: "/dashboard/learner/messages" },
        { icon: Settings, label: "Settings", href: "/dashboard/learner/settings" },
    ]

    const getInstructorMenuItems = () => [
        { icon: LayoutDashboardIcon, label: "Dashboard", href: "/dashboard/instructor" },
        { icon: BookOpen, label: "My Courses", href: "/dashboard/instructor/courses" },
        { icon: Users, label: "Students", href: "/dashboard/instructor/students" },
        { icon: MessageSquare, label: "Messages", href: "/dashboard/instructor/messages" },
        { icon: Settings, label: "Settings", href: "/dashboard/instructor/settings" },
    ]

    const getAdminMenuItems = () => [
        { icon: LayoutDashboardIcon, label: "Dashboard", href: "/dashboard/admin" },
        { icon: Users, label: "Users", href: "/dashboard/admin/users" },
        { icon: BookOpen, label: "Courses", href: "/dashboard/admin/courses" },
        { icon: MessageSquare, label: "Support", href: "/dashboard/admin/support" },
        { icon: Settings, label: "Settings", href: "/dashboard/admin/settings" },
    ]

    const getMenuItems = () => {
        switch (userProfile?.role) {
            case "learner":
                return getLearnerMenuItems()
            case "instructor":
                return getInstructorMenuItems()
            case "admin":
                return getAdminMenuItems()
            default:
                return []
        }
    }

    const menuItems = getMenuItems()

    return (
        <>
            <SidebarGroup>
                {state === "expanded" && (
                    <SidebarGroupLabel>Navigation</SidebarGroupLabel>
                )}
                <SidebarGroupContent>
                    <SidebarMenu>
                        {menuItems.map((item) => {
                            const Icon = item.icon
                            const isActive = location.pathname === item.href
                            return (
                                <SidebarMenuItem key={item.href}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={isActive}
                                        onClick={() => navigate(item.href)}
                                        title={state === "collapsed" ? item.label : undefined}
                                        className={state === "collapsed" ? "justify-center px-2" : ""}
                                    >
                                        <a href={item.href}>
                                            <Icon className="w-4 h-4" />
                                            {state === "expanded" && <span>{item.label}</span>}
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            )
                        })}
                    </SidebarMenu>
                </SidebarGroupContent>
            </SidebarGroup>

            <SidebarFooter>
                <SidebarSeparator />
                <div className="px-2 py-2">
                    {state === "expanded" && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                            LevelUpED v1.0
                        </p>
                    )}
                </div>
            </SidebarFooter>
        </>
    )
}

function CollapsibleHeader() {
    const { toggleSidebar, state } = useSidebar()

    return (
        <div className={`absolute ${state === "collapsed" ? "top-4 left-1/2 -translate-x-1/2" : "-right-4 top-4"} z-50`}>
            <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="h-8 w-8 rounded-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 shadow-md"
                title={state === "expanded" ? "Collapse sidebar" : "Expand sidebar"}
            >
                {state === "expanded" ? (
                    <ChevronLeft className="w-4 h-4" />
                ) : (
                    <ChevronRight className="w-4 h-4" />
                )}
            </Button>
        </div>
    )
}

function MainContent({ children, allowedRoles }: LayoutDashboardProps) {
    const navigate = useNavigate()
    const { state } = useSidebar()
    const [user, setUser] = useState<any>(null)
    const [userProfile, setUserProfile] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                // Get current session
                const { data: { session }, error: sessionError } = await supabase.auth.getSession()

                if (sessionError || !session) {
                    navigate("/login")
                    return
                }

                setUser(session.user)

                // Get user profile from database
                const { data: profile, error: profileError } = await supabase
                    .from("users")
                    .select("id, email, name, username, role, is_verified")
                    .eq("id", session.user.id)
                    .single()

                if (profileError || !profile) {
                    toast.error("Error", {
                        description: "Could not load user profile"
                    })
                    navigate("/login")
                    return
                }

                setUserProfile(profile)

                // Check if user role is allowed
                if (allowedRoles && !allowedRoles.includes(profile.role)) {
                    toast.error("Access Denied", {
                        description: "You do not have permission to access this page"
                    })
                    navigate(`/dashboard/${profile.role}`)
                    return
                }

            } catch (error: any) {
                console.error("Error fetching user data:", error)
                toast.error("Error", {
                    description: "An error occurred while loading your profile"
                })
                navigate("/login")
            } finally {
                setLoading(false)
            }
        }

        fetchUserData()

        // Subscribe to auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (event === "SIGNED_OUT" || !session) {
                    setUser(null)
                    setUserProfile(null)
                    navigate("/login")
                }
            }
        )

        return () => {
            subscription?.unsubscribe()
        }
    }, [navigate, allowedRoles])

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-950">
                <div className="text-center">
                    <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col w-full h-screen bg-gray-50 dark:bg-gray-950">
            {/* Header */}
            <Header
                userName={userProfile?.name || userProfile?.username}
                userRole={userProfile?.role}
            />

            {/* Main content with sidebar */}
            <div className="flex flex-1 overflow-hidden relative">
                {/* Sidebar */}
                <div className={`absolute left-0 top-0 h-full z-10 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 ${state === "expanded" ? "w-60" : "w-10"}`}>
                    <div className={`flex h-full flex-col ${state === "collapsed" ? "pt-12" : ""}`}>
                        <SidebarContent />
                    </div>
                    <CollapsibleHeader />
                </div>

                {/* Page content */}
                <main className={`flex-1 overflow-y-auto transition-all duration-300 ${state === "expanded" ? "ml-60" : "ml-10"}`}>
                    <div className="p-6 px-10">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}

export function LayoutDashboard({ children, allowedRoles }: LayoutDashboardProps) {
    return (
        <SidebarProvider>
            <MainContent children={children} allowedRoles={allowedRoles} />
        </SidebarProvider>
    )
}