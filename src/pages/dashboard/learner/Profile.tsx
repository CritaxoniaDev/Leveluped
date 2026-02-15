import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { supabase } from "@/packages/supabase/supabase"
import { Badge } from "@/packages/shadcn/ui/badge"
import { Button } from "@/packages/shadcn/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/packages/shadcn/ui/avatar"
import { Progress } from "@/packages/shadcn/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/packages/shadcn/ui/tabs"
import { Input } from "@/packages/shadcn/ui/input"
import { Textarea } from "@/packages/shadcn/ui/textarea"
import { Label } from "@/packages/shadcn/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/packages/shadcn/ui/dialog"
import { toast } from "sonner"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/packages/shadcn/ui/tooltip"
import {
    Award,
    BookOpen,
    Settings,
    ArrowLeft,
    Upload,
    Camera,
    MessageCircle,
    Heart,
    Lock,
    Crown,
} from "lucide-react"
import { checkUserPremium } from "@/services/StripeService"

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
    { id: 'Border 1', name: 'Neon Splash Ring', image: '/images/avatar-border/avatar-4.png' },
    { id: 'Border 2', name: 'Candy Pop Celebration', image: '/images/avatar-border/avatar-1.png' },
    { id: 'Border 3', name: 'Dreamy Cloud Garden', image: '/images/avatar-border/avatar-5.png' },
    { id: 'Border 4', name: 'Royal Victory Crest', image: '/images/avatar-border/avatar-6.png' },
    { id: 'Border 5', name: 'Bunny Meadow Frame', image: '/images/avatar-border/avatar-8.png' },
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
    const [uploadingAvatar, setUploadingAvatar] = useState(false)
    const [showAvatarDialog, setShowAvatarDialog] = useState(false)
    const [showEditProfile, setShowEditProfile] = useState(false)
    const [editingName, setEditingName] = useState("")
    const [editingBio, setEditingBio] = useState("")
    const [savingProfile, setSavingProfile] = useState(false)
    const [isPremium, setIsPremium] = useState(false)

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

            // Check premium status if it's their own profile
            if (session.user.id === id) {
                const hasPremium = await checkUserPremium(session.user.id)
                setIsPremium(hasPremium)
            }

            // Fetch user profile
            const { data: profile, error: profileError } = await supabase
                .from("users")
                .select("*")
                .eq("id", id)
                .single()

            if (profileError) throw profileError
            setUserProfile(profile)
            setEditingName(profile.name || "")
            setEditingBio(profile.bio || "")

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

            // Fetch course progress using enrollments and resource_attempts
            const { data: enrollments, error: enrollError } = await supabase
                .from("enrollments")
                .select(`
                course_id,
                progress_percentage,
                courses (
                    id,
                    title
                )
            `)
                .eq("user_id", id)

            if (enrollError) throw enrollError

            // Get resource content counts for each course
            const courseProgressData = await Promise.all(
                (enrollments || []).map(async (enrollment: any) => {
                    // Get all resource content (quizzes and challenges) for the course
                    const { data: resourceContent, error: resourceError } = await supabase
                        .from("resource_content")
                        .select("id")
                        .eq("course_id", enrollment.course_id)
                        .eq("status", "published")

                    if (resourceError) throw resourceError

                    // Get completed resource attempts
                    const { data: completedAttempts, error: completedError } = await supabase
                        .from("resource_attempts")
                        .select("id")
                        .eq("user_id", id)
                        .in("resource_content_id", resourceContent?.map(r => r.id) || [])
                        .eq("status", "completed")

                    if (completedError) throw completedError

                    // Also get elearning progress
                    const { data: elearningProgress, error: elearningError } = await supabase
                        .from("elearning_progress")
                        .select("id")
                        .eq("user_id", id)

                    if (elearningError) throw elearningError

                    const totalResources = (resourceContent?.length || 0) + (elearningProgress?.length || 0)
                    const completedResources = (completedAttempts?.length || 0) + (elearningProgress?.filter((ep: any) => ep.completed_at) || []).length

                    return {
                        course_id: enrollment.course_id,
                        course_name: enrollment.courses.title,
                        progress: enrollment.progress_percentage || 0,
                        lessons_completed: completedResources,
                        total_lessons: totalResources || 1
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

    const handleSaveProfile = async () => {
        if (!editingName.trim()) {
            toast.error("Validation Error", {
                description: "Name cannot be empty"
            })
            return
        }

        try {
            setSavingProfile(true)

            const { error } = await supabase
                .from("users")
                .update({
                    name: editingName.trim(),
                    bio: editingBio.trim() || null
                })
                .eq("id", id)

            if (error) throw error

            setUserProfile(prev => prev ? {
                ...prev,
                name: editingName.trim(),
                bio: editingBio.trim() || undefined
            } : null)

            setShowEditProfile(false)
            toast.success("Profile updated!", {
                description: "Your profile has been saved successfully"
            })
        } catch (error: any) {
            console.error("Error updating profile:", error)
            toast.error("Error", {
                description: "Failed to update profile"
            })
        } finally {
            setSavingProfile(false)
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

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            const file = event.target.files?.[0]
            if (!file) return

            if (!file.type.startsWith('image/')) {
                toast.error("Invalid file", {
                    description: "Please upload an image file"
                })
                return
            }

            if (file.size > 5 * 1024 * 1024) {
                toast.error("File too large", {
                    description: "Maximum file size is 5MB"
                })
                return
            }

            setUploadingAvatar(true)

            if (userProfile?.avatar_url) {
                const oldFileName = userProfile.avatar_url.split('/').pop()
                if (oldFileName) {
                    await supabase.storage
                        .from('profile_pictures')
                        .remove([`${id}/${oldFileName}`])
                }
            }

            const fileName = `${Date.now()}_${file.name}`
            const { error: uploadError } = await supabase.storage
                .from('profile_pictures')
                .upload(`${id}/${fileName}`, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('profile_pictures')
                .getPublicUrl(`${id}/${fileName}`)

            const { error: updateError } = await supabase
                .from('users')
                .update({ avatar_url: publicUrl })
                .eq('id', id)

            if (updateError) throw updateError

            setUserProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null)
            setShowAvatarDialog(false)
            toast.success("Avatar updated!", {
                description: "Your profile picture has been changed"
            })
        } catch (error: any) {
            console.error("Error uploading avatar:", error)
            toast.error("Upload failed", {
                description: error.message || "Failed to upload profile picture"
            })
        } finally {
            setUploadingAvatar(false)
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

    const handleBorderClick = () => {
        if (!isOwnProfile) {
            toast.error("Not your profile", {
                description: "You can only change your own avatar border"
            })
            return
        }

        setShowBorderSelector(true)
    }

    const handleBorderSelect = async (borderId: string) => {
        if (!isPremium) {
            toast.error("Premium required", {
                description: "Upgrade to premium to unlock avatar borders"
            })
            return
        }

        await updateAvatarBorder(borderId)
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
                            <div className="relative w-32 h-32 sm:w-40 sm:h-40 group">
                                <Avatar className="w-full h-full border-4 border-white dark:border-gray-900 shadow-lg">
                                    <AvatarImage src={userProfile?.avatar_url || undefined} alt={userProfile?.name} />
                                    <AvatarFallback className="bg-green-500 text-white font-bold text-4xl">
                                        {userProfile?.name.charAt(0).toUpperCase()}
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
                                {isOwnProfile && (
                                    <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Camera className="w-6 h-6 text-white" />
                                    </div>
                                )}
                            </div>
                            <div className="absolute bottom-0 right-0 flex gap-2">
                                {isOwnProfile && (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    onClick={() => setShowAvatarDialog(true)}
                                                    className="rounded-full shadow-lg"
                                                >
                                                    <Camera className="w-3 h-3" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent side="top">
                                                Upload Profile Picture
                                            </TooltipContent>
                                        </Tooltip>

                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    size="sm"
                                                    variant={isPremium ? "secondary" : "outline"}
                                                    onClick={handleBorderClick}
                                                    className={`rounded-full shadow-lg`}
                                                >
                                                    <Upload className="w-3 h-3" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent side="top">
                                                Change Avatar Border
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                )}
                            </div>
                        </div>

                        {/* User Info */}
                        <div className="flex-1 flex flex-col justify-end mt-14">
                            {/* Name and Username */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <h1 className="text-3xl sm:text-5xl font-bold">
                                        {userProfile?.name}
                                    </h1>
                                    {isPremium && isOwnProfile && (
                                        <Badge className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border border-purple-300 dark:border-purple-700 flex items-center gap-1">
                                            <Crown className="w-3 h-3" />
                                            <span>Premium</span>
                                        </Badge>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 font-medium">
                                        @{userProfile?.username}
                                    </p>
                                </div>
                            </div>

                            {/* Bio Section */}
                            {userProfile?.bio && (
                                <div className="space-y-2">
                                    <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed max-w-2xl">
                                        {userProfile.bio}
                                    </p>
                                </div>
                            )}

                            {!userProfile?.bio && (
                                <div className="text-sm text-gray-500 dark:text-gray-500 italic mb-2">
                                    No bio added yet
                                    {isOwnProfile && " — Add one to share more about yourself"}
                                </div>
                            )}

                            {/* Action Buttons */}
                            {isOwnProfile && (
                                <div className="flex flex-wrap gap-2 mt-4">
                                    <Button
                                        size="sm"
                                        className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                                        onClick={() => setShowEditProfile(true)}
                                    >
                                        <Settings className="w-4 h-4" />
                                        Edit Profile
                                    </Button>
                                </div>
                            )}

                            {!isOwnProfile && (
                                <div className="flex flex-wrap gap-2 pt-2">
                                    <Button size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                                        <MessageCircle className="w-4 h-4" />
                                        Message
                                    </Button>
                                    <Button size="sm" variant="outline" className="gap-2">
                                        <Heart className="w-4 h-4" />
                                        Follow
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-4 gap-3 sm:gap-4 mt-8 py-6 border-t border-gray-200 dark:border-gray-700">
                        <div className="text-center">
                            <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                                {userStats?.current_level}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Level</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                                {userStats ? (userStats.total_xp / 1000).toFixed(1) : 0}K
                            </p>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">XP</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                                {userStats?.badges_count}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Badges</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                                {userStats?.leaderboard_rank ? `#${userStats.leaderboard_rank}` : 'N/A'}
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

            {/* Avatar Upload Dialog */}
            <Dialog open={showAvatarDialog} onOpenChange={setShowAvatarDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Upload Profile Picture</DialogTitle>
                        <DialogDescription>
                            Choose an image to set as your profile picture. Maximum file size: 5MB
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
                            <label className="flex flex-col items-center justify-center cursor-pointer h-48">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <Upload className="w-10 h-10 text-gray-400 mb-2" />
                                    <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                                        <span className="font-semibold">Click to upload</span> or drag and drop
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        PNG, JPG, GIF up to 5MB
                                    </p>
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAvatarUpload}
                                    disabled={uploadingAvatar}
                                    className="hidden"
                                />
                            </label>
                        </div>

                        {uploadingAvatar && (
                            <div className="flex items-center justify-center gap-2">
                                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Uploading...</p>
                            </div>
                        )}

                        <Button
                            onClick={() => setShowAvatarDialog(false)}
                            variant="outline"
                            className="w-full"
                            disabled={uploadingAvatar}
                        >
                            Cancel
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Avatar Border Selector Dialog */}
            <Dialog open={showBorderSelector} onOpenChange={setShowBorderSelector}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Choose Avatar Border</DialogTitle>
                        <DialogDescription>
                            {isPremium
                                ? "Select a border style to customize your profile avatar"
                                : "Avatar borders are a premium feature. Upgrade to unlock all avatar customization options"}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 my-6">
                        {AVATAR_BORDERS.map((border) => (
                            <button
                                key={border.id}
                                onClick={() => handleBorderSelect(border.id)}
                                disabled={updatingBorder || (!isPremium && border.id !== 'none')}
                                className={`p-4 rounded-lg border-2 transition-all relative group ${userProfile?.avatar_border === border.id ||
                                        (border.id === 'none' && !userProfile?.avatar_border)
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                                    } ${!isPremium && border.id !== 'none' ? 'opacity-60 cursor-not-allowed' : ''}`}
                            >
                                {/* Avatar with actual profile image */}
                                <div className="relative w-24 h-24 sm:w-32 sm:h-32 mx-auto">
                                    <Avatar className="w-full h-full border-4 border-white dark:border-gray-900 shadow-md">
                                        <AvatarImage
                                            src={userProfile?.avatar_url || undefined}
                                            alt={userProfile?.name}
                                        />
                                        <AvatarFallback className="bg-green-500 text-white font-bold text-2xl sm:text-3xl">
                                            {userProfile?.name.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>

                                    {/* Border Overlay Preview */}
                                    {border.image && (
                                        <img
                                            src={border.image}
                                            alt={border.name}
                                            className="absolute inset-0 w-full h-full pointer-events-none scale-150"
                                        />
                                    )}

                                    {/* Premium Lock Overlay */}
                                    {!isPremium && border.id !== 'none' && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full group-hover:bg-black/50 transition-colors">
                                            <Lock className="w-6 h-6 text-white" />
                                        </div>
                                    )}
                                </div>

                                {/* Border Name */}
                                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mt-3 text-center">
                                    {border.name}
                                </p>
                            </button>
                        ))}
                    </div>

                    {!isPremium && (
                        <div className="p-4 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-lg text-center space-y-3">
                            <div className="flex items-center justify-center gap-2">
                                <Crown className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                <p className="text-sm font-semibold text-purple-700 dark:text-purple-400">
                                    Unlock Avatar Borders
                                </p>
                            </div>
                            <p className="text-xs text-purple-600 dark:text-purple-400">
                                Upgrade to premium to customize your avatar with exclusive borders and frames
                            </p>
                            <Button
                                onClick={() => {
                                    setShowBorderSelector(false)
                                    navigate("/dashboard/learner/premium")
                                }}
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                            >
                                <Crown className="w-4 h-4 mr-2" />
                                Upgrade to Premium
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Edit Profile Dialog */}
            <Dialog open={showEditProfile} onOpenChange={setShowEditProfile}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader className="flex flex-row items-center justify-between">
                        <DialogTitle>Edit Profile</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* Name Field */}
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-sm font-medium">
                                Full Name
                            </Label>
                            <Input
                                id="name"
                                type="text"
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                placeholder="Enter your name"
                                maxLength={100}
                                readOnly
                                className="w-full text-gray-400 cursor-not-allowed"
                            />
                            <p className="text-xs text-gray-500">
                                {editingName.length}/100 characters
                            </p>
                        </div>

                        {/* Bio Field */}
                        <div className="space-y-2">
                            <Label htmlFor="bio" className="text-sm font-medium">
                                Bio
                            </Label>
                            <Textarea
                                id="bio"
                                value={editingBio}
                                onChange={(e) => setEditingBio(e.target.value)}
                                placeholder="Tell us about yourself... (optional)"
                                maxLength={500}
                                rows={4}
                                className="w-full resize-none"
                            />
                            <p className="text-xs text-gray-500">
                                {editingBio.length}/500 characters
                            </p>
                        </div>

                        {/* Info Text */}
                        <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <p className="text-xs text-blue-700 dark:text-blue-400">
                                Keep your bio friendly and professional. Avoid sharing personal information like phone numbers or addresses.
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowEditProfile(false)
                                    setEditingName(userProfile?.name || "")
                                    setEditingBio(userProfile?.bio || "")
                                }}
                                className="flex-1"
                                disabled={savingProfile}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSaveProfile}
                                disabled={savingProfile}
                                className="flex-1 bg-blue-600 hover:bg-blue-700"
                            >
                                {savingProfile ? (
                                    <>
                                        <div className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        Saving...
                                    </>
                                ) : (
                                    "Save Changes"
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}