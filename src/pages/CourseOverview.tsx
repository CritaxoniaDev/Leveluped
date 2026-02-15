import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/packages/supabase/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/packages/shadcn/ui/card"
import { Button } from "@/packages/shadcn/ui/button"
import { Badge } from "@/packages/shadcn/ui/badge"
import { toast } from "sonner"
import { ArrowLeft, BookOpen, Trophy, Users, Clock, Globe, Star, Award, Target } from "lucide-react"

interface Course {
    id: string
    title: string
    description: string
    category: string
    image_url: string
    levels: number
    max_xp: number
    instructor_name: string
    leaderboard_enabled: boolean
    badges_enabled: boolean
    quests_enabled: boolean
    premium_enabled: boolean
    status: "draft" | "published" | "archived"
    created_at: string
    updated_at: string
    city_name?: string
    country_name?: string
}

interface CourseStats {
    total_enrollments: number
    total_completed: number
    average_rating: number
}

export default function CourseOverview() {
    const navigate = useNavigate()
    const [course, setCourse] = useState<Course | null>(null)
    const [stats, setStats] = useState<CourseStats | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchCourseOverview()
    }, [])

    const fetchCourseOverview = async () => {
        try {
            setLoading(true)

            // Fetch the first published course (or featured course)
            const { data: courseData, error: courseError } = await supabase
                .from("courses")
                .select(`
                    id,
                    title,
                    description,
                    category,
                    image_url,
                    levels,
                    max_xp,
                    leaderboard_enabled,
                    badges_enabled,
                    quests_enabled,
                    premium_enabled,
                    status,
                    created_at,
                    updated_at,
                    city_name,
                    users (
                        name
                    ),
                    countries_levels (
                        country_name
                    )
                `)
                .eq("status", "published")
                .order("created_at", { ascending: false })
                .limit(1)
                .single()

            if (courseError) {
                toast.error("No Courses Available", {
                    description: "There are no published courses at the moment"
                })
                navigate("/")
                return
            }

            setCourse({
                id: courseData.id,
                title: courseData.title,
                description: courseData.description,
                category: courseData.category,
                image_url: courseData.image_url,
                levels: courseData.levels,
                max_xp: courseData.max_xp,
                instructor_name: (courseData.users as any)?.name || "Unknown Instructor",
                leaderboard_enabled: courseData.leaderboard_enabled,
                badges_enabled: courseData.badges_enabled,
                quests_enabled: courseData.quests_enabled,
                premium_enabled: courseData.premium_enabled,
                status: courseData.status,
                created_at: courseData.created_at,
                updated_at: courseData.updated_at,
                city_name: courseData.city_name,
                country_name: (courseData.countries_levels as any)?.country_name
            })

            // Fetch course stats
            const { data: enrollments } = await supabase
                .from("enrollments")
                .select("id, progress_percentage")
                .eq("course_id", courseData.id)

            const completedCount = enrollments?.filter(e => e.progress_percentage === 100).length || 0
            const totalEnrollments = enrollments?.length || 0

            setStats({
                total_enrollments: totalEnrollments,
                total_completed: completedCount,
                average_rating: 4.5
            })

        } catch (error: any) {
            console.error("Error fetching course:", error)
            toast.error("Error", {
                description: "Failed to load course"
            })
            navigate("/")
        } finally {
            setLoading(false)
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        })
    }

    const getDifficultyLevel = (levels: number) => {
        if (levels <= 5) return "Beginner"
        if (levels <= 15) return "Intermediate"
        if (levels <= 30) return "Advanced"
        return "Expert"
    }

    const completionRate = stats && stats.total_enrollments > 0
        ? Math.round((stats.total_completed / stats.total_enrollments) * 100)
        : 0

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-white dark:bg-[#0a0a0a]">
                <div className="text-center">
                    <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading course...</p>
                </div>
            </div>
        )
    }

    if (!course) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-white dark:bg-[#0a0a0a]">
                <p className="text-gray-600 dark:text-gray-400">Course not found</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
            {/* Header */}
            <div className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <Button
                        variant="ghost"
                        onClick={() => navigate(-1)}
                        className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                </div>
            </div>

            {/* Hero Section */}
            <div className="relative h-96 overflow-hidden">
                <img
                    src={course.image_url || "/placeholder-course.jpg"}
                    alt={course.title}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-gray-900/20 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-8">
                    <div className="max-w-6xl mx-auto">
                        <Badge className="mb-4 bg-blue-600 hover:bg-blue-700 capitalize">
                            {course.category}
                        </Badge>
                        <h1 className="text-5xl font-bold text-white mb-4">
                            {course.title}
                        </h1>
                        <p className="text-xl text-gray-100 max-w-2xl">
                            {course.description}
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Course Details */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Course Stats Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
                                <CardContent className="p-6 text-center">
                                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                                        {course.levels}
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Levels</p>
                                </CardContent>
                            </Card>

                            <Card className="border-0 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
                                <CardContent className="p-6 text-center">
                                    <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
                                        {course.max_xp.toLocaleString()}
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Max XP</p>
                                </CardContent>
                            </Card>

                            <Card className="border-0 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
                                <CardContent className="p-6 text-center">
                                    <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                                        {stats?.total_enrollments || 0}
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Enrolled</p>
                                </CardContent>
                            </Card>

                            <Card className="border-0 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
                                <CardContent className="p-6 text-center">
                                    <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-1">
                                        {completionRate}%
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Completion</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Course Information */}
                        <Card className="border-0 shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BookOpen className="w-5 h-5" />
                                    About This Course
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {course.description}
                                </p>

                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold mb-1">
                                            Difficulty Level
                                        </p>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {getDifficultyLevel(course.levels)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold mb-1">
                                            Course Created
                                        </p>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {formatDate(course.created_at)}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Instructor Info */}
                        <Card className="border-0 shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="w-5 h-5" />
                                    Instructor
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                                        {course.instructor_name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                            {course.instructor_name}
                                        </p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Course Instructor
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Features */}
                        <Card className="border-0 shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Trophy className="w-5 h-5" />
                                    Course Features
                                </CardTitle>
                                <CardDescription>
                                    This course includes the following gamification features
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                            course.leaderboard_enabled
                                                ? 'bg-blue-100 dark:bg-blue-900/30'
                                                : 'bg-gray-200 dark:bg-gray-700'
                                        }`}>
                                            <Target className={`w-5 h-5 ${
                                                course.leaderboard_enabled
                                                    ? 'text-blue-600 dark:text-blue-400'
                                                    : 'text-gray-400'
                                            }`} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                                Leaderboard
                                            </p>
                                            <p className={`text-xs ${
                                                course.leaderboard_enabled
                                                    ? 'text-blue-600 dark:text-blue-400'
                                                    : 'text-gray-500 dark:text-gray-400'
                                            }`}>
                                                {course.leaderboard_enabled ? 'Enabled' : 'Disabled'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                            course.badges_enabled
                                                ? 'bg-purple-100 dark:bg-purple-900/30'
                                                : 'bg-gray-200 dark:bg-gray-700'
                                        }`}>
                                            <Award className={`w-5 h-5 ${
                                                course.badges_enabled
                                                    ? 'text-purple-600 dark:text-purple-400'
                                                    : 'text-gray-400'
                                            }`} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                                Badges
                                            </p>
                                            <p className={`text-xs ${
                                                course.badges_enabled
                                                    ? 'text-purple-600 dark:text-purple-400'
                                                    : 'text-gray-500 dark:text-gray-400'
                                            }`}>
                                                {course.badges_enabled ? 'Enabled' : 'Disabled'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                            course.quests_enabled
                                                ? 'bg-green-100 dark:bg-green-900/30'
                                                : 'bg-gray-200 dark:bg-gray-700'
                                        }`}>
                                            <Trophy className={`w-5 h-5 ${
                                                course.quests_enabled
                                                    ? 'text-green-600 dark:text-green-400'
                                                    : 'text-gray-400'
                                            }`} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                                Quests
                                            </p>
                                            <p className={`text-xs ${
                                                course.quests_enabled
                                                    ? 'text-green-600 dark:text-green-400'
                                                    : 'text-gray-500 dark:text-gray-400'
                                            }`}>
                                                {course.quests_enabled ? 'Enabled' : 'Disabled'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                            course.premium_enabled
                                                ? 'bg-yellow-100 dark:bg-yellow-900/30'
                                                : 'bg-gray-200 dark:bg-gray-700'
                                        }`}>
                                            <Star className={`w-5 h-5 ${
                                                course.premium_enabled
                                                    ? 'text-yellow-600 dark:text-yellow-400'
                                                    : 'text-gray-400'
                                            }`} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                                Premium
                                            </p>
                                            <p className={`text-xs ${
                                                course.premium_enabled
                                                    ? 'text-yellow-600 dark:text-yellow-400'
                                                    : 'text-gray-500 dark:text-gray-400'
                                            }`}>
                                                {course.premium_enabled ? 'Enabled' : 'Disabled'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Location Info */}
                        <Card className="border-0 shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Globe className="w-5 h-5" />
                                    Location
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2">
                                    <p className="text-gray-700 dark:text-gray-300">
                                        <span className="font-semibold">{course.city_name}</span>
                                        {course.country_name && (
                                            <>
                                                , <span className="font-semibold">{course.country_name}</span>
                                            </>
                                        )}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Enrollment Card */}
                    <div className="lg:col-span-1">
                        <Card className="border-0 shadow-lg sticky top-24">
                            <CardContent className="p-6 space-y-6">
                                {/* Rating */}
                                <div className="text-center">
                                    <div className="flex items-center justify-center gap-1 mb-2">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                className={`w-5 h-5 ${
                                                    i < Math.floor(stats?.average_rating || 0)
                                                        ? 'fill-yellow-400 text-yellow-400'
                                                        : 'text-gray-300 dark:text-gray-600'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {stats?.average_rating.toFixed(1)} out of 5
                                    </p>
                                </div>

                                {/* Enrollment Stats */}
                                <div className="space-y-3 py-4 border-t border-b border-gray-200 dark:border-gray-700">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">Students Enrolled</span>
                                        <span className="font-semibold text-gray-900 dark:text-white">
                                            {stats?.total_enrollments || 0}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">Completion Rate</span>
                                        <span className="font-semibold text-gray-900 dark:text-white">
                                            {completionRate}%
                                        </span>
                                    </div>
                                </div>

                                {course.premium_enabled && (
                                    <Badge variant="secondary" className="w-full justify-center py-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700">
                                        Premium Course
                                    </Badge>
                                )}

                                {/* Course Info List */}
                                <div className="space-y-3 text-sm">
                                    <div className="flex items-center gap-2">
                                        <Trophy className="w-4 h-4 text-yellow-500" />
                                        <span className="text-gray-700 dark:text-gray-300">
                                            {course.levels} Levels
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-blue-500" />
                                        <span className="text-gray-700 dark:text-gray-300">
                                            Self-paced learning
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <BookOpen className="w-4 h-4 text-green-500" />
                                        <span className="text-gray-700 dark:text-gray-300">
                                            Certification included
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}