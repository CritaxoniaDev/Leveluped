import { useEffect, useState, useCallback } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { supabase } from "@/packages/supabase/supabase"
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
} from "@/packages/shadcn/ui/sidebar"
import { Button } from "@/packages/shadcn/ui/button"
import { toast } from "sonner"
import {
    LayoutDashboard as LayoutDashboardIcon,
    BookOpen,
    Users,
    Settings,
    Trophy,
    MessageSquare,
    ChevronLeft,
    ChevronRight,
    CircleStar,
    Coins,
    BanknoteArrowDown,
} from "lucide-react"
import {
    checkAllAchievements
} from "@/helpers/achievementHelper"

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

    const getInstructorMenuItems = () => [
        { icon: LayoutDashboardIcon, label: "Dashboard", href: "/dashboard/instructor" },
        { icon: BookOpen, label: "My Courses", href: "/dashboard/instructor/courses" },
        { icon: Users, label: "Students", href: "/dashboard/instructor/students" },
        { icon: MessageSquare, label: "Messages", href: "/dashboard/instructor/messages" },
        { icon: Settings, label: "Settings", href: "/dashboard/instructor/settings" },
    ]

    const getAdminMenuItems = () => [
        { icon: LayoutDashboardIcon, label: "Dashboard", href: "/dashboard/admin" },
        { icon: BookOpen, label: "Course Map", href: "/dashboard/admin/courses" },
        { icon: Users, label: "Users", href: "/dashboard/admin/users" },
        { icon: MessageSquare, label: "Support", href: "/dashboard/admin/support" },
        { icon: BanknoteArrowDown, label: "Transactions", href: "/dashboard/admin/transactions" },
        { icon: Coins, label: "Stripe Products", href: "/dashboard/admin/stripe-products" },
        { icon: Settings, label: "Settings", href: "/dashboard/admin/settings" },
    ]

    const getMenuItems = () => {
        switch (userProfile?.role) {
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
    const location = useLocation()
    const { state } = useSidebar()
    const [, setUser] = useState<any>(null)
    const [userProfile, setUserProfile] = useState<any>(null)
    const [userLevel, setUserLevel] = useState<number | null>(null)
    const [previousLevel, setPreviousLevel] = useState<number | null>(null)
    const [loading, setLoading] = useState(true)

    const fetchUserLevel = useCallback(async (userId: string) => {
        try {
            const { data: stats, error } = await supabase
                .from("user_stats")
                .select("current_level, total_xp")
                .eq("user_id", userId)
                .maybeSingle()

            if (error) {
                console.error("Error fetching user level:", error)
                return
            }

            if (stats) {
                const newLevel = stats.current_level

                // Check for level up
                if (previousLevel !== null && newLevel > previousLevel) {
                    toast.success("Level Up! 🎉", {
                        description: `Congratulations! You've reached Level ${newLevel}!`
                    })
                }

                setUserLevel(newLevel)
                setPreviousLevel(newLevel)
            }
        } catch (error) {
            console.error("Error in fetchUserLevel:", error)
        }
    }, [previousLevel])

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const { data: { session }, error: sessionError } = await supabase.auth.getSession()

                if (sessionError || !session) {
                    navigate("/login")
                    return
                }

                setUser(session.user)

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

                // Fetch user level if learner
                if (profile.role === 'learner') {
                    const { data: stats } = await supabase
                        .from("user_stats")
                        .select("current_level, total_xp")
                        .eq("user_id", session.user.id)
                        .maybeSingle()

                    if (stats) {
                        setUserLevel(stats.current_level)
                        setPreviousLevel(stats.current_level)
                        // Check and award achievements
                        await checkAllAchievements(session.user.id)
                    } else {
                        // Create initial stats if not exists
                        const { data: newStats } = await supabase
                            .from("user_stats")
                            .upsert({
                                user_id: session.user.id,
                                total_xp: 0,
                                current_level: 1
                            }, { onConflict: 'user_id' })
                            .select()
                            .single()

                        if (newStats) {
                            setUserLevel(newStats.current_level)
                            setPreviousLevel(newStats.current_level)
                        }
                    }
                }

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

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (event === "SIGNED_OUT" || !session) {
                    setUser(null)
                    setUserProfile(null)
                    setUserLevel(null)
                    setPreviousLevel(null)
                    navigate("/login")
                }
            }
        )

        return () => {
            subscription?.unsubscribe()
        }
    }, [navigate, allowedRoles])

    // Subscribe to user stats changes for realtime level updates
    useEffect(() => {
        if (!userProfile || userProfile.role !== 'learner') return

        let channel: any = null
        let pollInterval: any = null

        const setupSubscription = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            channel = supabase.channel(`layout_user_stats_${session.user.id}_${Date.now()}`)
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'user_stats',
                    filter: `user_id=eq.${session.user.id}`
                }, (payload) => {
                    const newStats = payload.new as any
                    if (newStats?.current_level) {
                        const newLevel = newStats.current_level

                        // Check for level up
                        if (userLevel !== null && newLevel > userLevel) {
                            toast.success("Level Up! 🎉", {
                                description: `Congratulations! You've reached Level ${newLevel}!`
                            })
                        }

                        setUserLevel(newLevel)
                        setPreviousLevel(newLevel)
                    }
                })


            // Poll for updates as backup
            pollInterval = setInterval(() => {
                fetchUserLevel(session.user.id)
            }, 5000)
        }

        setupSubscription()

        return () => {
            if (pollInterval) clearInterval(pollInterval)
            if (channel) {
                supabase.removeChannel(channel)
            }
        }
    }, [userProfile?.id, userProfile?.role, userLevel, fetchUserLevel])

    if (loading) {
        return (
            <div className="flex items-center justify-center w-full h-screen bg-gray-50 dark:bg-gray-950">
                <div className="text-center">
                    <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading...</p>
                </div>
            </div>
        )
    }

    const isLearner = userProfile?.role === 'learner'
    const isLearnerDashboardPage = location.pathname === '/dashboard/learner'
    const isMessagesPage = location.pathname.includes('/messages')
    const isFeedbackPage = location.pathname.includes('/feedback')
    const shouldUseFloatingHeader = isLearner && isLearnerDashboardPage
    const shouldHideHeader = isFeedbackPage

    const learnerMenuItems = [
        { icon: LayoutDashboardIcon, label: "Dashboard", href: "/dashboard/learner" },
        { icon: BookOpen, label: "My Courses", href: "/dashboard/learner/my-courses" },
        { icon: MessageSquare, label: "Messages", href: "/dashboard/learner/messages" },
        { icon: Trophy, label: "Achievements", href: "/dashboard/learner/achievements" },
        { icon: CircleStar, label: "Leaderboards", href: "/dashboard/learner/leaderboard" },
        { icon: Settings, label: "Settings", href: "/dashboard/learner/settings" },
    ]

    return (
        <div className="flex flex-col w-full h-screen dark:bg-gray-950">
            {shouldUseFloatingHeader && (
                <div className="fixed top-0 left-0 right-0 z-50 flex justify-center p-2 sm:p-3 pointer-events-none">
                    <div className="pointer-events-auto w-full">
                        <Header
                            userName={userProfile?.name || userProfile?.username}
                            userRole={userProfile?.role}
                            userLevel={userLevel}
                            menuItems={learnerMenuItems}
                            isFloating={true}
                        />
                    </div>
                </div>
            )}

            {!shouldUseFloatingHeader && !shouldHideHeader && (
                <Header
                    userName={userProfile?.name || userProfile?.username}
                    userRole={userProfile?.role}
                    userLevel={isLearner ? userLevel : undefined}
                    menuItems={isLearner ? learnerMenuItems : undefined}
                    isFloating={false}
                />
            )}

            <div className="flex flex-1 overflow-hidden relative">
                {!isLearner && (
                    <>
                        <div className={`absolute left-0 top-0 h-full z-10 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 ${state === "expanded" ? "w-60" : "w-16"}`}>
                            <div className={`flex h-full flex-col ${state === "collapsed" ? "pt-12" : ""}`}>
                                <SidebarContent />
                            </div>
                            <CollapsibleHeader />
                        </div>
                    </>
                )}

                <main className={`flex-1 overflow-y-auto transition-all duration-300 ${!isLearner ? (state === "expanded" ? "ml-60" : "ml-16") : "ml-0"}`}>
                    <div className={isLearnerDashboardPage || isMessagesPage ? "h-full" : isLearner ? "h-full overflow-y-auto" : "p-4 sm:p-6 h-full overflow-y-auto"}>
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