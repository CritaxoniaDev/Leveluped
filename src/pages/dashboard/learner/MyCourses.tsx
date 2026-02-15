import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/packages/supabase/supabase"
import { Button } from "@/packages/shadcn/ui/button"
import { Progress } from "@/packages/shadcn/ui/progress"
import { Badge } from "@/packages/shadcn/ui/badge"
import { toast } from "sonner"
import { ArrowLeft, BookOpen } from "lucide-react"

interface Course {
    id: string
    title: string
    description: string
    image_url?: string
    instructor_id: string
    instructor_name?: string
    difficulty?: string
    category?: string
}

interface EnrolledCourse extends Course {
    progress_percentage: number
    lessons_completed: number
    total_lessons: number
    enrolled_at: string
}

export default function MyCourses() {
    const navigate = useNavigate()
    const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([])
    const [loading, setLoading] = useState(true)
    const [, setUserStats] = useState<{ total_xp: number } | null>(null)

    useEffect(() => {
        fetchEnrolledCourses()
        fetchUserStats()
    }, [])

    const fetchUserStats = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            const { data: stats, error } = await supabase
                .from("user_stats")
                .select("total_xp")
                .eq("user_id", session.user.id)
                .single()

            if (error) throw error
            setUserStats(stats)
        } catch (error) {
            console.error("Error fetching user stats:", error)
        }
    }

    const fetchEnrolledCourses = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                navigate("/login")
                return
            }

            // Fetch enrollments with course info
            const { data: enrollments, error: enrollError } = await supabase
                .from("enrollments")
                .select(`
                    course_id,
                    progress_percentage,
                    enrolled_at,
                    courses (
                        id,
                        title,
                        description,
                        image_url,
                        instructor_id,
                        category
                    )
                `)
                .eq("user_id", session.user.id)

            if (enrollError) throw enrollError

            // Get lesson counts for each course
            const coursesWithDetails = await Promise.all(
                (enrollments || []).map(async (enrollment: any) => {
                    try {
                        // Get elearning content count
                        const { data: elearningContent, error: elearningError } = await supabase
                            .from("elearning_content")
                            .select("id")
                            .eq("course_id", enrollment.course_id)

                        if (elearningError) throw elearningError

                        // Get resource content count
                        const { data: resourceContent, error: resourceError } = await supabase
                            .from("resource_content")
                            .select("id")
                            .eq("course_id", enrollment.course_id)
                            .eq("status", "published")

                        if (resourceError) throw resourceError

                        // Total lessons = elearning content + resource content
                        const totalLessons = (elearningContent?.length || 0) + (resourceContent?.length || 0)

                        // Get completed elearning sections
                        const { data: completedElearning, error: completedElearningError } = await supabase
                            .from("elearning_progress")
                            .select("id")
                            .eq("user_id", session.user.id)
                            .in("elearning_content_id", elearningContent?.map(e => e.id) || [])

                        if (completedElearningError) throw completedElearningError

                        // Get completed resource attempts
                        const { data: completedResources, error: completedResourcesError } = await supabase
                            .from("resource_attempts")
                            .select("id")
                            .eq("user_id", session.user.id)
                            .eq("status", "completed")
                            .in("resource_content_id", resourceContent?.map(r => r.id) || [])

                        if (completedResourcesError) throw completedResourcesError

                        const lessonsCompleted = (completedElearning?.length || 0) + (completedResources?.length || 0)

                        // Fetch instructor name
                        const { data: instructor, error: instructorError } = await supabase
                            .from("users")
                            .select("name")
                            .eq("id", enrollment.courses.instructor_id)
                            .single()

                        if (instructorError) console.error("Error fetching instructor:", instructorError)

                        return {
                            id: enrollment.courses.id,
                            title: enrollment.courses.title,
                            description: enrollment.courses.description || "",
                            image_url: enrollment.courses.image_url,
                            instructor_id: enrollment.courses.instructor_id,
                            instructor_name: instructor?.name || "Unknown Instructor",
                            difficulty: "beginner",
                            category: enrollment.courses.category,
                            progress_percentage: enrollment.progress_percentage || 0,
                            lessons_completed: lessonsCompleted,
                            total_lessons: totalLessons,
                            enrolled_at: enrollment.enrolled_at
                        }
                    } catch (error) {
                        console.error(`Error processing course ${enrollment.course_id}:`, error)
                        return null
                    }
                })
            )

            // Filter out null courses
            setEnrolledCourses(coursesWithDetails.filter((course) => course !== null) as EnrolledCourse[])
        } catch (error: any) {
            console.error("Error fetching enrolled courses:", error)
            toast.error("Error", {
                description: "Failed to load your courses"
            })
        } finally {
            setLoading(false)
        }
    }

    const getDifficultyColor = (difficulty: string | undefined) => {
        switch (difficulty?.toLowerCase()) {
            case 'beginner':
                return 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300'
            case 'intermediate':
                return 'bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300'
            case 'advanced':
                return 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'
            default:
                return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading your courses...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 px-10 mx-auto py-6 px-4">
            {/* Back Button */}
            <Button
                variant="ghost"
                onClick={() => navigate(-1)}
                className="gap-2"
            >
                <ArrowLeft className="w-4 h-4" />
                Back
            </Button>

            {/* Header */}
            <div className="space-y-2">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                    My Courses
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    {enrolledCourses.length} course{enrolledCourses.length !== 1 ? 's' : ''} enrolled
                </p>
            </div>

            {/* Courses List */}
            {enrolledCourses.length === 0 ? (
                <div className="text-center py-16">
                    <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        No courses yet
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Start learning by enrolling in a course
                    </p>
                    <Button onClick={() => navigate("/dashboard/learner")}>
                        Browse Courses
                    </Button>
                </div>
            ) : (
                <div className="space-y-4">
                    {enrolledCourses.map((course) => (
                        <div
                            key={course.id}
                            className="group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-lg transition-shadow duration-300"
                        >
                            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 p-4 sm:p-6">
                                {/* Course Image */}
                                <div className="flex-shrink-0 w-full sm:w-48 h-40 sm:h-32 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg overflow-hidden">
                                    {course.image_url ? (
                                        <img
                                            src={course.image_url}
                                            alt={course.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <BookOpen className="w-12 h-12 text-white/50" />
                                        </div>
                                    )}
                                </div>

                                {/* Course Info */}
                                <div className="flex-1 min-w-0 flex flex-col justify-between">
                                    <div>
                                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate mb-1">
                                                    {course.title}
                                                </h3>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                                                    by {course.instructor_name}
                                                </p>
                                            </div>
                                            <div className="flex gap-2 flex-shrink-0">
                                                <Badge variant="outline" className={`text-xs capitalize ${getDifficultyColor(course.difficulty || 'beginner')}`}>
                                                    {course.difficulty || 'Beginner'}
                                                </Badge>
                                                {course.progress_percentage === 100 && (
                                                    <Badge className="bg-green-500 text-white text-xs">
                                                        Completed
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>

                                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                                            {course.description}
                                        </p>

                                        {/* Course Stats */}
                                        <div className="flex flex-wrap gap-3 text-xs text-gray-600 dark:text-gray-400 mb-4">
                                            <div className="flex items-center gap-1">
                                                <BookOpen className="w-4 h-4" />
                                                <span>{course.lessons_completed}/{course.total_lessons} lessons</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                                Progress
                                            </span>
                                            <span className="text-xs font-bold text-gray-900 dark:text-white">
                                                {course.progress_percentage}%
                                            </span>
                                        </div>
                                        <Progress value={course.progress_percentage} className="h-2" />
                                    </div>
                                </div>

                                {/* Action Button */}
                                <div className="flex sm:flex-col gap-2 sm:gap-0 sm:justify-center flex-shrink-0">
                                    <Button
                                        onClick={() => navigate(`/dashboard/learner/course/${course.id}`)}
                                        className="w-full sm:w-32"
                                    >
                                        {course.progress_percentage === 100 ? "Review" : "Continue"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}