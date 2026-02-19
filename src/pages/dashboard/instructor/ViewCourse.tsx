import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { supabase } from "@/packages/supabase/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/packages/shadcn/ui/card"
import { Button } from "@/packages/shadcn/ui/button"
import { Input } from "@/packages/shadcn/ui/input"
import { Textarea } from "@/packages/shadcn/ui/textarea"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/packages/shadcn/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/packages/shadcn/ui/alert-dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/packages/shadcn/ui/select"
import { Badge } from "@/packages/shadcn/ui/badge"
import { toast } from "sonner"
import { ArrowLeft, Trophy, Target, Award, Eye, Users, Star, Plus, Brain, FileQuestion, BookOpen, MessageSquare, Trash2 } from "lucide-react"

interface Course {
    id: string
    title: string
    description: string
    category: string
    image_url: string
    levels: number
    max_xp: number
    leaderboard_enabled: boolean
    badges_enabled: boolean
    quests_enabled: boolean
    premium_enabled: boolean
    status: "draft" | "published" | "archived"
    created_at: string
    updated_at: string
}

interface ResourceContent {
    id: string
    type: "quiz" | "challenge"
    title: string
    description: string
    topic: string
    difficulty: "beginner" | "intermediate" | "advanced"
    question_count: number
    status: "draft" | "published"
    created_at: string
    quests?: any[]
}

interface ElearningContent {
    id: string
    title: string
    content: {
        sections: Array<{
            title: string
            content: string
        }>
    }
}

