import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import {
    Award,
    BookOpen,
    Settings,
    ArrowLeft,
    Upload,
} from "lucide-react"

interface UserProfile {
    id: string
    name: string
    username: string
    email: string
    bio?: string
    avatar_url?: string
    avatar_border?: string
    role: string
    created_at: string
}

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
    category: string
}

interface UserBadge extends Badge {
    earned_at: string
}

interface CourseProgress {
    course_id: string
    course_name: string
    progress: number
    lessons_completed: number
    total_lessons: number
}

const AVATAR_BORDERS = [
    { id: 'none', name: 'None', image: null },
    { id: 'Border 1', name: 'Border 1', image: '/images/avatar-border/avatar-4.png' },
    { id: 'Border 2', name: 'Border 2', image: '/images/avatar-border/avatar-1.png' },
    { id: 'Border 3', name: 'Border 3', image: '/images/avatar-border/avatar-5.png' },
    { id: 'Border 4', name: 'Border 4', image: '/images/avatar-border/avatar-6.png' },
]

export default function LearnerProfile() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
    const [userStats, setUserStats] = useState<UserStats | null>(null)
    const [badges, setBadges] = useState<UserBadge[]>([])
    const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([])
    const [loading, setLoading] = useState(true)
    const [isOwnProfile, setIsOwnProfile] = useState(false)
    const [showBorderSelector, setShowBorderSelector] = useState(false)
    const [updatingBorder, setUpdatingBorder] = useState(false)

    const getXPForLevel = (level: number) => {
        if (level <= 1) return 0
        let total = 0
        for (let k = 1; k < level; k++) {
            total += 60 + (k - 1) * 15
        }
        return total
    }

    useEffect(() => {
        fetchProfileData()
    }, [id])

    const fetchProfileData = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                navigate("/login")
                return
            }

            setIsOwnProfile(session.user.id === id)

            // Fetch user profile
            const { data: profile, error: profileError } = await supabase
                .from("users")
                .select("*")
                .eq("id", id)
                .single()

            if (profileError) throw profileError
            setUserProfile(profile)

            // Fetch user stats
            const { data: stats, error: statsError } = await supabase
                .from("user_stats")
                .select("*")
                .eq("user_id", id)
                .single()

            if (statsError) throw statsError
            setUserStats(stats)

            // Fetch badges
            const { data: badgesData, error: badgesError } = await supabase
                .from("user_badges")
                .select(`
                    earned_at,
                    badges (
                        id,
                        name,
                        description,
                        icon,
                        category
                    )
                `)
                .eq("user_id", id)

            if (badgesError) throw badgesError
            const badgesList = badgesData?.map((item: any) => ({
                ...item.badges,
                earned_at: item.earned_at
            })) || []
            setBadges(badgesList)

            // Fetch course progress
            const { data: enrollments, error: enrollError } = await supabase
                .from("course_enrollments")
                .select(`
                    course_id,
                    progress,
                    courses (
                        id,
                        title
                    )
                `)
                .eq("user_id", id)

            if (enrollError) throw enrollError

            // Get lesson counts for each course
            const courseProgressData = await Promise.all(
                (enrollments || []).map(async (enrollment: any) => {
                    const { data: lessons, error: lessonError } = await supabase
                        .from("lessons")
                        .select("id")
                        .eq("course_id", enrollment.course_id)

                    if (lessonError) throw lessonError

                    const { data: completed, error: completedError } = await supabase
                        .from("lesson_progress")
                        .select("id")
                        .eq("user_id", id)
                        .in("lesson_id", lessons?.map(l => l.id) || [])

                    if (completedError) throw completedError

                    return {
                        course_id: enrollment.course_id,
                        course_name: enrollment.courses.title,
                        progress: enrollment.progress || 0,
                        lessons_completed: completed?.length || 0,
                        total_lessons: lessons?.length || 0
                    }
                })
            )

            setCourseProgress(courseProgressData)

        } catch (error: any) {
            console.error("Error fetching profile:", error)
            toast.error("Error", {
                description: "Failed to load profile"
            })
        } finally {
            setLoading(false)
        }
    }

    const updateAvatarBorder = async (borderId: string) => {
        try {
            setUpdatingBorder(true)
            const { error } = await supabase
                .from("users")
                .update({ avatar_border: borderId === 'none' ? null : borderId })
                .eq("id", id)

            if (error) throw error

            setUserProfile(prev => prev ? { ...prev, avatar_border: borderId === 'none' ? undefined : borderId } : null)
            setShowBorderSelector(false)
            toast.success("Avatar border updated!")
        } catch (error: any) {
            console.error("Error updating border:", error)
            toast.error("Error", {
                description: "Failed to update avatar border"
            })
        } finally {
            setUpdatingBorder(false)
        }
    }

    const getProgressToNextLevel = () => {
        if (!userStats) return 0
        const xpForCurrentLevel = getXPForLevel(userStats.current_level)
        const xpForNextLevel = getXPForLevel(userStats.current_level + 1)
        const currentLevelXP = userStats.total_xp - xpForCurrentLevel
        const xpNeeded = xpForNextLevel - xpForCurrentLevel
        return Math.min((currentLevelXP / xpNeeded) * 100, 100)
    }

    const getSelectedBorderImage = () => {
        const border = AVATAR_BORDERS.find(b => b.id === userProfile?.avatar_border)
        return border?.image || undefined
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
                </div>
            </div>
        )
    }

    if (!userProfile || !userStats) {
        return (
            <div className="flex items-center justify-center h-96">
                <p className="text-gray-600 dark:text-gray-400">Profile not found</p>
            </div>
        )
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto py-6 px-4">
            {/* Back Button */}
            <Button
                variant="ghost"
                onClick={() => navigate(-1)}
                className="gap-2"
            >
                <ArrowLeft className="w-4 h-4" />
                Back
            </Button>

            {/* Profile Header - Instagram Style */}
            <div className="space-y-6">
                {/* Background Banner */}
                <div className="h-40 sm:h-48 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl shadow-lg"></div>

                {/* Profile Content */}
                <div className="px-4 sm:px-8">
                    {/* Avatar and Info */}
                    <div className="flex flex-col sm:flex-row gap-6 -mt-20">
                        {/* Avatar with Border Overlay */}
                        <div className="relative">
                            <div className="relative w-32 h-32 sm:w-40 sm:h-40">
                                <Avatar className="w-full h-full border-4 border-white dark:border-gray-900 shadow-lg">
                                    <AvatarImage src={userProfile.avatar_url || undefined} alt={userProfile.name} />
                                    <AvatarFallback className="bg-green-500 text-white font-bold text-4xl">
                                        {userProfile.name.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                {/* Avatar Border Overlay */}
                                {getSelectedBorderImage() && (
                                    <img
                                        src={getSelectedBorderImage() as string}
                                        alt="Avatar Border"
                                        className="absolute inset-0 w-full h-full pointer-events-none scale-150"
                                    />
                                )}
                            </div>
                            {isOwnProfile && (
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => setShowBorderSelector(true)}
                                    className="absolute bottom-0 right-0 rounded-full shadow-lg"
                                >
                                    <Upload className="w-3 h-3" />
                                </Button>
                            )}
                        </div>

                        {/* User Info */}
                        <div className="flex-1 flex flex-col justify-end">
                            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-1">
                                {userProfile.name}
                            </h1>
                            <p className="text-lg text-gray-600 dark:text-gray-400 mb-3">
                                @{userProfile.username}
                            </p>
                            {userProfile.bio && (
                                <p className="text-gray-700 dark:text-gray-300 mb-4 max-w-md">
                                    {userProfile.bio}
                                </p>
                            )}
                            {isOwnProfile && (
                                <Button size="sm" variant="outline" className="gap-2 w-fit">
                                    <Settings className="w-4 h-4" />
                                    Edit Profile
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-4 gap-3 sm:gap-4 mt-8 py-6 border-t border-gray-200 dark:border-gray-700">
                        <div className="text-center">
                            <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                                {userStats.current_level}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Level</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                                {(userStats.total_xp / 1000).toFixed(1)}K
                            </p>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">XP</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                                {userStats.badges_count}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Badges</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                                {userStats.leaderboard_rank ? `#${userStats.leaderboard_rank}` : 'N/A'}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Rank</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Level Progress */}
            <div className="px-4 sm:px-0 space-y-3">
                <div>
                    <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Level {userStats.current_level} → {userStats.current_level + 1}
                        </span>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {getProgressToNextLevel().toFixed(0)}%
                        </span>
                    </div>
                    <Progress value={getProgressToNextLevel()} className="h-2" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Total XP: <span className="font-bold text-gray-900 dark:text-white">{userStats.total_xp.toLocaleString()}</span>
                </p>
            </div>

            {/* Tabs Section */}
            <Tabs defaultValue="badges" className="w-full px-4 sm:px-0">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="badges" className="gap-2">
                        <Award className="w-4 h-4" />
                        <span className="hidden sm:inline">Badges</span>
                        <span className="text-xs">({badges.length})</span>
                    </TabsTrigger>
                    <TabsTrigger value="courses" className="gap-2">
                        <BookOpen className="w-4 h-4" />
                        <span className="hidden sm:inline">Courses</span>
                        <span className="text-xs">({courseProgress.length})</span>
                    </TabsTrigger>
                </TabsList>

                {/* Badges Tab */}
                <TabsContent value="badges" className="space-y-4">
                    <div className="space-y-2">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            Earned Badges
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {badges.length} achievement{badges.length !== 1 ? 's' : ''} unlocked
                        </p>
                    </div>

                    {badges.length === 0 ? (
                        <div className="text-center py-12">
                            <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500 dark:text-gray-400">
                                No badges earned yet
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {badges.map((badge) => (
                                <div
                                    key={badge.id}
                                    className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-xl hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-2xl flex-shrink-0">
                                            {badge.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                                                {badge.name}
                                            </h3>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                                {badge.description}
                                            </p>
                                            <div className="flex items-center justify-between mt-2">
                                                <Badge variant="secondary" className="text-xs capitalize">
                                                    {badge.category}
                                                </Badge>
                                                <span className="text-[10px] text-gray-500">
                                                    {new Date(badge.earned_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* Courses Tab */}
                <TabsContent value="courses" className="space-y-4">
                    <div className="space-y-2">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            Course Progress
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {courseProgress.length} course{courseProgress.length !== 1 ? 's' : ''} enrolled
                        </p>
                    </div>

                    {courseProgress.length === 0 ? (
                        <div className="text-center py-12">
                            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500 dark:text-gray-400">
                                No courses enrolled yet
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {courseProgress.map((course) => (
                                <div
                                    key={course.course_id}
                                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="font-semibold text-gray-900 dark:text-white flex-1">
                                            {course.course_name}
                                        </h3>
                                        <Badge variant="outline" className="text-xs ml-2">
                                            {course.progress}%
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                        {course.lessons_completed} of {course.total_lessons} lessons completed
                                    </p>
                                    <Progress value={course.progress} className="h-2" />
                                </div>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Avatar Border Selector Dialog */}
            <Dialog open={showBorderSelector} onOpenChange={setShowBorderSelector}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Choose Avatar Border</DialogTitle>
                        <DialogDescription>
                            Select a border style to customize your profile avatar
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-4">
                        {AVATAR_BORDERS.map((border) => (
                            <button
                                key={border.id}
                                onClick={() => updateAvatarBorder(border.id)}
                                disabled={updatingBorder}
                                className={`p-3 rounded-lg border-2 transition-all ${userProfile?.avatar_border === border.id || (border.id === 'none' && !userProfile?.avatar_border)
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                {border.image ? (
                                    <div className="relative w-32 h-32 mx-auto">
                                        <Avatar className="w-full h-full border-2 border-gray-400">
                                            <AvatarFallback className="bg-green-500 text-white font-bold text-3xl">
                                                {userProfile.name.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <img
                                            src={border.image}
                                            alt={border.name}
                                            className="absolute inset-0 w-full h-full pointer-events-none scale-150"
                                        />
                                    </div>
                                ) : (
                                    <div className="w-32 h-32 mx-auto">
                                        <Avatar className="w-full h-full border-2 border-gray-400">
                                            <AvatarFallback className="bg-green-500 text-white font-bold text-3xl">
                                                {userProfile.name.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                    </div>
                                )}
                                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mt-2 text-center">
                                    {border.name}
                                </p>
                            </button>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}