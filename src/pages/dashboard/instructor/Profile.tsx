import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { supabase } from "@/packages/supabase/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/packages/shadcn/ui/card"
import { Badge } from "@/packages/shadcn/ui/badge"
import { Button } from "@/packages/shadcn/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/packages/shadcn/ui/avatar"
import { toast } from "sonner"
import {
    BookOpen,
    Users,
    Star,
    Settings,
    ArrowLeft,
} from "lucide-react"

interface InstructorProfile {
    id: string
    name: string
    username: string
    email: string
    bio?: string
    avatar_url?: string
    role: string
    created_at: string
}

interface CourseStats {
    id: string
    title: string
    description: string
    students_count: number
    lessons_count: number
    rating?: number
    created_at: string
}

export default function InstructorProfile() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [userProfile, setUserProfile] = useState<InstructorProfile | null>(null)
    const [courses, setCourses] = useState<CourseStats[]>([])
    const [stats, setStats] = useState({
        total_students: 0,
        total_courses: 0,
        total_lessons: 0,
        avg_rating: 0
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

            // Fetch instructor profile
            const { data: profile, error: profileError } = await supabase
                .from("users")
                .select("*")
                .eq("id", id)
                .single()

            if (profileError) throw profileError
            setUserProfile(profile)

            // Fetch courses
            const { data: coursesData, error: coursesError } = await supabase
                .from("courses")
                .select(`
                    id,
                    title,
                    description,
                    created_at,
                    lessons (id),
                    course_enrollments (id)
                `)
                .eq("instructor_id", id)

            if (coursesError) throw coursesError

            const courseStats = (coursesData || []).map(course => ({
                id: course.id,
                title: course.title,
                description: course.description,
                lessons_count: course.lessons?.length || 0,
                students_count: course.course_enrollments?.length || 0,
                created_at: course.created_at
            }))

            setCourses(courseStats)

            // Calculate stats
            const totalStudents = courseStats.reduce((sum, c) => sum + c.students_count, 0)
            const totalLessons = courseStats.reduce((sum, c) => sum + c.lessons_count, 0)

            setStats({
                total_students: totalStudents,
                total_courses: courseStats.length,
                total_lessons: totalLessons,
                avg_rating: 4.8 // This would come from actual ratings in a real app
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
                <div className="h-32 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"></div>

                <CardContent className="relative pt-0">
                    {/* Avatar */}
                    <div className="flex flex-col sm:flex-row sm:items-end sm:gap-4 -mt-16 mb-6">
                        <Avatar className="w-32 h-32 border-4 border-white dark:border-gray-900">
                            <AvatarImage src={userProfile.avatar_url} alt={userProfile.name} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-2xl">
                                {getInitials(userProfile.name)}
                            </AvatarFallback>
                        </Avatar>

                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                                    {userProfile.name}
                                </h1>
                                <Badge className="bg-blue-500">Instructor</Badge>
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

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {stats.total_courses}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Courses</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {stats.total_students}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Students</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {stats.total_lessons}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Lessons</p>
                        </div>
                        <div className="text-center">
                            <div className="flex items-center justify-center gap-1">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {stats.avg_rating}
                                </p>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Rating</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Courses Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5" />
                        Courses
                    </CardTitle>
                    <CardDescription>
                        {courses.length} course{courses.length !== 1 ? 's' : ''} created
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {courses.length === 0 ? (
                        <div className="text-center py-12">
                            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500 dark:text-gray-400">
                                No courses created yet
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {courses.map((course) => (
                                <Card key={course.id} className="border-blue-200 dark:border-blue-800 hover:shadow-lg transition-shadow cursor-pointer">
                                    <CardContent className="p-4">
                                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                            {course.title}
                                        </h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                                            {course.description}
                                        </p>
                                        <div className="flex items-center justify-between">
                                            <div className="flex gap-4 text-sm">
                                                <div className="flex items-center gap-1">
                                                    <Users className="w-4 h-4 text-blue-500" />
                                                    <span className="text-gray-600 dark:text-gray-400">
                                                        {course.students_count}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <BookOpen className="w-4 h-4 text-green-500" />
                                                    <span className="text-gray-600 dark:text-gray-400">
                                                        {course.lessons_count}
                                                    </span>
                                                </div>
                                            </div>
                                            <Badge variant="outline" className="text-xs">
                                                {new Date(course.created_at).toLocaleDateString()}
                                            </Badge>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}