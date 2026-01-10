import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { ArrowLeft, FileQuestion, Trophy, CheckCircle } from "lucide-react"

interface ResourceContent {
    id: string
    type: "quiz" | "challenge"
    title: string
    description: string
    topic: string
    difficulty: "beginner" | "intermediate" | "advanced"
    question_count: number
    content: any[]
    status: "draft" | "published"
    created_at: string
}

export default function ViewResourceContent() {
    const { courseId, id } = useParams<{ courseId: string; id: string }>()
    const navigate = useNavigate()
    const [resourceContent, setResourceContent] = useState<ResourceContent | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (id) {
            fetchResourceContent()
        }
    }, [id])

    const fetchResourceContent = async () => {
        try {
            setLoading(true)
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            const { data, error } = await supabase
                .from("resource_content")
                .select("*")
                .eq("id", id)
                .eq("course_id", courseId)
                .single()

            if (error) throw error
            setResourceContent(data)
        } catch (error: any) {
            console.error("Error fetching resource content:", error)
            toast.error("Error", {
                description: "Failed to load resource content"
            })
            navigate(`/dashboard/instructor/courses/${courseId}`)
        } finally {
            setLoading(false)
        }
    }

    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case "published":
                return "default"
            case "draft":
                return "secondary"
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
                    <p className="text-gray-600 dark:text-gray-400">Loading resource content...</p>
                </div>
            </div>
        )
    }

    if (!resourceContent) {
        return (
            <div className="flex items-center justify-center h-96">
                <p className="text-gray-600 dark:text-gray-400">Resource content not found</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => navigate(`/dashboard/instructor/courses/${courseId}`)}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Course
                </Button>
            </div>

            {/* Content Header */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg ${resourceContent.type === 'quiz' ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-green-100 dark:bg-green-900/30'}`}>
                            {resourceContent.type === 'quiz' ? (
                                <FileQuestion className="w-8 h-8 text-blue-600" />
                            ) : (
                                <Trophy className="w-8 h-8 text-green-600" />
                            )}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {resourceContent.title}
                                </h1>
                                <Badge variant={getStatusBadgeVariant(resourceContent.status)} className="capitalize">
                                    {resourceContent.status}
                                </Badge>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                {resourceContent.description}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                <Badge variant="outline" className="capitalize">
                                    {resourceContent.type}
                                </Badge>
                                <Badge variant="outline">
                                    {resourceContent.topic}
                                </Badge>
                                <Badge variant="secondary" className="capitalize">
                                    {resourceContent.difficulty}
                                </Badge>
                                <Badge variant="outline">
                                    {resourceContent.question_count} items
                                </Badge>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                Created on {formatDate(resourceContent.created_at)}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Content Items */}
            <Card>
                <CardHeader>
                    <CardTitle>
                        {resourceContent.type === 'quiz' ? 'Quiz Questions' : 'Challenges'}
                    </CardTitle>
                    <CardDescription>
                        {resourceContent.question_count} {resourceContent.type === 'quiz' ? 'questions' : 'challenges'} generated for this content
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {resourceContent.content && resourceContent.content.length > 0 ? (
                            resourceContent.content.map((item: any, index: number) => (
                                <div key={item.id || index} className="border rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                                            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                                {index + 1}
                                            </span>
                                        </div>
                                        <div className="flex-1">
                                            {resourceContent.type === 'quiz' ? (
                                                <div>
                                                    <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                                                        {item.question}
                                                    </h3>
                                                    <div className="space-y-2">
                                                        {item.options && item.options.map((option: string, optionIndex: number) => {
                                                            const optionLetter = String.fromCharCode(65 + optionIndex) // A, B, C, D
                                                            const isCorrect = item.correct_answer === optionLetter
                                                            return (
                                                                <div
                                                                    key={optionIndex}
                                                                    className={`flex items-center gap-2 p-2 rounded ${
                                                                        isCorrect
                                                                            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                                                                            : 'bg-gray-50 dark:bg-gray-800'
                                                                    }`}
                                                                >
                                                                    <span className={`font-medium ${isCorrect ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                                                                        {optionLetter}.
                                                                    </span>
                                                                    <span className={isCorrect ? 'text-green-700 dark:text-green-300 font-medium' : 'text-gray-700 dark:text-gray-300'}>
                                                                        {option}
                                                                    </span>
                                                                    {isCorrect && (
                                                                        <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 ml-auto" />
                                                                    )}
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div>
                                                    <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                                                        Challenge {index + 1}
                                                    </h3>
                                                    <p className="text-gray-700 dark:text-gray-300">
                                                        {item.challenge || item.question}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8">
                                <FileQuestion className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500 dark:text-gray-400">
                                    No content items available
                                </p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}