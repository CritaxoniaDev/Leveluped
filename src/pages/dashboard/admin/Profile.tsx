import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import {
    Users,
    BookOpen,
    Settings,
    ArrowLeft,
    Shield,
} from "lucide-react"

interface AdminProfile {
    id: string
    name: string
    username: string
    email: string
    bio?: string
    avatar_url?: string
    role: string
    created_at: string
}

interface SystemStats {
    total_users: number
    total_courses: number
    total_lessons: number
    total_instructors: number
    total_learners: number
}

export default function AdminProfile() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [userProfile, setUserProfile] = useState<AdminProfile | null>(null)
    const [systemStats, setSystemStats] = useState<SystemStats>({
        total_users: 0,
        total_courses: 0,
        total_lessons: 0,
        total_instructors: 0,
        total_learners: 0
    })
    const [loading, setLoading] = useState(true)
    const [isOwnProfile, setIsOwnProfile] = useState(false)

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

            // Fetch admin profile
            const { data: profile, error: profileError } = await supabase
                .from("users")
                .select("*")
                .eq("id", id)
                .single()

            if (profileError) throw profileError
            setUserProfile(profile)

            // Fetch system stats
            const { data: allUsers, error: usersError } = await supabase
                .from("users")
                .select("role")

            if (usersError) throw usersError

            const instructors = allUsers?.filter(u => u.role === 'instructor').length || 0
            const learners = allUsers?.filter(u => u.role === 'learner').length || 0

            const { data: courses, error: coursesError } = await supabase
                .from("courses")
                .select("id, lessons (id)")

            if (coursesError) throw coursesError

            const totalLessons = courses?.reduce((sum: number, c: any) => sum + (c.lessons?.length || 0), 0) || 0

            setSystemStats({
                total_users: allUsers?.length || 0,
                total_courses: courses?.length || 0,
                total_lessons: totalLessons,
                total_instructors: instructors,
                total_learners: learners
            })

        } catch (error: any) {
            console.error("Error fetching profile:", error)
            toast.error("Error", {
                description: "Failed to load profile"
            })
        } finally {
            setLoading(false)
        }
    }

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map(n => n[0])
            .join("")
            .toUpperCase()
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

    if (!userProfile) {
        return (
            <div className="flex items-center justify-center h-96">
                <p className="text-gray-600 dark:text-gray-400">Profile not found</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Back Button */}
            <Button
                variant="ghost"
                onClick={() => navigate(-1)}
                className="gap-2"
            >
                <ArrowLeft className="w-4 h-4" />
                Back
            </Button>

            {/* Profile Header Card */}
            <Card className="overflow-hidden">
                {/* Background Banner */}
                <div className="h-32 bg-gradient-to-r from-red-500 via-orange-500 to-pink-500"></div>

                <CardContent className="relative pt-0">
                    {/* Avatar */}
                    <div className="flex flex-col sm:flex-row sm:items-end sm:gap-4 -mt-16 mb-6">
                        <Avatar className="w-32 h-32 border-4 border-white dark:border-gray-900">
                            <AvatarImage src={userProfile.avatar_url} alt={userProfile.name} />
                            <AvatarFallback className="bg-gradient-to-br from-red-500 to-orange-500 text-white text-2xl">
                                {getInitials(userProfile.name)}
                            </AvatarFallback>
                        </Avatar>

                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                                    {userProfile.name}
                                </h1>
                                <Badge className="bg-red-600">
                                    <Shield className="w-3 h-3 mr-1" />
                                    Admin
                                </Badge>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400">@{userProfile.username}</p>
                            {userProfile.bio && (
                                <p className="text-gray-700 dark:text-gray-300 mt-2">{userProfile.bio}</p>
                            )}
                        </div>

                        {isOwnProfile && (
                            <Button size="sm" variant="outline" className="gap-2">
                                <Settings className="w-4 h-4" />
                                Edit Profile
                            </Button>
                        )}
                    </div>

                    {/* System Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {systemStats.total_users}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Users</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {systemStats.total_instructors}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Instructors</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {systemStats.total_learners}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Learners</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {systemStats.total_courses}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Courses</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {systemStats.total_lessons}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Lessons</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* System Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            Users Overview
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Users</span>
                            <span className="text-lg font-bold text-gray-900 dark:text-white">{systemStats.total_users}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Learners</span>
                            <span className="text-lg font-bold text-gray-900 dark:text-white">{systemStats.total_learners}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Instructors</span>
                            <span className="text-lg font-bold text-gray-900 dark:text-white">{systemStats.total_instructors}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BookOpen className="w-5 h-5" />
                            Content Overview
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Courses</span>
                            <span className="text-lg font-bold text-gray-900 dark:text-white">{systemStats.total_courses}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Lessons</span>
                            <span className="text-lg font-bold text-gray-900 dark:text-white">{systemStats.total_lessons}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-cyan-50 dark:bg-cyan-950/20 rounded-lg">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Avg Lessons/Course</span>
                            <span className="text-lg font-bold text-gray-900 dark:text-white">
                                {systemStats.total_courses > 0 ? (systemStats.total_lessons / systemStats.total_courses).toFixed(1) : 0}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}