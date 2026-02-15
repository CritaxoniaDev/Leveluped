import { useEffect, useState } from "react"
import { supabase } from "@/packages/supabase/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/packages/shadcn/ui/card"
import { Badge } from "@/packages/shadcn/ui/badge"
import { Progress } from "@/packages/shadcn/ui/progress"
import { Button } from "@/packages/shadcn/ui/button"
import { Trophy, Star, Award, Target, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import {
    checkAllAchievements,
    awardBadge
} from "@/helpers/achievementHelper"

interface UserStats {
    total_xp: number
    current_level: number
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

interface QuestRequirements {
    lessonsCompleted?: number
    coursesEnrolled?: number
    coursesCompleted?: number
    quizzesCompleted?: number
    perfectScores?: number
    streakDays?: number
    totalXP?: number
    challengesCompleted?: number
}

export default function Achievements() {
    const [userStats, setUserStats] = useState<UserStats>({
        total_xp: 0,
        current_level: 1
    })
    const [earnedBadges, setEarnedBadges] = useState<UserBadge[]>([])
    const [availableBadges, setAvailableBadges] = useState<Badge[]>([])
    const [loading, setLoading] = useState(true)
    const [claiming, setClaiming] = useState<string | null>(null)
    const [recheckingAchievements, setRecheckingAchievements] = useState(false)
    const [questProgress, setQuestProgress] = useState<QuestRequirements>({})

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

    const fetchQuestProgress = async (userId: string) => {
        try {
            // Fetch lessons completed
            const { data: lessonsData } = await supabase
                .from("elearning_progress")
                .select("id")
                .eq("user_id", userId)
                .not("completed_at", "is", null)

            // Fetch courses enrolled
            const { data: enrollmentsData } = await supabase
                .from("enrollments")
                .select("id")
                .eq("user_id", userId)

            // Fetch completed courses
            const { data: completedCoursesData } = await supabase
                .from("enrollments")
                .select("id")
                .eq("user_id", userId)
                .not("completed_at", "is", null)

            setQuestProgress({
                lessonsCompleted: lessonsData?.length || 0,
                coursesEnrolled: enrollmentsData?.length || 0,
                coursesCompleted: completedCoursesData?.length || 0,
                totalXP: userStats.total_xp
            })
        } catch (error) {
            console.error("Error fetching quest progress:", error)
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
            setLoading(true)
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            // Use maybeSingle to avoid error when no rows
            let { data: stats, error: statsError } = await supabase
                .from("user_stats")
                .select("total_xp, current_level")
                .eq("user_id", session.user.id)
                .maybeSingle()

            // Check for error first
            if (statsError) {
                console.error("Error fetching user stats:", statsError)
                return
            }

            // If no stats exist, create them using upsert to avoid duplicate key errors
            if (!stats) {
                console.log("No user_stats found, creating new record...")
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
                    // Try to fetch again in case another component created it
                    const { data: retryStats } = await supabase
                        .from("user_stats")
                        .select("total_xp, current_level")
                        .eq("user_id", session.user.id)
                        .single()

                    if (retryStats) {
                        stats = retryStats
                    } else {
                        return
                    }
                } else {
                    stats = newStats
                }
            }

            // At this point, stats is guaranteed to not be null
            if (!stats) {
                console.error("Stats is still null after creation attempt")
                return
            }

            // Calculate correct level based on XP
            const correctLevel = getLevelFromXP(stats.total_xp)
            if (correctLevel !== stats.current_level) {
                // Update level in DB
                await supabase
                    .from("user_stats")
                    .update({ current_level: correctLevel })
                    .eq("user_id", session.user.id)

                stats.current_level = correctLevel
            }

            setUserStats({
                total_xp: stats.total_xp,
                current_level: stats.current_level
            })

            // Fetch quest progress
            await fetchQuestProgress(session.user.id)

            // Fetch all badges
            const { data: allBadges, error: badgesError } = await supabase
                .from("badges")
                .select("*")
                .order("level_required", { ascending: true })

            if (badgesError) {
                console.error("Error fetching badges:", badgesError)
                return
            }

            // Fetch user's earned badges
            const { data: userBadges, error: userBadgesError } = await supabase
                .from("user_badges")
                .select("badge_id, earned_at")
                .eq("user_id", session.user.id)

            if (userBadgesError) {
                console.error("Error fetching user badges:", userBadgesError)
                return
            }

            const earnedBadgeIds = new Set(userBadges?.map(ub => ub.badge_id) || [])

            // Separate earned and available badges
            const earned: UserBadge[] = []
            const available: Badge[] = []

            allBadges?.forEach(badge => {
                if (earnedBadgeIds.has(badge.id)) {
                    const userBadge = userBadges?.find(ub => ub.badge_id === badge.id)
                    earned.push({
                        ...badge,
                        earned_at: userBadge?.earned_at || ""
                    })
                } else {
                    available.push(badge)
                }
            })

            setEarnedBadges(earned)
            setAvailableBadges(available)

        } catch (error) {
            console.error("Error fetching achievements:", error)
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
                // Update local state immediately for better UX
                if (result.newXP !== undefined && result.newLevel !== undefined) {
                    setUserStats({
                        total_xp: result.newXP,
                        current_level: result.newLevel
                    })
                }

                // Refresh data from database
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

    const getQuestRequirementInfo = (badge: Badge): { requirementText: string; isMet: boolean; progress?: number } => {
        // Level-based badges
        if (badge.level_required > 0 && badge.xp_reward === 0) {
            return {
                requirementText: `Reach Level ${badge.level_required}`,
                isMet: userStats.current_level >= badge.level_required,
                progress: Math.min((userStats.current_level / badge.level_required) * 100, 100)
            }
        }

        // Milestone badges (XP-based)
        if (badge.category === 'milestone') {
            const xpRequirements: { [key: string]: number } = {
                'XP Hunter': 1000,
                'XP Collector': 5000,
                'XP Master': 10000,
                'XP Legend': 25000
            }
            const required = xpRequirements[badge.name] || 0
            return {
                requirementText: `Earn ${required.toLocaleString()} XP`,
                isMet: userStats.total_xp >= required,
                progress: Math.min((userStats.total_xp / required) * 100, 100)
            }
        }

        // Course completion badges
        if (badge.name.includes('Course')) {
            const completionRequirements: { [key: string]: number } = {
                'Course Rookie': 1,
                'Course Veteran': 5,
                'Course Master': 10,
                'Course Legend': 25
            }
            const required = completionRequirements[badge.name] || 0
            return {
                requirementText: `Complete ${required} course${required > 1 ? 's' : ''}`,
                isMet: questProgress.coursesCompleted ? questProgress.coursesCompleted >= required : false,
                progress: questProgress.coursesCompleted ? Math.min((questProgress.coursesCompleted / required) * 100, 100) : 0
            }
        }

        // Course enrollment badges
        if (badge.name.includes('First Course Enrollment') || badge.name === 'Explorer' || badge.name === 'Adventurer') {
            const enrollmentRequirements: { [key: string]: number } = {
                'First Course Enrollment': 1,
                'Explorer': 3,
                'Adventurer': 10
            }
            const required = enrollmentRequirements[badge.name] || 0
            return {
                requirementText: `Enroll in ${required} course${required > 1 ? 's' : ''}`,
                isMet: questProgress.coursesEnrolled ? questProgress.coursesEnrolled >= required : false,
                progress: questProgress.coursesEnrolled ? Math.min((questProgress.coursesEnrolled / required) * 100, 100) : 0
            }
        }

        // Badge collection badges
        if (badge.name.includes('Badge')) {
            const badgeRequirements: { [key: string]: number } = {
                'Badge Collector': 10,
                'Badge Hunter': 25,
                'Badge Legend': 50
            }
            const required = badgeRequirements[badge.name] || 0
            return {
                requirementText: `Earn ${required} badges`,
                isMet: earnedBadges.length >= required,
                progress: Math.min((earnedBadges.length / required) * 100, 100)
            }
        }

        // Lesson completion
        if (badge.name === 'First Steps') {
            return {
                requirementText: 'Complete your first lesson',
                isMet: questProgress.lessonsCompleted ? questProgress.lessonsCompleted >= 1 : false,
                progress: questProgress.lessonsCompleted ? 100 : 0
            }
        }

        // Achievement quests without specific progress tracking
        return {
            requirementText: badge.description,
            isMet: false
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
        <div className="space-y-6 py-6 px-10">
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                            Out of {availableBadges.length + earnedBadges.length} available
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
                                                {badge.icon}
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
                        Available Badges ({availableBadges.length})
                    </CardTitle>
                    <CardDescription>
                        Badges you can still unlock
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {availableBadges.length === 0 ? (
                        <div className="text-center py-8">
                            <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                            <p className="text-gray-500 dark:text-gray-400">
                                Congratulations! You've earned all available badges! 🎉
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {availableBadges.map((badge) => {
                                const requirement = getQuestRequirementInfo(badge)
                                const canClaim = requirement.isMet
                                const progress = requirement.progress || 0

                                return (
                                    <Card key={badge.id} className={canClaim ? "border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/20" : "opacity-60"}>
                                        <CardContent className="p-4">
                                            <div className="flex items-start gap-3">
                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0 ${canClaim ? 'bg-gradient-to-br from-yellow-300 to-orange-400' : 'bg-gray-300 dark:bg-gray-600'}`}>
                                                    {badge.icon}
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
                                                                +{badge.xp_reward} XP
                                                            </Badge>
                                                        )}
                                                        <Badge variant="outline" className="text-xs capitalize">
                                                            {badge.category}
                                                        </Badge>
                                                    </div>

                                                    {/* Quest Requirements */}
                                                    <div className="mt-2 space-y-1">
                                                        <div>
                                                            <div className="flex justify-between text-xs mb-1">
                                                                <span className={requirement.isMet ? 'text-green-600 dark:text-green-400 font-semibold' : 'text-gray-600 dark:text-gray-400'}>
                                                                    {requirement.requirementText}
                                                                </span>
                                                            </div>
                                                            {requirement.progress !== undefined && (
                                                                <Progress value={progress} className="h-1.5" />
                                                            )}
                                                        </div>
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