import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { supabase } from "@/packages/supabase/supabase"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { ArrowLeft, BookOpen, Trophy, Play, CheckCircle, ChevronRight, Clock, Users, MessageCircle } from "lucide-react"

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
    id: string
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
    const [selectedModule, setSelectedModule] = useState<string | null>(null)
    const [completedModules, setCompletedModules] = useState<Set<string>>(new Set())

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

            // Fetch resource contents and elearning contents
            await fetchResourceContents()
            await fetchElearningContents()

            // Calculate overall progress
            await calculateAndUpdateProgress(session.user.id, enrollmentData.id)

            // Refetch enrollment to get updated progress
            const { data: updatedEnrollment } = await supabase
                .from("enrollments")
                .select("*")
                .eq("id", enrollmentData.id)
                .single()

            setEnrollment(updatedEnrollment)

            // Set first module as selected
            if (resourceContents.length > 0) {
                setSelectedModule(resourceContents[0].id)
            }
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

    const calculateAndUpdateProgress = async (userId: string, enrollmentId: string) => {
        try {
            const { data: resources } = await supabase
                .from("resource_content")
                .select("id")
                .eq("course_id", id)
                .eq("status", "published")

            const totalResources = resources?.length || 0

            const { data: completedAttempts } = await supabase
                .from("resource_attempts")
                .select("resource_content_id")
                .eq("user_id", userId)
                .eq("status", "completed")
                .in("resource_content_id", resources?.map(r => r.id) || [])

            const completedResources = new Set(completedAttempts?.map(a => a.resource_content_id))
            setCompletedModules(completedResources)

            const { data: elearnings } = await supabase
                .from("elearning_content")
                .select("id, content")
                .eq("course_id", id)

            let totalElearningSections = 0
            elearnings?.forEach(e => {
                totalElearningSections += e.content.sections?.length || 0
            })

            let completedElearningSections = 0
            for (const elearning of elearnings || []) {
                const { data: progress } = await supabase
                    .from("elearning_progress")
                    .select("completed_sections")
                    .eq("user_id", userId)
                    .eq("elearning_content_id", elearning.id)
                    .maybeSingle()

                if (progress) {
                    completedElearningSections += progress.completed_sections.length
                }
            }

            const totalActivities = totalResources + totalElearningSections
            const completedActivities = completedResources.size + completedElearningSections
            const progressPercentage = totalActivities > 0 ? Math.round((completedActivities / totalActivities) * 100) : 0

            const { error } = await supabase
                .from("enrollments")
                .update({
                    progress_percentage: progressPercentage,
                    completed_at: progressPercentage === 100 ? new Date().toISOString() : null
                })
                .eq("id", enrollmentId)

            if (error) throw error
        } catch (error) {
            console.error("Error calculating progress:", error)
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
            <div className="flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading course...</p>
                </div>
            </div>
        )
    }

    if (!course || !enrollment) {
        return (
            <div className="flex items-center justify-center">
                <p className="text-gray-600 dark:text-gray-400">Course not found or access denied</p>
            </div>
        )
    }

    return (
        <div className="flex">
            {/* Sticky Sidebar - Modules List */}
            <aside className="sticky top-0 w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
                {/* Course Info in Sidebar */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate("/dashboard/learner")}
                        className="mb-4 w-full justify-start"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>

                    <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 truncate">
                        {course.title}
                    </h2>
                    <Badge variant="outline" className="capitalize text-xs mb-4">
                        {course.category}
                    </Badge>

                    {/* Progress */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-600 dark:text-gray-400">Progress</span>
                            <span className="font-semibold text-gray-900 dark:text-white">{enrollment.progress_percentage}%</span>
                        </div>
                        <Progress value={enrollment.progress_percentage} className="h-2" />
                    </div>
                </div>

                {/* Modules/Activities List */}
                <div className="p-6">
                    <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                        Course Modules
                    </h3>

                    <nav className="space-y-2">
                        {/* Quizzes & Challenges */}
                        {resourceContents.length > 0 && (
                            <>
                                <div className="mb-4">
                                    <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                        <Trophy className="w-3.5 h-3.5" />
                                        Activities
                                    </h4>
                                    <ul className="space-y-1">
                                        {resourceContents.map((content) => {
                                            const isCompleted = completedModules.has(content.id)
                                            return (
                                                <li key={content.id}>
                                                    <Button
                                                        variant={selectedModule === content.id ? "default" : "ghost"}
                                                        size="sm"
                                                        onClick={() => setSelectedModule(content.id)}
                                                        className={`w-full justify-start text-xs h-9 ${selectedModule === content.id
                                                                ? "bg-blue-600 text-white dark:bg-blue-700"
                                                                : "text-gray-700 dark:text-gray-300"
                                                            }`}
                                                    >
                                                        <div className="w-4 h-4 rounded-full flex items-center justify-center mr-2 flex-shrink-0 bg-gray-200 dark:bg-gray-700">
                                                            {isCompleted ? (
                                                                <CheckCircle className="w-3 h-3 text-green-600" />
                                                            ) : (
                                                                <span className="text-xs font-bold text-gray-600 dark:text-gray-400">
                                                                    {resourceContents.indexOf(content) + 1}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="flex-1 text-left truncate">{content.title}</span>
                                                        <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 opacity-50" />
                                                    </Button>
                                                </li>
                                            )
                                        })}
                                    </ul>
                                </div>
                            </>
                        )}

                        {/* E-Learning Contents */}
                        {elearningContents.length > 0 && (
                            <div>
                                <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                    <BookOpen className="w-3.5 h-3.5" />
                                    Learning Materials
                                </h4>
                                <ul className="space-y-1">
                                    {elearningContents.map((content, idx) => (
                                        <li key={content.id}>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => navigate(`/dashboard/learner/course/${id}/elearning/${content.id}`)}
                                                className="w-full justify-start text-xs h-9 text-gray-700 dark:text-gray-300"
                                            >
                                                <div className="w-4 h-4 rounded-full flex items-center justify-center mr-2 flex-shrink-0 bg-gray-200 dark:bg-gray-700">
                                                    <span className="text-xs font-bold text-gray-600 dark:text-gray-400">
                                                        {resourceContents.length + idx + 1}
                                                    </span>
                                                </div>
                                                <span className="flex-1 text-left truncate">{content.title}</span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                                                    {content.content.sections?.length || 0}
                                                </span>
                                            </Button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </nav>
                </div>
                {/* Feedback Section */}
                <div className="border-t border-gray-200 dark:border-gray-700 p-6">
                    <Button
                        onClick={() => navigate(`/dashboard/learner/course/${id}/feedback`)}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Leave Feedback
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <div className="mx-auto px-8 py-10">
                    {/* Hero Section */}
                    <div className="mb-10">
                        <div className="relative h-80 rounded-xl overflow-hidden mb-8 shadow-lg">
                            <img
                                src={course.image_url || "/placeholder-course.jpg"}
                                alt={course.title}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-gray-900/20 to-transparent"></div>
                            <div className="absolute bottom-0 left-0 right-0 p-8">
                                <h1 className="text-4xl font-bold text-white mb-2">
                                    {course.title}
                                </h1>
                                <p className="text-gray-200 text-lg max-w-2xl">
                                    {course.description}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Course Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
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
                                    {enrollment.progress_percentage}%
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Progress</p>
                            </CardContent>
                        </Card>

                        <Card className="border-0 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
                            <CardContent className="p-6 text-center">
                                <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-1">
                                    {resourceContents.length + elearningContents.length}
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Modules</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Course Info */}
                    <Card className="mb-10 border-0 shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex flex-wrap items-center gap-6 text-sm">
                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                    <Users className="w-4 h-4" />
                                    <span>Instructor: <span className="font-semibold text-gray-900 dark:text-white">{course.instructor_name}</span></span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                    <Clock className="w-4 h-4" />
                                    <span>Enrolled: <span className="font-semibold text-gray-900 dark:text-white">{formatDate(enrollment.enrolled_at)}</span></span>
                                </div>
                                {enrollment.completed_at && (
                                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                                        <CheckCircle className="w-4 h-4" />
                                        <span>Completed: <span className="font-semibold">{formatDate(enrollment.completed_at)}</span></span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Selected Module Details */}
                    {selectedModule && (
                        <div className="mb-10">
                            {resourceContents.find(r => r.id === selectedModule) && (
                                <div>
                                    {(() => {
                                        const content = resourceContents.find(r => r.id === selectedModule)!
                                        const isCompleted = completedModules.has(content.id)
                                        return (
                                            <Card className="border-0 shadow-lg overflow-hidden">
                                                <div className={`h-2 bg-gradient-to-r ${content.difficulty === 'beginner' ? 'from-green-400 to-green-600' :
                                                        content.difficulty === 'intermediate' ? 'from-yellow-400 to-yellow-600' :
                                                            'from-red-400 to-red-600'
                                                    }`}></div>
                                                <CardContent className="p-8">
                                                    <div className="flex items-start justify-between mb-6">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3 mb-3">
                                                                <div className={`p-3 rounded-lg ${content.type === 'quiz'
                                                                        ? 'bg-blue-100 dark:bg-blue-900/30'
                                                                        : 'bg-green-100 dark:bg-green-900/30'
                                                                    }`}>
                                                                    {content.type === 'quiz' ? (
                                                                        <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                                                    ) : (
                                                                        <Trophy className="w-6 h-6 text-green-600 dark:text-green-400" />
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                                                        {content.title}
                                                                    </h2>
                                                                    <div className="flex items-center gap-2 mt-1">
                                                                        <Badge className={`text-xs ${getDifficultyColor(content.difficulty)}`}>
                                                                            {content.difficulty}
                                                                        </Badge>
                                                                        {isCompleted && (
                                                                            <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                                                                                ✓ Completed
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg">
                                                        {content.description}
                                                    </p>

                                                    {/* Module Meta Info */}
                                                    <div className="grid grid-cols-3 gap-4 mb-8 py-6 border-y border-gray-200 dark:border-gray-700">
                                                        <div>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold mb-1">
                                                                Type
                                                            </p>
                                                            <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                                                                {content.type}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold mb-1">
                                                                Questions
                                                            </p>
                                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                                {content.question_count}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold mb-1">
                                                                Rewards
                                                            </p>
                                                            <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                                                                +{content.quests?.[0]?.xp_reward || 0} XP
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <Button
                                                        onClick={() => handleStartContent(content.id)}
                                                        size="lg"
                                                        className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                                                    >
                                                        <Play className="w-5 h-5 mr-2" />
                                                        {isCompleted ? "Retry" : "Start"} {content.type === 'quiz' ? 'Quiz' : 'Challenge'}
                                                    </Button>
                                                </CardContent>
                                            </Card>
                                        )
                                    })()}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Spacer */}
                    <div className="h-10"></div>
                </div>
            </main>
        </div>
    )
}