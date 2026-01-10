import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { ArrowLeft, BookOpen, Trophy, Play } from "lucide-react"

interface Course {
    id: string
    title: string
    description: string
    category: string
    image_url: string
    levels: number
    max_xp: number
    instructor_name: string
}

interface ElearningContent {
    id: string
    topic: string
    title: string
    content: any
}

interface ResourceContent {
    id: string
    title: string
    description: string
    type: "quiz" | "challenge"
    difficulty: "beginner" | "intermediate" | "advanced"
    topic: string
    question_count: number
    status: "draft" | "published"
    quests: any[]
}

interface Enrollment {
    progress_percentage: number
    enrolled_at: string
    completed_at: string | null
}

export default function Course() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [course, setCourse] = useState<Course | null>(null)
    const [resourceContents, setResourceContents] = useState<ResourceContent[]>([])
    const [elearningContents, setElearningContents] = useState<ElearningContent[]>([])
    const [enrollment, setEnrollment] = useState<Enrollment | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (id) {
            fetchCourseData()
        }
    }, [id])

    const fetchCourseData = async () => {
        try {
            setLoading(true)
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                navigate("/login")
                return
            }

            // Fetch course details
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
          users (
            name
          )
        `)
                .eq("id", id)
                .single()

            if (courseError) throw courseError

            // Check enrollment
            const { data: enrollmentData, error: enrollmentError } = await supabase
                .from("enrollments")
                .select("*")
                .eq("user_id", session.user.id)
                .eq("course_id", id)
                .single()

            if (enrollmentError || !enrollmentData) {
                toast.error("Not Enrolled", {
                    description: "You are not enrolled in this course"
                })
                navigate("/dashboard/learner")
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
                instructor_name: (courseData.users as any)?.name || "Unknown Instructor"
            })

            setEnrollment(enrollmentData)

            // Fetch resource contents
            await fetchResourceContents()
            await fetchElearningContents()
        } catch (error: any) {
            console.error("Error fetching course data:", error)
            toast.error("Error", {
                description: "Failed to load course"
            })
            navigate("/dashboard/learner")
        } finally {
            setLoading(false)
        }
    }

    const fetchElearningContents = async () => {
        try {
            const { data, error } = await supabase
                .from("elearning_content")
                .select("id, topic, title, content")
                .eq("course_id", id)
                .order("created_at", { ascending: true })

            if (error) throw error
            setElearningContents(data || [])
        } catch (error) {
            console.error("Error fetching elearning contents:", error)
        }
    }

    const fetchResourceContents = async () => {
        try {
            const { data, error } = await supabase
                .from("resource_content")
                .select("id, title, description, type, difficulty, topic, question_count, status, quests")
                .eq("course_id", id)
                .eq("status", "published")
                .order("created_at", { ascending: true })

            if (error) throw error
            setResourceContents(data || [])
        } catch (error) {
            console.error("Error fetching resource contents:", error)
        }
    }

    const handleStartContent = (contentId: string) => {
        navigate(`/dashboard/learner/course/${id}/resource/${contentId}`)
    }

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case "beginner": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
            case "intermediate": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
            case "advanced": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
            default: return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        })
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading course...</p>
                </div>
            </div>
        )
    }

    if (!course || !enrollment) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-gray-600 dark:text-gray-400">Course not found or access denied</p>
            </div>
        )
    }

    return (
        <div className="dark:from-[#18181b] dark:to-[#27272a]">
            <div className="mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Button variant="ghost" onClick={() => navigate("/dashboard/learner")}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Dashboard
                    </Button>
                </div>

                {/* Course Header */}
                <Card className="mb-8">
                    <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row gap-6">
                            <img
                                src={course.image_url || "/placeholder-course.jpg"}
                                alt={course.title}
                                className="w-full md:w-64 h-48 object-cover rounded-lg"
                            />
                            <div className="flex-1">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                            {course.title}
                                        </h1>
                                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                                            {course.description}
                                        </p>
                                    </div>
                                    <Badge variant="outline" className="capitalize">
                                        {course.category}
                                    </Badge>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-blue-600">{course.levels}</div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">Levels</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-green-600">{course.max_xp.toLocaleString()}</div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">Max XP</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-purple-600">{enrollment.progress_percentage}%</div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">Progress</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-orange-600">{resourceContents.length}</div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">Activities</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                    <span>Instructor: {course.instructor_name}</span>
                                    <span>Enrolled: {formatDate(enrollment.enrolled_at)}</span>
                                    {enrollment.completed_at && (
                                        <span className="text-green-600">Completed: {formatDate(enrollment.completed_at)}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Progress Bar */}
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle>Your Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Course Completion</span>
                                <span>{enrollment.progress_percentage}%</span>
                            </div>
                            <Progress value={enrollment.progress_percentage} className="h-3" />
                        </div>
                    </CardContent>
                </Card>

                {/* Course Content */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BookOpen className="w-5 h-5" />
                            Course Activities
                        </CardTitle>
                        <CardDescription>
                            Complete quizzes and challenges to earn XP and progress through the course
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {resourceContents.length === 0 ? (
                            <div className="text-center py-8">
                                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500 dark:text-gray-400">
                                    No activities available yet. Check back soon!
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {resourceContents.map((content) => (
                                    <div key={content.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <div className="flex items-start gap-4">
                                            <div className="flex-shrink-0">
                                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${content.type === 'quiz' ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-green-100 dark:bg-green-900/30'}`}>
                                                    {content.type === 'quiz' ? (
                                                        <BookOpen className="w-6 h-6 text-blue-600" />
                                                    ) : (
                                                        <Trophy className="w-6 h-6 text-green-600" />
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-semibold text-gray-900 dark:text-white">
                                                        {content.title}
                                                    </h3>
                                                    <Badge className={`text-xs ${getDifficultyColor(content.difficulty)}`}>
                                                        {content.difficulty}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                                    {content.description}
                                                </p>
                                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                                    <span className="capitalize">{content.type}</span>
                                                    <span>{content.question_count} questions</span>
                                                    <span>{content.topic}</span>
                                                    {content.quests && content.quests.length > 0 && (
                                                        <span className="text-yellow-600 font-medium">
                                                            +{content.quests[0].xp_reward} XP available
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                onClick={() => handleStartContent(content.id)}
                                                size="sm"
                                            >
                                                <Play className="w-4 h-4 mr-1" />
                                                Start
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* E-Learning Content */}
                {elearningContents.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>E-Learning Materials</CardTitle>
                            <CardDescription>
                                Detailed learning content with external resources
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {elearningContents.map((content) => (
                                    <div key={content.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <div>
                                            <h3 className="font-medium text-gray-900 dark:text-white">
                                                {content.title}
                                            </h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {content.topic} • {content.content.sections?.length || 0} sections
                                            </p>
                                        </div>
                                        <Button
                                            onClick={() => navigate(`/dashboard/learner/course/${id}/elearning/${content.id}`)}
                                            variant="outline"
                                        >
                                            <BookOpen className="w-4 h-4 mr-1" />
                                            Learn
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}