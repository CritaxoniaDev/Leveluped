import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { LogOut, User, Crown, Zap, Star } from "lucide-react"
import {
    NavigationMenu,
    NavigationMenuList,
    NavigationMenuItem,
    NavigationMenuLink,
} from "@/components/ui/navigation-menu"
import { LoginStreakDialog } from "@/components/login-streak-dialog"

interface HeaderProps {
    userName: string
    userRole: string
    userLevel?: number | null
    menuItems?: { icon: any, label: string, href: string }[]
    isFloating?: boolean
}

const AVATAR_BORDERS = [
    { id: 'none', name: 'None', image: null },
    { id: 'Border 1', name: 'Border 1', image: '/images/avatar-border/avatar-4.png' },
    { id: 'Border 2', name: 'Border 2', image: '/images/avatar-border/avatar-1.png' },
    { id: 'Border 3', name: 'Border 3', image: '/images/avatar-border/avatar-5.png' },
    { id: 'Border 4', name: 'Border 4', image: '/images/avatar-border/avatar-6.png' },
    { id: 'Border 5', name: 'Border 5', image: '/images/avatar-border/avatar-8.png' },
]

interface StarData {
    total_stars: number
    login_streak: number
    stars_earned_today: number
}

export function Header({ userName, userRole, userLevel, menuItems, isFloating = false }: HeaderProps) {
    const navigate = useNavigate()
    const [isLoggingOut, setIsLoggingOut] = useState(false)
    const [userXP, setUserXP] = useState({ current: 0, required: 60, total: 0 })
    const [progressPercentage, setProgressPercentage] = useState(0)
    const [currentLevel, setCurrentLevel] = useState(userLevel || 1)
    const [userAvatarBorder, setUserAvatarBorder] = useState<string | null>(null)
    const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null)
    const [starData, setStarData] = useState<StarData>({ total_stars: 0, login_streak: 0, stars_earned_today: 0 })
    const [showLoginStreakDialog, setShowLoginStreakDialog] = useState(false)
    const [loginStreakInfo, setLoginStreakInfo] = useState<any>(null)
    const [previousLevel, setPreviousLevel] = useState(userLevel || 1)

    const getUserId = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        return session?.user?.id || null
    }

    const getXPForLevel = (level: number): number => {
        let xpRequired = 0
        for (let i = 1; i < level; i++) {
            xpRequired += 60 + (i - 1) * 15
        }
        return xpRequired
    }

    const getXPRequiredForNextLevel = (level: number): number => {
        return 60 + (level - 1) * 15
    }

    const updateXPDisplay = useCallback((totalXP: number, level: number) => {
        const xpForCurrentLevel = getXPForLevel(level)
        const xpRequiredForNextLevel = getXPRequiredForNextLevel(level)
        const currentLevelXP = totalXP - xpForCurrentLevel

        setUserXP({
            current: Math.max(0, currentLevelXP),
            required: xpRequiredForNextLevel,
            total: totalXP
        })

        const percentage = (currentLevelXP / xpRequiredForNextLevel) * 100
        setProgressPercentage(Math.min(Math.max(0, percentage), 100))

        // Check for level up
        if (level > previousLevel && previousLevel > 0) {
            toast.success("Level Up! 🎉", {
                description: `Congratulations! You've reached Level ${level}!`
            })
            setPreviousLevel(level)
        }
    }, [previousLevel])

    const fetchLearnerXP = useCallback(async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            const { data: stats, error } = await supabase
                .from("user_stats")
                .select("total_xp, current_level")
                .eq("user_id", session.user.id)
                .maybeSingle()

            if (error) {
                console.error("Error fetching XP:", error)
                return
            }

            if (!stats) {
                const { data: newStats, error: upsertError } = await supabase
                    .from("user_stats")
                    .upsert({
                        user_id: session.user.id,
                        total_xp: 0,
                        current_level: 1
                    }, {
                        onConflict: 'user_id'
                    })
                    .select()
                    .single()

                if (upsertError) {
                    console.error("Error creating user_stats:", upsertError)
                    return
                }

                if (newStats) {
                    setCurrentLevel(newStats.current_level)
                    setPreviousLevel(newStats.current_level)
                    updateXPDisplay(newStats.total_xp, newStats.current_level)
                }
                return
            }

            setCurrentLevel(stats.current_level)
            updateXPDisplay(stats.total_xp, stats.current_level)
        } catch (error) {
            console.error("Error fetching XP:", error)
        }
    }, [updateXPDisplay])

    const fetchUserAvatar = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            const { data: userProfile, error } = await supabase
                .from("users")
                .select("avatar_border, avatar_url")
                .eq("id", session.user.id)
                .single()

            if (error) throw error

            if (userProfile) {
                setUserAvatarBorder(userProfile.avatar_border)
                setUserAvatarUrl(userProfile.avatar_url)
            }
        } catch (error) {
            console.error("Error fetching avatar:", error)
        }
    }

    const fetchStarData = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            const { data: stars, error } = await supabase
                .from("star_currency")
                .select("total_stars, login_streak, earned_today")
                .eq("user_id", session.user.id)
                .maybeSingle()

            if (error) {
                console.error("Error fetching star data:", error)
                return
            }

            if (stars) {
                setStarData({
                    total_stars: stars.total_stars || 0,
                    login_streak: stars.login_streak || 0,
                    stars_earned_today: stars.earned_today || 0
                })
            }
        } catch (error) {
            console.error("Error fetching star data:", error)
        }
    }

    const handleDailyLogin = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            const { data, error } = await supabase.rpc('handle_daily_login', {
                p_user_id: session.user.id
            })

            if (error) {
                console.error("Error handling daily login:", error)
                return
            }

            if (data && data.length > 0) {
                const result = data[0]
                setStarData({
                    total_stars: result.total_stars,
                    login_streak: result.login_streak,
                    stars_earned_today: result.stars_earned_today
                })

                if (result.streak_milestone_reached > 0 || result.stars_earned_today > 10) {
                    setLoginStreakInfo({
                        total_stars: result.total_stars,
                        login_streak: result.login_streak,
                        stars_earned: result.stars_earned_today,
                        streak_bonus_earned: result.streak_bonus_earned,
                        streak_milestone: result.streak_milestone_reached
                    })
                    setShowLoginStreakDialog(true)
                }
            }
        } catch (error) {
            console.error("Error in handleDailyLogin:", error)
        }
    }

    useEffect(() => {
        if (userRole !== 'learner') return

        fetchLearnerXP()
        fetchUserAvatar()
        fetchStarData()
        handleDailyLogin()

        let channel: any = null
        let isSubscribed = true

        const setupSubscription = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session || !isSubscribed) return

            channel = supabase.channel(`header_stats_${session.user.id}_${Date.now()}`)
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'user_stats',
                    filter: `user_id=eq.${session.user.id}`
                }, (payload) => {
                    const newStats = payload.new as any
                    if (newStats) {
                        const newLevel = newStats.current_level
                        const newXP = newStats.total_xp

                        // Check for level up before updating state
                        if (newLevel > currentLevel) {
                            toast.success("Level Up! 🎉", {
                                description: `Congratulations! You've reached Level ${newLevel}!`
                            })
                        }

                        setCurrentLevel(newLevel)
                        setPreviousLevel(newLevel)
                        updateXPDisplay(newXP, newLevel)
                    }
                })

        }

        setupSubscription()

        // Poll more frequently for updates
        const pollInterval = setInterval(() => {
            fetchLearnerXP()
            fetchStarData()
        }, 5000) // Changed from 10s to 5s

        return () => {
            isSubscribed = false
            clearInterval(pollInterval)
            if (channel) {

                supabase.removeChannel(channel)
            }
        }
    }, [userRole, fetchLearnerXP, updateXPDisplay, currentLevel])

    // Sync with prop changes
    useEffect(() => {
        if (userLevel && userLevel !== currentLevel) {

            // Check for level up
            if (userLevel > currentLevel) {
                toast.success("Level Up! 🎉", {
                    description: `Congratulations! You've reached Level ${userLevel}!`
                })
            }

            setCurrentLevel(userLevel)
            setPreviousLevel(userLevel)
            fetchLearnerXP()
        }
    }, [userLevel, currentLevel, fetchLearnerXP])

    const handleProfileClick = async () => {
        const userId = await getUserId()
        if (userId) {
            navigate(`/dashboard/${userRole}/profile/${userId}`)
        }
    }

    const getSelectedBorderImage = () => {
        const border = AVATAR_BORDERS.find(b => b.id === userAvatarBorder)
        return border?.image || undefined
    }

    const handleLogout = async () => {
        setIsLoggingOut(true)
        try {
            const { error } = await supabase.auth.signOut()
            if (error) throw error
            toast.success("Logged out successfully")
            navigate("/")
        } catch (error: any) {
            toast.error("Error logging out", {
                description: error.message
            })
        } finally {
            setIsLoggingOut(false)
        }
    }

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'admin':
                return 'bg-red-500'
            case 'instructor':
                return 'bg-blue-500'
            case 'learner':
                return 'bg-green-500'
            default:
                return 'bg-gray-500'
        }
    }

    const headerClass = isFloating
        ? "fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-6xl rounded-xl shadow-lg backdrop-blur-md bg-white/85 dark:bg-gray-900/85 border border-gray-200/50 dark:border-gray-700/50"
        : "bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800"

    const paddingClass = isFloating ? "px-5 py-2.5" : "px-6 py-4"

    return (
        <>
            <header className={`${headerClass} ${paddingClass}`}>
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent head-font whitespace-nowrap">
                            LevelUpED
                        </h1>
                        {menuItems && menuItems.length > 0 && (
                            <nav className="hidden md:flex">
                                <NavigationMenu>
                                    <NavigationMenuList>
                                        {menuItems.map((item, index) => {
                                            const Icon = item.icon
                                            return (
                                                <NavigationMenuItem key={`${item.href}-${index}`}>
                                                    <NavigationMenuLink
                                                        href={item.href}
                                                        className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors whitespace-nowrap"
                                                    >
                                                        <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                                                        <span className="hidden lg:inline">{item.label}</span>
                                                    </NavigationMenuLink>
                                                </NavigationMenuItem>
                                            )
                                        })}
                                    </NavigationMenuList>
                                </NavigationMenu>
                            </nav>
                        )}
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                        {userRole === 'learner' && starData.total_stars > 0 && (
                            <Badge variant="secondary" className="flex items-center gap-1 text-xs px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-300 dark:border-yellow-700">
                                <Star className="w-3 h-3 fill-yellow-400" />
                                <span className="font-semibold">{starData.total_stars}</span>
                            </Badge>
                        )}

                        {userRole === 'learner' && currentLevel && (
                            <div className="hidden sm:flex items-center gap-2 min-w-[180px]">
                                <Badge variant="secondary" className="flex items-center gap-1 text-xs px-2 py-0.5 flex-shrink-0">
                                    <Crown className="w-3 h-3" />
                                    <span>Level {currentLevel}</span>
                                </Badge>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1 mb-0.5">
                                        <Zap className="w-3 h-3 text-yellow-500 flex-shrink-0" />
                                        <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400">
                                            {userXP.current}/{userXP.required} XP
                                        </span>
                                    </div>
                                    <Progress value={progressPercentage} className="h-1.5" />
                                </div>
                            </div>
                        )}

                        {userRole === 'learner' && currentLevel && (
                            <div className="sm:hidden">
                                <Badge variant="secondary" className="flex items-center gap-1 text-xs px-2 py-0.5">
                                    <Crown className="w-3 h-3" />
                                    <span>{currentLevel}</span>
                                </Badge>
                            </div>
                        )}

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-7 w-7 rounded-full p-0 flex-shrink-0">
                                    <div className="relative w-7 h-7">
                                        <Avatar className="h-7 w-7">
                                            <AvatarImage src={userAvatarUrl || undefined} alt={userName} />
                                            <AvatarFallback className={`${getRoleColor(userRole)} text-white text-xs font-bold`}>
                                                {userName.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        {getSelectedBorderImage() && (
                                            <img
                                                src={getSelectedBorderImage() as string}
                                                alt="Avatar Border"
                                                className="absolute inset-0 w-full h-full pointer-events-none scale-150 rounded-full"
                                            />
                                        )}
                                    </div>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-48 sm:w-56" align="end" forceMount>
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-xs sm:text-sm font-medium leading-none truncate">{userName}</p>
                                        <p className="text-xs leading-none text-muted-foreground capitalize">
                                            {userRole}
                                        </p>
                                        {userRole === 'learner' && (
                                            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 space-y-2">
                                                <div>
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-[10px] text-gray-600 dark:text-gray-400">Level {currentLevel}</span>
                                                        <span className="text-[10px] text-gray-600 dark:text-gray-400">{userXP.current}/{userXP.required} XP</span>
                                                    </div>
                                                    <Progress value={progressPercentage} className="h-1.5" />
                                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                                                        {Math.max(0, userXP.required - userXP.current)} XP to next level
                                                    </p>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1">
                                                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                                        <span className="text-[10px] font-semibold text-yellow-700 dark:text-yellow-400">{starData.total_stars}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-[10px] text-gray-500 dark:text-gray-400">Streak:</span>
                                                        <span className="text-[10px] font-semibold text-red-600 dark:text-red-400">{starData.login_streak} 🔥</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleProfileClick} className="text-xs sm:text-sm">
                                    <User className="mr-2 h-3.5 w-3.5" />
                                    <span>Profile</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut} className="text-xs sm:text-sm">
                                    <LogOut className="mr-2 h-3.5 w-3.5" />
                                    <span>{isLoggingOut ? "Logging out..." : "Log out"}</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </header>

            {showLoginStreakDialog && loginStreakInfo && (
                <LoginStreakDialog
                    isOpen={showLoginStreakDialog}
                    onOpenChange={setShowLoginStreakDialog}
                    streakInfo={loginStreakInfo}
                />
            )}
        </>
    )
}