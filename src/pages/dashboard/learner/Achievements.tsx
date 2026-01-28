import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Trophy, Star, Award, Target, Flame, Brain, Zap, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import {
    checkAllAchievements,
    awardBadge
} from "@/helpers/achievementHelper"

interface UserStats {
    total_xp: number
    current_level: number
    badges_count: number
    leaderboard_rank: number | null
}

interface Badge {
    id: string
    name: string
    description: string
    icon: string
    xp_reward: number
    level_required: number
    category: string
    earned_at?: string
}

interface UserBadge extends Badge {
    earned_at: string
}

export default function Achievements() {
    const [userStats, setUserStats] = useState<UserStats>({
        total_xp: 0,
        current_level: 1,
        badges_count: 0,
        leaderboard_rank: null
    })
    const [earnedBadges, setEarnedBadges] = useState<UserBadge[]>([])
    const [availableBadges, setAvailableBadges] = useState<Badge[]>([])
    const [loading, setLoading] = useState(true)
    const [claiming, setClaiming] = useState<string | null>(null)
    const [recheckingAchievements, setRecheckingAchievements] = useState(false)

    const getXPForLevel = (level: number) => {
        if (level <= 1) return 0
        let total = 0
        for (let k = 1; k < level; k++) {
            total += 60 + (k - 1) * 15
        }
        return total
    }

    const getLevelFromXP = (xp: number) => {
        let level = 1
        let required = 0
        while (true) {
            const nextRequired = required + 60 + (level - 1) * 15
            if (xp < nextRequired) break
            required = nextRequired
            level++
        }
        return level
    }

    useEffect(() => {
        fetchAchievements()
        setupRealtimeSubscription()
    }, [])

    const setupRealtimeSubscription = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        let channel: any = null

        const startSubscription = async () => {
            channel = supabase.channel(`user_stats_changes_${session.user.id}`)
                .on('postgres_changes', {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'user_stats',
                    filter: `user_id=eq.${session.user.id}`
                }, (payload) => {
                    const newStats = payload.new as UserStats
                    const oldLevel = userStats.current_level
                    const newLevel = newStats.current_level

                    // Update state
                    setUserStats(newStats)

                    // Check for level up
                    if (newLevel > oldLevel) {
                        toast.success(`Level Up! 🎊`, {
                            description: `You've reached Level ${newLevel}!`
                        })
                    }
                })
                .subscribe()
        }

        await startSubscription()

        return () => {
            if (channel) {
                supabase.removeChannel(channel)
            }
        }
    }

    const recheckAllAchievements = async () => {
        try {
            setRecheckingAchievements(true)
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            // Use the comprehensive achievement check
            await checkAllAchievements(session.user.id)

            // Refresh achievements data
            await fetchAchievements()

            toast.success("Achievements rechecked", {
                description: "All available achievements have been verified"
            })
        } catch (error) {
            console.error("Error rechecking achievements:", error)
            toast.error("Error", {
                description: "Failed to recheck achievements"
            })
        } finally {
            setRecheckingAchievements(false)
        }
    }

    const fetchAchievements = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            // Fetch user stats
            const { data: stats, error: statsError } = await supabase
                .from("user_stats")
                .select("*")
                .eq("user_id", session.user.id)
                .single()

            if (statsError) throw statsError

            // Calculate correct level based on XP
            const correctLevel = getLevelFromXP(stats.total_xp)
            if (correctLevel !== stats.current_level) {
                // Update level in DB
                const { error: updateError } = await supabase
                    .from("user_stats")
                    .update({ current_level: correctLevel })
                    .eq("user_id", session.user.id)

                if (updateError) throw updateError
                stats.current_level = correctLevel
            }

            setUserStats(stats)

            // Fetch earned badges with proper relationship
            const { data: earned, error: earnedError } = await supabase
                .from("user_badges")
                .select(`
                    earned_at,
                    badge_id,
                    badges (
                        id,
                        name,
                        description,
                        icon,
                        xp_reward,
                        level_required,
                        category
                    )
                `)
                .eq("user_id", session.user.id)

            if (earnedError) throw earnedError

            const earnedBadgesData = earned
                .map((item: any) => ({
                    ...item.badges,
                    earned_at: item.earned_at
                }))
                .filter((badge: any) => badge && badge.id) // Filter out null values

            setEarnedBadges(earnedBadgesData)

            // Fetch all available badges
            const { data: allBadges, error: badgesError } = await supabase
                .from("badges")
                .select("*")
                .order("xp_reward", { ascending: true })

            if (badgesError) throw badgesError
            setAvailableBadges(allBadges || [])

        } catch (error: any) {
            console.error("Error fetching achievements:", error)
            toast.error("Error", {
                description: "Failed to load achievements"
            })
        } finally {
            setLoading(false)
        }
    }

    const claimBadge = async (badgeId: string) => {
        try {
            setClaiming(badgeId)
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            // Find the badge to get its name for awarding
            const badge = availableBadges.find(b => b.id === badgeId)
            if (!badge) {
                toast.error("Error", {
                    description: "Badge not found"
                })
                return
            }

            // Use the awardBadge function to properly award the badge with XP and level up
            const result = await awardBadge(session.user.id, badge.name, true)

            if (result.success) {
                // Refresh data
                await fetchAchievements()
            } else {
                toast.error("Error", {
                    description: result.message
                })
            }
        } catch (error: any) {
            console.error("Error claiming badge:", error)
            toast.error("Error", {
                description: "Failed to claim badge"
            })
        } finally {
            setClaiming(null)
        }
    }

    const getIconForCategory = (category: string) => {
        switch (category) {
            case 'achievement':
                return <Trophy className="w-6 h-6" />
            case 'academic':
                return <Brain className="w-6 h-6" />
            case 'speed':
                return <Zap className="w-6 h-6" />
            case 'consistency':
                return <Flame className="w-6 h-6" />
            case 'level':
                return <Star className="w-6 h-6" />
            default:
                return <Award className="w-6 h-6" />
        }
    }

    const getProgressToNextLevel = () => {
        const xpForCurrentLevel = getXPForLevel(userStats.current_level)
        const xpForNextLevel = getXPForLevel(userStats.current_level + 1)
        const currentLevelXP = userStats.total_xp - xpForCurrentLevel
        const xpNeeded = xpForNextLevel - xpForCurrentLevel
        return Math.min((currentLevelXP / xpNeeded) * 100, 100)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading achievements...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Achievements
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                        Track your progress and unlock badges as you learn
                    </p>
                </div>
                <Button 
                    onClick={recheckAllAchievements} 
                    disabled={recheckingAchievements}
                    variant="outline"
                >
                    <RefreshCw className={`w-4 h-4 mr-2 ${recheckingAchievements ? 'animate-spin' : ''}`} />
                    {recheckingAchievements ? 'Rechecking...' : 'Recheck Achievements'}
                </Button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total XP</CardTitle>
                        <Star className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{userStats.total_xp.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            Keep learning to earn more!
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Current Level</CardTitle>
                        <Target className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{userStats.current_level}</div>
                        <p className="text-xs text-muted-foreground">
                            {getProgressToNextLevel().toFixed(0)}% to level {userStats.current_level + 1}
                        </p>
                        <Progress value={getProgressToNextLevel()} className="mt-2" />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Badges Earned</CardTitle>
                        <Award className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{earnedBadges.length}</div>
                        <p className="text-xs text-muted-foreground">
                            Out of {availableBadges.length} available
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Leaderboard Rank</CardTitle>
                        <Trophy className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {userStats.leaderboard_rank ? `#${userStats.leaderboard_rank}` : 'N/A'}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Global ranking
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Earned Badges */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Award className="w-5 h-5" />
                        Earned Badges ({earnedBadges.length})
                    </CardTitle>
                    <CardDescription>
                        Badges you've unlocked through your learning journey
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {earnedBadges.length === 0 ? (
                        <div className="text-center py-8">
                            <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500 dark:text-gray-400">
                                No badges earned yet. Keep learning to unlock your first badge!
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {earnedBadges.map((badge) => (
                                <Card key={badge.id} className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20">
                                    <CardContent className="p-4">
                                        <div className="flex items-start gap-3">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-2xl flex-shrink-0">
                                                {badge.icon || getIconForCategory(badge.category)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                                                    {badge.name}
                                                </h3>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                                    {badge.description}
                                                </p>
                                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                                    <Badge variant="secondary" className="text-xs capitalize">
                                                        {badge.category}
                                                    </Badge>
                                                    <Badge className="text-xs bg-green-500">
                                                        Earned
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {new Date(badge.earned_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Available Badges */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Target className="w-5 h-5" />
                        Available Badges ({availableBadges.length - earnedBadges.length})
                    </CardTitle>
                    <CardDescription>
                        Badges you can still unlock
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {availableBadges.filter(badge => !earnedBadges.some(earned => earned.id === badge.id)).length === 0 ? (
                        <div className="text-center py-8">
                            <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                            <p className="text-gray-500 dark:text-gray-400">
                                Congratulations! You've earned all available badges! 🎉
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {availableBadges
                                .filter(badge => !earnedBadges.some(earned => earned.id === badge.id))
                                .map((badge) => {
                                    const meetsXPRequirement = badge.xp_reward === 0 || userStats.total_xp >= badge.xp_reward
                                    const meetsLevelRequirement = userStats.current_level >= badge.level_required
                                    const canClaim = meetsXPRequirement && meetsLevelRequirement
                                    const progress = badge.xp_reward === 0 ? 100 : Math.min((userStats.total_xp / badge.xp_reward) * 100, 100)
                                    
                                    return (
                                        <Card key={badge.id} className={canClaim ? "border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/20" : "opacity-60"}>
                                            <CardContent className="p-4">
                                                <div className="flex items-start gap-3">
                                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0 ${canClaim ? 'bg-gradient-to-br from-yellow-300 to-orange-400' : 'bg-gray-300 dark:bg-gray-600'}`}>
                                                        {badge.icon || getIconForCategory(badge.category)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                                                            {badge.name}
                                                        </h3>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                                            {badge.description}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                                                            {badge.xp_reward > 0 && (
                                                                <Badge variant="outline" className="text-xs">
                                                                    {badge.xp_reward} XP
                                                                </Badge>
                                                            )}
                                                            {badge.level_required > 0 && (
                                                                <Badge variant="outline" className="text-xs">
                                                                    Level {badge.level_required}+
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        
                                                        {/* Requirements Status */}
                                                        <div className="mt-2 space-y-1">
                                                            {badge.xp_reward > 0 && (
                                                                <div>
                                                                    <div className="flex justify-between text-xs mb-1">
                                                                        <span className={meetsXPRequirement ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}>
                                                                            XP: {userStats.total_xp}/{badge.xp_reward}
                                                                        </span>
                                                                    </div>
                                                                    <Progress value={progress} className="h-1.5" />
                                                                </div>
                                                            )}
                                                            {badge.level_required > 0 && (
                                                                <div className="text-xs">
                                                                    <span className={meetsLevelRequirement ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}>
                                                                        Level: {userStats.current_level}/{badge.level_required}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        
                                                        {canClaim && (
                                                            <Button
                                                                size="sm"
                                                                className="mt-2 w-full"
                                                                onClick={() => claimBadge(badge.id)}
                                                                disabled={claiming === badge.id}
                                                            >
                                                                {claiming === badge.id ? "Claiming..." : "Claim Badge"}
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )
                                })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}