import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, BookOpen, Star, TrendingUp } from "lucide-react"
import { toast } from "sonner"

export default function InstructorDashboard() {
    const [stats, setStats] = useState({
        totalStudents: 0,
        totalCourses: 0,
        avgRating: 0,
        totalRevenue: 0,
    })
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

            // Fetch total courses
            const { count: coursesCount, error: coursesError } = await supabase
                .from("courses")
                .select("*", { count: "exact", head: true })
                .eq("instructor_id", instructorId)

            if (coursesError && coursesError.code !== "PGRST116") throw coursesError

            // Fetch total students (unique students enrolled in instructor's courses)
            const { data: enrollments, error: enrollmentsError } = await supabase
                .from("enrollments")
                .select("student_id")
                .in("course_id",
                    (await supabase
                        .from("courses")
                        .select("id")
                        .eq("instructor_id", instructorId)
                    ).data?.map(c => c.id) || []
                )

            if (enrollmentsError && enrollmentsError.code !== "PGRST116") throw enrollmentsError

            const uniqueStudents = new Set(enrollments?.map(e => e.student_id) || [])
            const totalStudents = uniqueStudents.size

            // Fetch average rating
            const { data: reviews, error: reviewsError } = await supabase
                .from("reviews")
                .select("rating")
                .in("course_id",
                    (await supabase
                        .from("courses")
                        .select("id")
                        .eq("instructor_id", instructorId)
                    ).data?.map(c => c.id) || []
                )

            if (reviewsError && reviewsError.code !== "PGRST116") throw reviewsError

            const avgRating = reviews && reviews.length > 0
                ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
                : 0

            // Fetch total revenue (assuming there's a revenue field in courses or transactions)
            // For now, using a placeholder calculation - replace with actual logic
            const totalRevenue = 12500 // Placeholder - implement based on your revenue tracking

            setStats({
                totalStudents,
                totalCourses: coursesCount || 0,
                avgRating: Math.round(avgRating * 10) / 10, // Round to 1 decimal
                totalRevenue,
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
                {/* Recent Activity */}
                <Card className="border-gray-200 dark:border-gray-800">
                    <CardHeader>
                        <CardTitle>Recent Enrollments</CardTitle>
                        <CardDescription>Latest students joining your courses</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-800">
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">John Doe</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">React Basics Course</p>
                                </div>
                                <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-1 rounded">
                                    New
                                </span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-800">
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">Jane Smith</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Advanced JavaScript</p>
                                </div>
                                <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-1 rounded">
                                    New
                                </span>
                            </div>
                            <div className="flex items-center justify-between py-2">
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">Bob Wilson</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Python for Beginners</p>
                                </div>
                                <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded">
                                    Active
                                </span>
                            </div>
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
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">React Basics</p>
                                    <span className="text-xs font-semibold text-green-600 dark:text-green-400">4.9 ★</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2">
                                    <div className="bg-green-500 h-2 rounded-full" style={{ width: "98%" }}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Advanced JS</p>
                                    <span className="text-xs font-semibold text-yellow-600 dark:text-yellow-400">4.7 ★</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2">
                                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: "94%" }}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Python Basics</p>
                                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">4.5 ★</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2">
                                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: "90%" }}></div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}