export default function ViewCourse() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [course, setCourse] = useState<Course | null>(null)
    const [resourceContents, setResourceContents] = useState<ResourceContent[]>([])
    const [elearningContents, setElearningContents] = useState<ElearningContent[]>([])
    const [loading, setLoading] = useState(true)
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [creating, setCreating] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [deleting, setDeleting] = useState(false)
    const [stats, setStats] = useState({
        totalStudents: 0,
        avgRating: 0,
    })
    const [formData, setFormData] = useState({
        type: "quiz" as "quiz" | "challenge",
        title: "",
        description: "",
        topic: "",
        difficulty: "beginner" as "beginner" | "intermediate" | "advanced",
        question_count: 5,
        time_limit: 10,
        selectedElearningId: "" as string,
    })


    useEffect(() => {
        if (id) {
            fetchCourse()
            fetchCourseStats()
            fetchResourceContents()
            fetchElearningContents()
        }
    }, [id])

    // Add attempts calculation
    // const getMaxAttempts = (difficulty: string) => {
    //     switch (difficulty) {
    //         case "beginner": return 3
    //         case "intermediate": return 2
    //         case "advanced": return 1
    //         default: return 3
    //     }
    // }

    const fetchElearningContents = async () => {
        try {
            const { data, error } = await supabase
                .from("elearning_content")
                .select("id, title, content")
                .eq("course_id", id)
                .order("created_at", { ascending: false })

            if (error) throw error
            setElearningContents(data || [])
        } catch (error: any) {
            console.error("Error fetching e-learning contents:", error)
        }
    }

    const fetchCourse = async () => {
        try {
            setLoading(true)
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            const { data, error } = await supabase
                .from("courses")
                .select("*")
                .eq("id", id)
                .eq("instructor_id", session.user.id)
                .single()

            if (error) throw error
            setCourse(data)
        } catch (error: any) {
            console.error("Error fetching course:", error)
            toast.error("Error", {
                description: "Failed to load course details"
            })
            navigate("/dashboard/instructor/courses")
        } finally {
            setLoading(false)
        }
    }

    const fetchCourseStats = async () => {
        try {
            // Fetch enrolled students count
            const { count: studentsCount, error: studentsError } = await supabase
                .from("enrollments")
                .select("*", { count: "exact", head: true })
                .eq("course_id", id)

            if (studentsError && studentsError.code !== "PGRST116") throw studentsError

            // Fetch average rating
            const { data: reviews, error: reviewsError } = await supabase
                .from("reviews")
                .select("rating")
                .eq("course_id", id)

            if (reviewsError && reviewsError.code !== "PGRST116") throw reviewsError

            const avgRating = reviews && reviews.length > 0
                ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
                : 0

            setStats({
                totalStudents: studentsCount || 0,
                avgRating: Math.round(avgRating * 10) / 10,
            })
        } catch (error: any) {
            console.error("Error fetching course stats:", error)
        }
    }

    const fetchResourceContents = async () => {
        try {
            const { data, error } = await supabase
                .from("resource_content")
                .select("id, type, title, description, topic, difficulty, question_count, status, created_at")
                .eq("course_id", id)
                .order("created_at", { ascending: false })

            if (error) throw error
            setResourceContents(data || [])
        } catch (error: any) {
            console.error("Error fetching resource contents:", error)
        }
    }

    const handleResourceStatusChange = async (resourceId: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from("resource_content")
                .update({ status: newStatus })
                .eq("id", resourceId)

            if (error) throw error

            // Update local state
            setResourceContents(resourceContents.map(c => c.id === resourceId ? { ...c, status: newStatus as "draft" | "published" } : c))

            toast.success("Status updated", {
                description: "Resource content status has been changed successfully"
            })
        } catch (error: any) {
            console.error("Error updating resource status:", error)
            toast.error("Error", {
                description: "Failed to update resource content status"
            })
        }
    }

    const generateContentWithAI = async (prompt: string) => {
        try {
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${import.meta.env.VITE_PUBLIC_OPENROUTER_API_KEY}`,
                    "HTTP-Referer": window.location.origin, // Optional: your site URL
                    "X-Title": "LevelUpED", // Optional: your site name
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "mistralai/mistral-small-3.1-24b-instruct:free",
                    messages: [
                        {
                            role: "user",
                            content: [
                                {
                                    type: "text",
                                    text: prompt
                                }
                            ]
                        }
                    ]
                })
            })

            if (!response.ok) {
                const errorText = await response.text()
                console.error('OpenRouter API error:', errorText)
                throw new Error(`API error: ${response.status} - ${errorText}`)
            }

            const data = await response.json()
            // OpenRouter returns the result in choices[0].message.content
            if (data.choices && data.choices[0]?.message?.content) {
                return data.choices[0].message.content
            } else {
                console.error('Unexpected API response structure:', data)
                return null
            }
        } catch (error) {
            console.error("Error generating content with AI:", error)
            return null
        }
    }

    const handleCreateResourceContent = async () => {
        try {
            setCreating(true)
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            // Calculate the next topic index for this course
            const { data: existingContents, error: indexError } = await supabase
                .from("resource_content")
                .select("topic_index")
                .eq("course_id", id)
                .order("topic_index", { ascending: false })
                .limit(1)

            if (indexError) throw indexError

            const nextIndex = existingContents && existingContents.length > 0 ? (existingContents[0].topic_index || 0) + 1 : 1
            const autoTitle = `Topic ${nextIndex}`

            // Get selected e-learning content if any
            let additionalContext = ""
            if (formData.selectedElearningId) {
                const selectedContent = elearningContents.find(c => c.id === formData.selectedElearningId)
                if (selectedContent) {
                    additionalContext = `\n\nAdditional context from e-learning content "${selectedContent.title}":\n${selectedContent.content.sections.map(s => `${s.title}: ${s.content}`).join('\n')}`
                }
            }

            const challengeJsonFormat = `[
                {
                    "id": 1,
                    "question": "Fill in the blank: [BLANK] is essential for success in ${course?.category}.",
                    "answer": "example answer",
                    "explanation": "Explanation based on ${course?.category} principles.",
                    "code_example": "${course?.category === 'Programming' ? 'javascript\\n// Example code\\n' : 'text\\n// General example\\n'}",
                    "difficulty": "${formData.difficulty}"
                }
            ]`

            const quizJsonFormat = `[
                {
                    "id": 1,
                    "question": "What is the capital of France?",
                    "options": ["London", "Berlin", "Paris", "Madrid"],
                    "correct_answer": "C",
                    "explanation": "Paris is the capital and largest city of France."
                }
            ]`

            // Generate AI prompt for content
            const contentPrompt = formData.type === "challenge"
                ? `Generate ${formData.question_count} fill-in-the-blank questions for the course "${course?.title}" on the topic "${formData.topic}" with ${formData.difficulty} difficulty level in the ${course?.category} category.${additionalContext}

            Each question should include:
            - A clear fill-in-the-blank question (use [BLANK] for blanks)
            - The correct answer
            - An explanation
            - A code example if applicable (for Programming), or text example otherwise (wrap in \`\`\`language or \`\`\`text)

            Return ONLY a valid JSON array with no additional text. Format:
            ${challengeJsonFormat}`
                : `Generate ${formData.question_count} multiple choice questions for the course "${course?.title}" on the topic "${formData.topic}" with ${formData.difficulty} difficulty level in the ${course?.category} category.${additionalContext}

            Each question should include:
            - A clear question
            - Four options as a plain array (e.g. ["London", "Berlin", "Paris", "Madrid"])
            - The correct answer (must match one of the options exactly)
            - An explanation

            Return ONLY a valid JSON array with no additional text. Format:
            ${quizJsonFormat}`

            // Generate AI prompt for quests
            const questsPrompt = `Generate 3-5 gamified quests for students completing ${formData.type} content on "${formData.topic}" in the course "${course?.title}".${additionalContext}

                Each quest should be:
                - Engaging and achievable
                - Related to the content
                - Include XP rewards (50-200 XP)
                - Have clear completion criteria

                Return ONLY a valid JSON array with no additional text. Format:
                [
                {
                    "id": 1,
                    "title": "Quiz Master",
                    "description": "Answer all questions correctly in the quiz",
                    "xp_reward": 100,
                    "completion_criteria": "Score 100% on the quiz"
                }
                ]`

            // Generate content and quests using AI
            const [generatedContent, generatedQuests] = await Promise.all([
                generateContentWithAI(contentPrompt),
                generateContentWithAI(questsPrompt)
            ])

            let parsedContent = null
            let parsedQuests = null

            try {
                const cleanedContent = generatedContent?.trim().replace(/```json\s*|\s*```/g, '') || '[]'
                parsedContent = JSON.parse(cleanedContent)
                if (formData.type === "challenge") {
                    if (!Array.isArray(parsedContent) || parsedContent.length === 0) {
                        throw new Error('Invalid challenge structure')
                    }
                } else {
                    if (!Array.isArray(parsedContent) || parsedContent.length === 0) {
                        throw new Error('Invalid content structure')
                    }
                }
            } catch (e) {
                console.error('Failed to parse AI content response:', e)
                if (formData.type === "challenge") {
                    parsedContent = Array.from({ length: formData.question_count }, (_, i) => ({
                        id: i + 1,
                        question: `Sample fill-in-the-blank question ${i + 1} with [BLANK]`,
                        answer: "sample answer",
                        explanation: "Sample explanation",
                        code_example: "```javascript\n// sample code\n```",
                        difficulty: formData.difficulty
                    }))
                } else {
                    parsedContent = Array.from({ length: formData.question_count }, (_, i) => ({
                        id: i + 1,
                        question: `Sample ${formData.type} question ${i + 1}`,
                        options: formData.type === 'quiz' ? ['A', 'B', 'C', 'D'] : undefined,
                        correct_answer: formData.type === 'quiz' ? 'A' : undefined,
                        explanation: formData.type === 'quiz' ? 'Sample explanation' : undefined
                    }))
                }
            }

            try {
                const cleanedQuests = generatedQuests?.trim().replace(/```json\s*|\s*```/g, '') || '[]'
                parsedQuests = JSON.parse(cleanedQuests)
                if (!Array.isArray(parsedQuests)) {
                    throw new Error('Invalid quests structure')
                }
            } catch (e) {
                console.error('Failed to parse AI quests response:', e)
                parsedQuests = [
                    {
                        id: 1,
                        title: "Complete the Content",
                        description: "Finish all questions in the resource content",
                        xp_reward: 50,
                        completion_criteria: "Complete 100% of the content"
                    },
                    {
                        id: 2,
                        title: "Quick Learner",
                        description: "Complete the content in under 5 minutes",
                        xp_reward: 75,
                        completion_criteria: "Finish within time limit"
                    }
                ]
            }

            const { data, error } = await supabase
                .from("resource_content")
                .insert({
                    course_id: id,
                    type: formData.type,
                    title: autoTitle,
                    description: formData.description,
                    topic: formData.topic,
                    difficulty: formData.difficulty,
                    question_count: formData.question_count,
                    content: parsedContent,
                    quests: parsedQuests,
                    topic_index: nextIndex,
                    time_limit: formData.time_limit,
                    ai_prompt: `${contentPrompt}\n\n---\n\n${questsPrompt}`,
                    generated_at: new Date().toISOString(),
                })
                .select()
                .single()

            if (error) throw error

            setResourceContents([data, ...resourceContents])
            setFormData({
                type: "quiz",
                title: "",
                description: "",
                topic: "",
                difficulty: "beginner",
                question_count: 5,
                time_limit: 10,
                selectedElearningId: "",
            })
            setIsCreateDialogOpen(false)
            toast.success("Resource content created", {
                description: `${formData.type === 'quiz' ? 'Quiz' : 'Challenge'} "${autoTitle}" has been created successfully`
            })
        } catch (error: any) {
            console.error("Error creating resource content:", error)
            toast.error("Error", {
                description: "Failed to create resource content"
            })
        } finally {
            setCreating(false)
        }
    }

    const handleDeleteResourceContent = async (resourceId: string) => {
        try {
            setDeleting(true)
            const { error } = await supabase
                .from("resource_content")
                .delete()
                .eq("id", resourceId)

            if (error) throw error

            // Update local state
            setResourceContents(resourceContents.filter(c => c.id !== resourceId))
            setDeleteDialogOpen(false)
            setDeletingId(null)

            toast.success("Resource deleted", {
                description: "Resource content has been deleted successfully"
            })
        } catch (error: any) {
            console.error("Error deleting resource content:", error)
            toast.error("Error", {
                description: "Failed to delete resource content"
            })
        } finally {
            setDeleting(false)
        }
    }

    const openDeleteDialog = (resourceId: string) => {
        setDeletingId(resourceId)
        setDeleteDialogOpen(true)
    }

    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case "published":
                return "default"
            case "draft":
                return "secondary"
            case "archived":
                return "outline"
            default:
                return "outline"
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
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading course...</p>
                </div>
            </div>
        )
    }

    if (!course) {
        return (
            <div className="flex items-center justify-center h-96">
                <p className="text-gray-600 dark:text-gray-400">Course not found</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => navigate("/dashboard/instructor/courses")}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Courses
                </Button>
                <Button onClick={() => navigate(`/dashboard/instructor/courses/${id}/elearning`)}>
                    <BookOpen className="w-4 h-4 mr-2" />
                    E-Learning Content
                </Button>
                <Button
                    onClick={() => navigate(`/dashboard/instructor/courses/${id}/feedback`)}
                    className="flex items-center gap-2"
                >
                    <MessageSquare className="w-4 h-4" />
                    View Feedback
                </Button>
            </div>

            {/* Course Header */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                        <img
                            src={course.image_url || "/placeholder-course.jpg"}
                            alt={course.title}
                            className="w-full md:w-64 h-48 object-cover rounded-lg"
                        />
                        <div className="flex-1 space-y-4">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                    {course.title}
                                </h1>
                                <p className="text-gray-600 dark:text-gray-400 mt-2">
                                    {course.description}
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Badge variant="outline" className="capitalize">
                                    {course.category}
                                </Badge>
                                <Badge variant={getStatusBadgeVariant(course.status)} className="capitalize">
                                    {course.status}
                                </Badge>
                                {course.premium_enabled && (
                                    <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">
                                        Premium
                                    </Badge>
                                )}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                Created on {formatDate(course.created_at)}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalStudents}</div>
                        <p className="text-xs text-muted-foreground">Enrolled learners</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Levels</CardTitle>
                        <Trophy className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{course.levels}</div>
                        <p className="text-xs text-muted-foreground">Course progression</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Max XP</CardTitle>
                        <Star className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{course.max_xp.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Experience points</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                        <Star className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.avgRating}</div>
                        <p className="text-xs text-muted-foreground">Student feedback</p>
                    </CardContent>
                </Card>
            </div>

            {/* Features */}
            <Card>
                <CardHeader>
                    <CardTitle>Gamification Features</CardTitle>
                    <CardDescription>Enabled features for this course</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className={`flex items-center gap-2 p-3 rounded-lg ${course.leaderboard_enabled ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-gray-50 dark:bg-gray-800'}`}>
                            <Target className={`w-5 h-5 ${course.leaderboard_enabled ? 'text-blue-600' : 'text-gray-400'}`} />
                            <span className={`text-sm font-medium ${course.leaderboard_enabled ? 'text-blue-700 dark:text-blue-300' : 'text-gray-500'}`}>
                                Leaderboard
                            </span>
                        </div>
                        <div className={`flex items-center gap-2 p-3 rounded-lg ${course.badges_enabled ? 'bg-purple-50 dark:bg-purple-900/20' : 'bg-gray-50 dark:bg-gray-800'}`}>
                            <Award className={`w-5 h-5 ${course.badges_enabled ? 'text-purple-600' : 'text-gray-400'}`} />
                            <span className={`text-sm font-medium ${course.badges_enabled ? 'text-purple-700 dark:text-purple-300' : 'text-gray-500'}`}>
                                Badges
                            </span>
                        </div>
                        <div className={`flex items-center gap-2 p-3 rounded-lg ${course.quests_enabled ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-50 dark:bg-gray-800'}`}>
                            <Trophy className={`w-5 h-5 ${course.quests_enabled ? 'text-green-600' : 'text-gray-400'}`} />
                            <span className={`text-sm font-medium ${course.quests_enabled ? 'text-green-700 dark:text-green-300' : 'text-gray-500'}`}>
                                Quests
                            </span>
                        </div>
                        <div className={`flex items-center gap-2 p-3 rounded-lg ${course.premium_enabled ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'bg-gray-50 dark:bg-gray-800'}`}>
                            <Star className={`w-5 h-5 ${course.premium_enabled ? 'text-yellow-600' : 'text-gray-400'}`} />
                            <span className={`text-sm font-medium ${course.premium_enabled ? 'text-yellow-700 dark:text-yellow-300' : 'text-gray-500'}`}>
                                Premium
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Resource Content */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <FileQuestion className="w-5 h-5" />
                                Quizzes & Challenges
                            </CardTitle>
                            <CardDescription>
                                Interactive content for your course ({resourceContents.length} items)
                            </CardDescription>
                        </div>
                        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Create Content
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[600px]">
                                <DialogHeader>
                                    <DialogTitle>Create Quiz or Challenge</DialogTitle>
                                    <DialogDescription>
                                        Generate AI-powered interactive content for your course.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                                    <div className="grid gap-4 py-4">
                                        <div className="grid grid-cols-1 gap-4">
                                            <div className="space-y-2">
                                                <label htmlFor="type" className="text-sm font-medium">
                                                    Type
                                                </label>
                                                <Select value={formData.type} onValueChange={(value: "quiz" | "challenge") => {
                                                    setFormData({
                                                        ...formData,
                                                        type: value,
                                                        question_count: value === "challenge" ? 5 : 5
                                                    })
                                                }}>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="quiz">Quiz</SelectItem>
                                                        <SelectItem value="challenge">Challenge</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label htmlFor="title" className="text-sm font-medium">
                                                    Title
                                                </label>
                                                <Input
                                                    id="title"
                                                    value={formData.title}
                                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                    placeholder="Content title"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label htmlFor="topic" className="text-sm font-medium">
                                                    Topic
                                                </label>
                                                <Input
                                                    id="topic"
                                                    value={formData.topic}
                                                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                                                    placeholder="Specific topic to cover"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label htmlFor="description" className="text-sm font-medium">
                                                Description
                                            </label>
                                            <Textarea
                                                id="description"
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                placeholder="Brief description"
                                                rows={2}
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label htmlFor="selectedElearning" className="text-sm font-medium">
                                                    Knowledge Base
                                                </label>
                                                <Select value={formData.selectedElearningId} onValueChange={(value) => setFormData({ ...formData, selectedElearningId: value })}>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Select e-learning content (optional)" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {elearningContents.map((content) => (
                                                            <SelectItem key={content.id} value={content.id}>
                                                                {content.title}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <label htmlFor="difficulty" className="text-sm font-medium">
                                                    Difficulty
                                                </label>
                                                <Select value={formData.difficulty} onValueChange={(value: "beginner" | "intermediate" | "advanced") => setFormData({ ...formData, difficulty: value })}>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="beginner">Beginner</SelectItem>
                                                        <SelectItem value="intermediate">Intermediate</SelectItem>
                                                        <SelectItem value="advanced">Advanced</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label htmlFor="time_limit" className="text-sm font-medium">
                                                    Time Limit (minutes)
                                                </label>
                                                <Input
                                                    id="time_limit"
                                                    type="number"
                                                    value={formData.time_limit}
                                                    onChange={(e) => setFormData({ ...formData, time_limit: parseInt(e.target.value) || 10 })}
                                                    min="1"
                                                    max="60"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label htmlFor="question_count" className="text-sm font-medium">
                                                    Question Count
                                                </label>
                                                <Input
                                                    id="question_count"
                                                    type="number"
                                                    value={formData.question_count}
                                                    onChange={(e) => setFormData({ ...formData, question_count: parseInt(e.target.value) || (formData.type === "challenge" ? 5 : 5) })}
                                                    min="1"
                                                    max={formData.type === "challenge" ? 5 : 20}
                                                />
                                            </div>
                                            <div className="space-y-2 md:col-span-1">
                                                {/* Empty for alignment */}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="submit" onClick={handleCreateResourceContent} disabled={creating}>
                                        {creating ? "Generating..." : "Generate Content"}
                                        <Brain className="w-4 h-4 ml-2" />
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent>
                    {resourceContents.length === 0 ? (
                        <div className="text-center py-8">
                            <FileQuestion className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500 dark:text-gray-400">
                                No quizzes or challenges yet. Create your first interactive content!
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {resourceContents.map((content) => (
                                <div key={content.id} className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${content.type === 'quiz' ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-green-100 dark:bg-green-900/30'}`}>
                                            {content.type === 'quiz' ? (
                                                <FileQuestion className="w-5 h-5 text-blue-600" />
                                            ) : (
                                                <Trophy className="w-5 h-5 text-green-600" />
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-gray-900 dark:text-white">
                                                {content.title} - {content.topic}
                                            </h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {content.description}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant="outline" className="text-xs">
                                                    {content.topic}
                                                </Badge>
                                                <Badge variant="secondary" className="text-xs capitalize">
                                                    {content.difficulty}
                                                </Badge>
                                                <span className="text-xs text-gray-500">
                                                    {content.question_count} questions
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Select
                                            value={content.status}
                                            onValueChange={(value) => handleResourceStatusChange(content.id, value)}
                                        >
                                            <SelectTrigger className="w-24">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="draft">Draft</SelectItem>
                                                <SelectItem value="published">Published</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Button variant="ghost" size="sm" onClick={() => navigate(`/dashboard/instructor/courses/${id}/resource-content/${content.id}`)}>
                                            <Eye className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="sm">
                                            Edit
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => openDeleteDialog(content.id)}
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Resource Content</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this resource content? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deletingId && handleDeleteResourceContent(deletingId)}
                            disabled={deleting}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {deleting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}