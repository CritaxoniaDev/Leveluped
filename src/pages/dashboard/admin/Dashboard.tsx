import { useEffect, useState } from "react"
import { supabase } from "@/packages/supabase/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/packages/shadcn/ui/card"
import { Users, BookOpen, TrendingUp, Activity } from "lucide-react"
import { toast } from "sonner"

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalCourses: 0,
        totalRevenue: 0,
        activeSessions: 0,
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchDashboardStats()
    }, [])

    const fetchDashboardStats = async () => {
        try {
            setLoading(true)

            // Fetch total users
            const { count: usersCount, error: usersError } = await supabase
                .from("users")
                .select("*", { count: "exact", head: true })

            if (usersError) throw usersError

            // Fetch total courses (assuming you have a courses table)
            const { count: coursesCount, error: coursesError } = await supabase
                .from("courses")
                .select("*", { count: "exact", head: true })

            if (coursesError && coursesError.code !== "PGRST116") throw coursesError

            setStats({
                totalUsers: usersCount || 0,
                totalCourses: coursesCount || 0,
                totalRevenue: 234500, // Replace with actual data fetch
                activeSessions: 567, // Replace with actual data fetch
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
            title: "Total Users",
            value: stats.totalUsers.toLocaleString(),
            description: "Active users on platform",
            icon: Users,
            color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
        },
        {
            title: "Courses",
            value: stats.totalCourses,
            description: "Published courses",
            icon: BookOpen,
            color: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
        },
        {
            title: "Revenue",
            value: `$${(stats.totalRevenue / 1000).toFixed(1)}K`,
            description: "Total platform revenue",
            icon: TrendingUp,
            color: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
        },
        {
            title: "Active Sessions",
            value: stats.activeSessions,
            description: "Current active users",
            icon: Activity,
            color: "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400",
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
                    Admin Dashboard
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                    Overview of platform statistics and metrics
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
                        <CardTitle>Recent Users</CardTitle>
                        <CardDescription>Latest registered users on the platform</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-800">
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">John Doe</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">john@example.com</p>
                                </div>
                                <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded">
                                    Learner
                                </span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-800">
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">Jane Smith</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">jane@example.com</p>
                                </div>
                                <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-1 rounded">
                                    Instructor
                                </span>
                            </div>
                            <div className="flex items-center justify-between py-2">
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">Bob Wilson</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">bob@example.com</p>
                                </div>
                                <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-1 rounded">
                                    Learner
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Platform Stats */}
                <Card className="border-gray-200 dark:border-gray-800">
                    <CardHeader>
                        <CardTitle>Platform Health</CardTitle>
                        <CardDescription>System performance metrics</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Server Status</p>
                                    <span className="text-xs font-semibold text-green-600 dark:text-green-400">Operational</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2">
                                    <div className="bg-green-500 h-2 rounded-full" style={{ width: "100%" }}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Database Load</p>
                                    <span className="text-xs font-semibold text-yellow-600 dark:text-yellow-400">65%</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2">
                                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: "65%" }}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Uptime</p>
                                    <span className="text-xs font-semibold text-green-600 dark:text-green-400">99.9%</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2">
                                    <div className="bg-green-500 h-2 rounded-full" style={{ width: "99.9%" }}></div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}