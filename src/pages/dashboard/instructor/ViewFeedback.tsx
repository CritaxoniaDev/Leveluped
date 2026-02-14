import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { supabase } from "@/packages/supabase/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
    ArrowLeft,
    Star,
    Users,
    MessageSquare,
    TrendingUp,
    Calendar,
    User
} from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface StudentFeedback {
    id: string
    user_id: string
    user: {
        name: string
        username: string
    }
    course_quality: number
    instructor_quality: number
    content_clarity: number
    course_difficulty: number
    would_recommend: boolean
    comments: string | null
    submitted_at: string
}

interface FeedbackStats {
    totalFeedback: number
    averageCourseQuality: number
    averageInstructorQuality: number
    averageContentClarity: number
    averageCourseDifficulty: number
    recommendationRate: number
}

export default function ViewFeedback() {
    const { courseId } = useParams<{ courseId: string }>()
    const navigate = useNavigate()
    const [courseName, setCourseName] = useState<string>("")
    const [feedbackList, setFeedbackList] = useState<StudentFeedback[]>([])
    const [stats, setStats] = useState<FeedbackStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [selectedTab, setSelectedTab] = useState("overview")

    useEffect(() => {
        if (courseId) {
            fetchFeedbackData()
        }
    }, [courseId])

    const fetchFeedbackData = async () => {
        try {
            setLoading(true)
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                toast.error("Error", {
                    description: "You must be logged in"
                })
                navigate("/login")
                return
            }

            // Fetch course details
            const { data: courseData, error: courseError } = await supabase
                .from("courses")
                .select("title, instructor_id")
                .eq("id", courseId)
                .single()

            if (courseError) throw courseError

            // Verify instructor owns this course
            if (courseData.instructor_id !== session.user.id) {
                toast.error("Access Denied", {
                    description: "You don't have permission to view feedback for this course"
                })
                navigate("/dashboard/instructor/courses")
                return
            }

            setCourseName(courseData.title)

            // Fetch all feedback for this course
            const { data: feedbackData, error: feedbackError } = await supabase
                .from("course_feedback")
                .select(`
                    id,
                    user_id,
                    course_quality,
                    instructor_quality,
                    content_clarity,
                    course_difficulty,
                    would_recommend,
                    comments,
                    submitted_at,
                    users:user_id (
                        name,
                        username
                    )
                `)
                .eq("course_id", courseId)
                .order("submitted_at", { ascending: false })

            if (feedbackError && feedbackError.code !== "PGRST116") throw feedbackError

            // Transform the data to match StudentFeedback interface
            const feedback: StudentFeedback[] = (feedbackData || []).map((item: any) => ({
                id: item.id,
                user_id: item.user_id,
                user: Array.isArray(item.users) ? item.users[0] : item.users,
                course_quality: item.course_quality,
                instructor_quality: item.instructor_quality,
                content_clarity: item.content_clarity,
                course_difficulty: item.course_difficulty,
                would_recommend: item.would_recommend,
                comments: item.comments,
                submitted_at: item.submitted_at
            }))

            setFeedbackList(feedback)

            // Calculate statistics
            if (feedback.length > 0) {
                const avgCourseQuality = feedback.reduce((sum, f) => sum + f.course_quality, 0) / feedback.length
                const avgInstructorQuality = feedback.reduce((sum, f) => sum + f.instructor_quality, 0) / feedback.length
                const avgContentClarity = feedback.reduce((sum, f) => sum + f.content_clarity, 0) / feedback.length
                const avgCourseDifficulty = feedback.reduce((sum, f) => sum + f.course_difficulty, 0) / feedback.length
                const recommendCount = feedback.filter(f => f.would_recommend).length
                const recommendationRate = (recommendCount / feedback.length) * 100

                setStats({
                    totalFeedback: feedback.length,
                    averageCourseQuality: parseFloat(avgCourseQuality.toFixed(2)),
                    averageInstructorQuality: parseFloat(avgInstructorQuality.toFixed(2)),
                    averageContentClarity: parseFloat(avgContentClarity.toFixed(2)),
                    averageCourseDifficulty: parseFloat(avgCourseDifficulty.toFixed(2)),
                    recommendationRate: parseFloat(recommendationRate.toFixed(1))
                })
            }
        } catch (error: any) {
            console.error("Error fetching feedback:", error)
            toast.error("Error", {
                description: "Failed to load feedback data"
            })
        } finally {
            setLoading(false)
        }
    }

    const getRatingColor = (rating: number) => {
        if (rating >= 4) return "text-green-600 dark:text-green-400"
        if (rating >= 3) return "text-yellow-600 dark:text-yellow-400"
        return "text-red-600 dark:text-red-400"
    }

    const getRatingBgColor = (rating: number) => {
        if (rating >= 4) return "bg-green-50 dark:bg-green-900/20"
        if (rating >= 3) return "bg-yellow-50 dark:bg-yellow-900/20"
        return "bg-red-50 dark:bg-red-900/20"
    }

    const getRatingPercentage = (rating: number) => {
        return (rating / 5) * 100
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        })
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading feedback...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto py-8 px-4 space-y-6">
            {/* Header */}
            <div className="mb-8">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(-1)}
                    className="mb-4"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                </Button>
                <div className="flex items-center gap-3 mb-2">
                    <MessageSquare className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Course Feedback</h1>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                    Feedback for <span className="font-semibold">{courseName}</span>
                </p>
            </div>

            {/* No Feedback Message */}
            {feedbackList.length === 0 ? (
                <Card className="border-gray-200 dark:border-gray-800">
                    <CardContent className="p-8 text-center">
                        <MessageSquare className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            No Feedback Yet
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            Students haven't submitted feedback for this course yet. Check back later!
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* Statistics Overview */}
                    {stats && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            {/* Total Feedback Card */}
                            <Card className="border-gray-200 dark:border-gray-800">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Feedback</p>
                                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                                {stats.totalFeedback}
                                            </p>
                                        </div>
                                        <Users className="w-8 h-8 text-blue-600 dark:text-blue-400 opacity-20" />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Course Quality Card */}
                            <Card className={`border-gray-200 dark:border-gray-800 ${getRatingBgColor(stats.averageCourseQuality)}`}>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Course Quality</p>
                                            <p className={`text-2xl font-bold ${getRatingColor(stats.averageCourseQuality)}`}>
                                                {stats.averageCourseQuality}/5
                                            </p>
                                        </div>
                                        <Star className={`w-8 h-8 ${getRatingColor(stats.averageCourseQuality)} opacity-20`} />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Instructor Quality Card */}
                            <Card className={`border-gray-200 dark:border-gray-800 ${getRatingBgColor(stats.averageInstructorQuality)}`}>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Instructor</p>
                                            <p className={`text-2xl font-bold ${getRatingColor(stats.averageInstructorQuality)}`}>
                                                {stats.averageInstructorQuality}/5
                                            </p>
                                        </div>
                                        <User className={`w-8 h-8 ${getRatingColor(stats.averageInstructorQuality)} opacity-20`} />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Content Clarity Card */}
                            <Card className={`border-gray-200 dark:border-gray-800 ${getRatingBgColor(stats.averageContentClarity)}`}>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Clarity</p>
                                            <p className={`text-2xl font-bold ${getRatingColor(stats.averageContentClarity)}`}>
                                                {stats.averageContentClarity}/5
                                            </p>
                                        </div>
                                        <TrendingUp className={`w-8 h-8 ${getRatingColor(stats.averageContentClarity)} opacity-20`} />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Recommendation Rate Card */}
                            <Card className="border-gray-200 dark:border-gray-800 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Recommend Rate</p>
                                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                                {stats.recommendationRate}%
                                            </p>
                                        </div>
                                        <Star className="w-8 h-8 text-green-600 dark:text-green-400 opacity-20" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Detailed Feedback Tabs */}
                    <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mt-8">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="ratings">Ratings</TabsTrigger>
                            <TabsTrigger value="comments">Comments</TabsTrigger>
                        </TabsList>

                        {/* Overview Tab */}
                        <TabsContent value="overview" className="space-y-4">
                            <Card className="border-gray-200 dark:border-gray-800">
                                <CardHeader>
                                    <CardTitle>Rating Distribution</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Course Quality Distribution */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                Course Quality
                                            </span>
                                            <span className={`text-sm font-bold ${getRatingColor(stats!.averageCourseQuality)}`}>
                                                {stats!.averageCourseQuality}/5
                                            </span>
                                        </div>
                                        <Progress
                                            value={getRatingPercentage(stats!.averageCourseQuality)}
                                            className="h-2"
                                        />
                                    </div>

                                    {/* Instructor Quality Distribution */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                Instructor Quality
                                            </span>
                                            <span className={`text-sm font-bold ${getRatingColor(stats!.averageInstructorQuality)}`}>
                                                {stats!.averageInstructorQuality}/5
                                            </span>
                                        </div>
                                        <Progress
                                            value={getRatingPercentage(stats!.averageInstructorQuality)}
                                            className="h-2"
                                        />
                                    </div>

                                    {/* Content Clarity Distribution */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                Content Clarity
                                            </span>
                                            <span className={`text-sm font-bold ${getRatingColor(stats!.averageContentClarity)}`}>
                                                {stats!.averageContentClarity}/5
                                            </span>
                                        </div>
                                        <Progress
                                            value={getRatingPercentage(stats!.averageContentClarity)}
                                            className="h-2"
                                        />
                                    </div>

                                    {/* Course Difficulty Distribution */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                Course Difficulty
                                            </span>
                                            <span className={`text-sm font-bold ${getRatingColor(stats!.averageCourseDifficulty)}`}>
                                                {stats!.averageCourseDifficulty}/5
                                            </span>
                                        </div>
                                        <Progress
                                            value={getRatingPercentage(stats!.averageCourseDifficulty)}
                                            className="h-2"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Ratings Tab */}
                        <TabsContent value="ratings" className="space-y-4">
                            {feedbackList.map((feedback) => (
                                <Card key={feedback.id} className="border-gray-200 dark:border-gray-800">
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                                                    {feedback.user?.name || feedback.user?.username || "Anonymous"}
                                                </h3>
                                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                                    <Calendar className="w-3 h-3 inline mr-1" />
                                                    {formatDate(feedback.submitted_at)}
                                                </p>
                                            </div>
                                            <Badge variant={feedback.would_recommend ? "default" : "secondary"}>
                                                {feedback.would_recommend ? "✓ Recommends" : "✗ Not Recommended"}
                                            </Badge>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className={`p-3 rounded-lg ${getRatingBgColor(feedback.course_quality)}`}>
                                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Course Quality</p>
                                                <p className={`text-lg font-bold ${getRatingColor(feedback.course_quality)}`}>
                                                    {feedback.course_quality}/5
                                                </p>
                                            </div>
                                            <div className={`p-3 rounded-lg ${getRatingBgColor(feedback.instructor_quality)}`}>
                                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Instructor</p>
                                                <p className={`text-lg font-bold ${getRatingColor(feedback.instructor_quality)}`}>
                                                    {feedback.instructor_quality}/5
                                                </p>
                                            </div>
                                            <div className={`p-3 rounded-lg ${getRatingBgColor(feedback.content_clarity)}`}>
                                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Clarity</p>
                                                <p className={`text-lg font-bold ${getRatingColor(feedback.content_clarity)}`}>
                                                    {feedback.content_clarity}/5
                                                </p>
                                            </div>
                                            <div className={`p-3 rounded-lg ${getRatingBgColor(feedback.course_difficulty)}`}>
                                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Difficulty</p>
                                                <p className={`text-lg font-bold ${getRatingColor(feedback.course_difficulty)}`}>
                                                    {feedback.course_difficulty}/5
                                                </p>
                                            </div>
                                        </div>

                                        {feedback.comments && (
                                            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900/20 rounded-lg border border-gray-200 dark:border-gray-800">
                                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-semibold">
                                                    Comments:
                                                </p>
                                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                                    {feedback.comments}
                                                </p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </TabsContent>

                        {/* Comments Tab */}
                        <TabsContent value="comments" className="space-y-4">
                            {feedbackList.filter(f => f.comments && f.comments.trim().length > 0).length === 0 ? (
                                <Card className="border-gray-200 dark:border-gray-800">
                                    <CardContent className="p-8 text-center">
                                        <MessageSquare className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                                        <p className="text-gray-600 dark:text-gray-400">
                                            No comments provided by students yet.
                                        </p>
                                    </CardContent>
                                </Card>
                            ) : (
                                feedbackList
                                    .filter(f => f.comments && f.comments.trim().length > 0)
                                    .map((feedback) => (
                                        <Card key={feedback.id} className="border-gray-200 dark:border-gray-800">
                                            <CardContent className="p-6">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div>
                                                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                                                            {feedback.user?.name || feedback.user?.username || "Anonymous"}
                                                        </h3>
                                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                                            {formatDate(feedback.submitted_at)}
                                                        </p>
                                                    </div>
                                                    <Badge variant="outline">
                                                        Overall: {Math.round((feedback.course_quality + feedback.instructor_quality + feedback.content_clarity) / 3 * 10) / 10}/5
                                                    </Badge>
                                                </div>
                                                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                                        "{feedback.comments}"
                                                    </p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                            )}
                        </TabsContent>
                    </Tabs>
                </>
            )}
        </div>
    )
}