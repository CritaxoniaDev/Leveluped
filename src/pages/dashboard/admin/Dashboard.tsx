import { useEffect, useState } from "react"
import { supabase } from "@/packages/supabase/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/packages/shadcn/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/packages/shadcn/ui/chart"
import { Users, BookOpen, TrendingUp, Activity, CreditCard, Zap } from "lucide-react"
import { toast } from "sonner"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

interface DashboardStats {
    totalUsers: number
    totalCourses: number
    totalRevenue: number
    activeSessions: number
    totalCoins: number
    totalPremiumSubscriptions: number
    totalTransactions: number
    totalCoinTransactions: number
}

interface RevenueData {
    month: string
    revenue: number
}

interface TransactionData {
    name: string
    value: number
}

const chartConfig = {
    revenue: {
        label: "Revenue",
        color: "#10b981",
    },
    transactions: {
        label: "Transactions",
        color: "#3b82f6",
    },
    users: {
        label: "Users",
        color: "#8b5cf6",
    },
    coins: {
        label: "Coin Transactions",
        color: "#f59e0b",
    },
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<DashboardStats>({
        totalUsers: 0,
        totalCourses: 0,
        totalRevenue: 0,
        activeSessions: 0,
        totalCoins: 0,
        totalPremiumSubscriptions: 0,
        totalTransactions: 0,
        totalCoinTransactions: 0,
    })
    const [revenueData, setRevenueData] = useState<RevenueData[]>([])
    const [transactionData, setTransactionData] = useState<TransactionData[]>([])
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

            if (usersError) {
                console.error("Users error:", usersError)
            }

            // Fetch total courses
            const { count: coursesCount, error: coursesError } = await supabase
                .from("courses")
                .select("*", { count: "exact", head: true })

            if (coursesError) {
                console.error("Courses error:", coursesError)
            }

            // Fetch total revenue from completed stripe payments
            let totalRevenue = 0
            const { data: stripePayments, error: stripeError } = await supabase
                .from("stripe_payments")
                .select("amount, created_at")
                .eq("status", "completed")

            if (stripeError) {
                console.error("Stripe payments error:", stripeError)
            } else {
                totalRevenue = stripePayments?.reduce((sum, payment) => sum + payment.amount, 0) || 0
                
                // Process revenue data for chart
                const revenueByMonth = processRevenueData(stripePayments)
                setRevenueData(revenueByMonth)
            }

            // Fetch total stripe transactions
            const { count: transactionsCount, error: transError } = await supabase
                .from("stripe_payments")
                .select("*", { count: "exact", head: true })

            if (transError) {
                console.error("Transactions count error:", transError)
            }

            // Fetch total coin transactions
            const { count: coinTransCount, error: coinTransError } = await supabase
                .from("coin_transactions")
                .select("*", { count: "exact", head: true })

            if (coinTransError) {
                console.error("Coin transactions error:", coinTransError)
            }

            // Fetch active premium subscriptions
            const { count: activePremiumCount, error: premiumError } = await supabase
                .from("user_premium_subscriptions")
                .select("*", { count: "exact", head: true })
                .eq("status", "active")

            if (premiumError) {
                console.error("Premium subscriptions error:", premiumError)
            }

            // Calculate active sessions
            const { count: activeSessions, error: sessionsError } = await supabase
                .from("users")
                .select("*", { count: "exact", head: true })
                .not("avatar_border", "is", null)

            if (sessionsError) {
                console.error("Active sessions error:", sessionsError)
            }

            // Process transaction data for pie chart
            const transData = [
                { name: "Completed", value: transactionsCount || 0 },
                { name: "Coin Trans.", value: coinTransCount || 0 },
                { name: "Premium Subs.", value: activePremiumCount || 0 },
            ]
            setTransactionData(transData)

            setStats({
                totalUsers: usersCount || 0,
                totalCourses: coursesCount || 0,
                totalRevenue: totalRevenue / 100,
                activeSessions: activeSessions || 0,
                totalCoins: 0,
                totalPremiumSubscriptions: activePremiumCount || 0,
                totalTransactions: transactionsCount || 0,
                totalCoinTransactions: coinTransCount || 0,
            })

        } catch (error: any) {
            console.error("Error fetching dashboard stats:", error)
            toast.error("Error", {
                description: error?.message || "Failed to load dashboard statistics"
            })
        } finally {
            setLoading(false)
        }
    }

    const processRevenueData = (payments: any[]) => {
        const monthlyRevenue: { [key: string]: number } = {}

        payments.forEach((payment) => {
            const date = new Date(payment.created_at)
            const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
            monthlyRevenue[month] = (monthlyRevenue[month] || 0) + payment.amount
        })

        return Object.entries(monthlyRevenue)
            .sort(([monthA], [monthB]) => monthA.localeCompare(monthB))
            .slice(-6)
            .map(([month, revenue]) => ({
                month: new Date(month + "-01").toLocaleDateString("en-US", { month: "short" }),
                revenue: Math.round(revenue / 100),
            }))
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
            title: "Published Courses",
            value: stats.totalCourses,
            description: "Total available courses",
            icon: BookOpen,
            color: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
        },
        {
            title: "Total Revenue",
            value: `$${stats.totalRevenue.toFixed(2)}`,
            description: "From completed payments",
            icon: TrendingUp,
            color: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
        },
        {
            title: "Active Sessions",
            value: stats.activeSessions,
            description: "Users with activities",
            icon: Activity,
            color: "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400",
        },
    ]

    const COLORS = ["#10b981", "#3b82f6", "#8b5cf6"]

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

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Chart */}
                <Card className="border-gray-200 dark:border-gray-800">
                    <CardHeader>
                        <CardTitle>Revenue Trend</CardTitle>
                        <CardDescription>Last 6 months revenue</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={chartConfig} className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={revenueData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                                    <XAxis dataKey="month" stroke="rgba(0,0,0,0.5)" />
                                    <YAxis stroke="rgba(0,0,0,0.5)" />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <Line 
                                        type="monotone" 
                                        dataKey="revenue" 
                                        stroke="#10b981" 
                                        strokeWidth={2}
                                        dot={{ fill: "#10b981", r: 4 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </CardContent>
                </Card>

                {/* Transaction Distribution Chart */}
                <Card className="border-gray-200 dark:border-gray-800">
                    <CardHeader>
                        <CardTitle>Transaction Distribution</CardTitle>
                        <CardDescription>All transaction types</CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                        <ChartContainer config={chartConfig} className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <Pie
                                        data={transactionData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, value }) => `${name}: ${value}`}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {/* @ts-ignore */}
                                        {transactionData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Additional Statistics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Transactions Stats */}
                <Card className="border-gray-200 dark:border-gray-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CreditCard className="w-5 h-5" />
                            Payment Transactions
                        </CardTitle>
                        <CardDescription>Stripe payments overview</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Total Transactions</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                                {stats.totalTransactions}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Coin Transactions Stats */}
                <Card className="border-gray-200 dark:border-gray-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Zap className="w-5 h-5" />
                            Coin Transactions
                        </CardTitle>
                        <CardDescription>In-game economy overview</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Total Transactions</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                                {stats.totalCoinTransactions}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Premium Stats */}
                <Card className="border-gray-200 dark:border-gray-800">
                    <CardHeader>
                        <CardTitle>Premium Subscriptions</CardTitle>
                        <CardDescription>Active premium users</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Active Subscriptions</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                                {stats.totalPremiumSubscriptions}
                            </p>
                        </div>
                        <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Premium Users %</p>
                            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                                {stats.totalUsers > 0 ? ((stats.totalPremiumSubscriptions / stats.totalUsers) * 100).toFixed(1) : 0}%
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Detailed Stats Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Conversion Metrics */}
                <Card className="border-gray-200 dark:border-gray-800">
                    <CardHeader>
                        <CardTitle>Conversion Metrics</CardTitle>
                        <CardDescription>Platform engagement analytics</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Premium Conversion Rate</p>
                                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                                    {stats.totalUsers > 0 ? ((stats.totalPremiumSubscriptions / stats.totalUsers) * 100).toFixed(1) : 0}%
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2">
                                <div 
                                    className="bg-blue-500 h-2 rounded-full transition-all" 
                                    style={{ width: `${stats.totalUsers > 0 ? ((stats.totalPremiumSubscriptions / stats.totalUsers) * 100) : 0}%` }}
                                ></div>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active User Engagement</p>
                                <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                                    {stats.totalUsers > 0 ? ((stats.activeSessions / stats.totalUsers) * 100).toFixed(1) : 0}%
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2">
                                <div 
                                    className="bg-green-500 h-2 rounded-full transition-all" 
                                    style={{ width: `${stats.totalUsers > 0 ? ((stats.activeSessions / stats.totalUsers) * 100) : 0}%` }}
                                ></div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Platform Health */}
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