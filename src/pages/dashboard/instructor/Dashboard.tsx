import { useEffect, useState } from "react"
import { supabase } from "@/packages/supabase/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, BookOpen, Star, TrendingUp } from "lucide-react"
import { toast } from "sonner"

interface RecentEnrollment {
    user_id: string
    student_name: string
    course_title: string
    enrolled_at: string
}

interface CoursePerformance {
    id: string
    title: string
    avg_rating: number
    enrollment_count: number
}

export default function InstructorDashboard() {
    const [stats, setStats] = useState({
        totalStudents: 0,
        totalCourses: 0,
        avgRating: 0,
        totalRevenue: 0,
    })
    const [recentEnrollments, setRecentEnrollments] = useState<RecentEnrollment[]>([])
    const [coursePerformance, setCoursePerformance] = useState<CoursePerformance[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchDashboardStats()
    }, [])

    const fetchDashboardStats = async () => {
        try {
            setLoading(true)

            // Get current user
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            const instructorId = session.user.id

            // Fetch total courses for this instructor
            const { count: coursesCount, data: coursesData, error: coursesError } = await supabase
                .from("courses")
                .select("id, title", { count: "exact" })
                .eq("instructor_id", instructorId)

            if (coursesError) throw coursesError

            const courseIds = coursesData?.map(c => c.id) || []

            // Fetch all enrollments for instructor's courses
            const { data: enrollments, error: enrollmentsError } = await supabase
                .from("enrollments")
                .select("user_id, course_id")
                .in("course_id", courseIds.length > 0 ? courseIds : ['00000000-0000-0000-0000-000000000000'])

            if (enrollmentsError) throw enrollmentsError

            // Count unique students
            const uniqueStudents = new Set(enrollments?.map(e => e.user_id) || [])
            const totalStudents = uniqueStudents.size

            // Fetch recent enrollments with student names
            const { data: recentEnrollmentsData, error: recentError } = await supabase
                .from("enrollments")
                .select(`
                    user_id,
                    course_id,
                    enrolled_at,
                    courses(title),
                    users(name)
                `)
                .in("course_id", courseIds.length > 0 ? courseIds : ['00000000-0000-0000-0000-000000000000'])
                .order("enrolled_at", { ascending: false })
                .limit(5)

            if (recentError) throw recentError

            const formattedRecentEnrollments: RecentEnrollment[] = recentEnrollmentsData?.map(e => ({
                user_id: e.user_id,
                student_name: (e.users as any)?.name || "Unknown Student",
                course_title: (e.courses as any)?.title || "Unknown Course",
                enrolled_at: e.enrolled_at,
            })) || []

            setRecentEnrollments(formattedRecentEnrollments)

            // Fetch course ratings from resource_attempts (if reviews table doesn't exist)
            // For now, we'll calculate based on resource attempt scores
            const { data: attempts, error: attemptsError } = await supabase
                .from("resource_attempts")
                .select(`
                    score,
                    max_score,
                    resource_content(course_id)
                `)

            if (attemptsError && attemptsError.code !== "PGRST116") throw attemptsError

            // Calculate average rating from attempts (score/max_score * 5 stars)
            let avgRating = 0
            if (attempts && attempts.length > 0) {
                const ratings = attempts
                    .filter(a => a.max_score > 0)
                    .map(a => (a.score / a.max_score) * 5)
                avgRating = ratings.length > 0 
                    ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
                    : 0
            }

            // Calculate course performance metrics
            const coursePerformanceMap = new Map<string, { title: string; scores: number[], maxScores: number[] }>()
            
            coursesData?.forEach(course => {
                coursePerformanceMap.set(course.id, { title: course.title, scores: [], maxScores: [] })
            })

            attempts?.forEach(attempt => {
                const courseId = (attempt.resource_content as any)?.course_id
                const course = coursePerformanceMap.get(courseId)
                if (course && attempt.max_score > 0) {
                    course.scores.push(attempt.score)
                    course.maxScores.push(attempt.max_score)
                }
            })

            const coursePerformanceList: CoursePerformance[] = Array.from(coursePerformanceMap.entries())
                .map(([id, data]) => {
                    const avgScore = data.scores.length > 0 
                        ? data.scores.reduce((a, b) => a + b) / data.scores.length
                        : 0
                    const avgMaxScore = data.maxScores.length > 0
                        ? data.maxScores.reduce((a, b) => a + b) / data.maxScores.length
                        : 1
                    const rating = avgMaxScore > 0 ? (avgScore / avgMaxScore) * 5 : 0

                    return {
                        id,
                        title: data.title,
                        avg_rating: Math.round(rating * 10) / 10,
                        enrollment_count: enrollments?.filter(e => e.course_id === id).length || 0,
                    }
                })
                .sort((a, b) => b.avg_rating - a.avg_rating)
                .slice(0, 3)

            setCoursePerformance(coursePerformanceList)

            setStats({
                totalStudents,
                totalCourses: coursesCount || 0,
                avgRating: Math.round(avgRating * 10) / 10,
                totalRevenue: 0, // TODO: Implement based on your payment system
            })

        } catch (error: any) {
            console.error("Error fetching dashboard stats:", error)
            toast.error("Error", {
                description: "Failed to load dashboard statistics"
            })
        } finally {
            setLoading(false)
        }
    }

    const statCards = [
        {
            title: "Total Students",
            value: stats.totalStudents.toString(),
            description: "Students enrolled in your courses",
            icon: Users,
            color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
        },
        {
            title: "Courses",
            value: stats.totalCourses.toString(),
            description: "Courses you've created",
            icon: BookOpen,
            color: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
        },
        {
            title: "Avg Rating",
            value: stats.avgRating.toString(),
            description: "Average rating across all courses",
            icon: Star,
            color: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400",
        },
        {
            title: "Revenue",
            value: `$${(stats.totalRevenue / 1000).toFixed(1)}K`,
            description: "Total revenue generated",
            icon: TrendingUp,
            color: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
        },
    ]

    const getStatusBadge = (enrolledAt: string) => {
        const daysAgo = Math.floor((Date.now() - new Date(enrolledAt).getTime()) / (1000 * 60 * 60 * 24))
        return daysAgo <= 7 ? "New" : "Active"
    }

    const getRatingColor = (rating: number): string => {
        if (rating >= 4.7) return "text-green-600 dark:text-green-400"
        if (rating >= 4.0) return "text-yellow-600 dark:text-yellow-400"
        return "text-blue-600 dark:text-blue-400"
    }

    const getRatingProgressColor = (rating: number): string => {
        if (rating >= 4.7) return "bg-green-500"
        if (rating >= 4.0) return "bg-yellow-500"
        return "bg-blue-500"
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading statistics...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Instructor Dashboard
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                    Overview of your teaching performance and metrics
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat) => {
                    const Icon = stat.icon
                    return (
                        <Card key={stat.title} className="border-gray-200 dark:border-gray-800">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    {stat.title}
                                </CardTitle>
                                <div className={`p-2 rounded-lg ${stat.color}`}>
                                    <Icon className="w-4 h-4" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {stat.value}
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {stat.description}
                                </p>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* Additional Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Enrollments */}
                <Card className="border-gray-200 dark:border-gray-800">
                    <CardHeader>
                        <CardTitle>Recent Enrollments</CardTitle>
                        <CardDescription>Latest students joining your courses</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentEnrollments.length > 0 ? (
                                recentEnrollments.map((enrollment, index) => (
                                    <div key={index} className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-800 last:border-b-0">
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">{enrollment.student_name}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{enrollment.course_title}</p>
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded ${
                                            getStatusBadge(enrollment.enrolled_at) === "New"
                                                ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                                                : "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                                        }`}>
                                            {getStatusBadge(enrollment.enrolled_at)}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500 dark:text-gray-400 text-center py-8">No recent enrollments</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Course Performance */}
                <Card className="border-gray-200 dark:border-gray-800">
                    <CardHeader>
                        <CardTitle>Course Performance</CardTitle>
                        <CardDescription>Your top performing courses</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {coursePerformance.length > 0 ? (
                                coursePerformance.map((course) => (
                                    <div key={course.id}>
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{course.title}</p>
                                            <span className={`text-xs font-semibold ${getRatingColor(course.avg_rating)}`}>
                                                {course.avg_rating} ★
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2">
                                            <div 
                                                className={`${getRatingProgressColor(course.avg_rating)} h-2 rounded-full`}
                                                style={{ width: `${(course.avg_rating / 5) * 100}%` }}
                                            ></div>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            {course.enrollment_count} {course.enrollment_count === 1 ? 'student' : 'students'} enrolled
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500 dark:text-gray-400 text-center py-8">No courses yet</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}