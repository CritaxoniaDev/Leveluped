import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { supabase } from "@/packages/supabase/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { MessageCircle, Send, ArrowLeft } from "lucide-react"
import { Separator } from "@/components/ui/separator"

interface FeedbackData {
    courseQuality: string
    instructorQuality: string
    contentClarity: string
    courseDifficulty: string
    wouldRecommend: string
    comments: string
}

interface CourseFeedback {
    id: string
    course_quality: number
    instructor_quality: number
    content_clarity: number
    course_difficulty: number
    would_recommend: boolean
    comments: string | null
    submitted_at: string
    created_at: string
}

export default function FeedbackPage() {
    const { courseId } = useParams<{ courseId: string }>()
    const navigate = useNavigate()
    const [courseName, setCourseName] = useState<string>("")
    const [feedback, setFeedback] = useState<FeedbackData>({
        courseQuality: "",
        instructorQuality: "",
        contentClarity: "",
        courseDifficulty: "",
        wouldRecommend: "",
        comments: "",
    })
    const [existingFeedback, setExistingFeedback] = useState<CourseFeedback | null>(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [isEditing, setIsEditing] = useState(false)

    useEffect(() => {
        if (courseId) {
            fetchCourseAndFeedback()
        }
    }, [courseId])

    const fetchCourseAndFeedback = async () => {
        try {
            setLoading(true)
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                toast.error("Error", {
                    description: "You must be logged in"
                })
                navigate("/login")
                return
            }

            // Fetch course name
            const { data: courseData, error: courseError } = await supabase
                .from("courses")
                .select("title")
                .eq("id", courseId)
                .single()

            if (courseError) throw courseError
            setCourseName(courseData?.title || "Unknown Course")

            // Fetch existing feedback
            const { data, error } = await supabase
                .from("course_feedback")
                .select("*")
                .eq("user_id", session.user.id)
                .eq("course_id", courseId)
                .maybeSingle()

            if (error && error.code !== "PGRST116") throw error

            if (data) {
                setExistingFeedback(data)
                setFeedback({
                    courseQuality: data.course_quality?.toString() || "",
                    instructorQuality: data.instructor_quality?.toString() || "",
                    contentClarity: data.content_clarity?.toString() || "",
                    courseDifficulty: data.course_difficulty?.toString() || "",
                    wouldRecommend: data.would_recommend?.toString() || "",
                    comments: data.comments || "",
                })
                setIsEditing(false)
            }
        } catch (error: any) {
            console.error("Error fetching data:", error)
            toast.error("Error", {
                description: "Failed to load feedback data"
            })
        } finally {
            setLoading(false)
        }
    }

    const handleInputChange = (field: keyof FeedbackData, value: string) => {
        setFeedback(prev => ({
            ...prev,
            [field]: value
        }))
    }

    const handleSubmitFeedback = async () => {
        try {
            if (!feedback.courseQuality || !feedback.instructorQuality ||
                !feedback.contentClarity || !feedback.courseDifficulty ||
                feedback.wouldRecommend === "") {
                toast.error("Validation Error", {
                    description: "Please answer all questions before submitting feedback"
                })
                return
            }

            setSubmitting(true)
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                toast.error("Error", {
                    description: "You must be logged in"
                })
                return
            }

            // Get enrollment ID
            const { data: enrollmentData } = await supabase
                .from("enrollments")
                .select("id")
                .eq("user_id", session.user.id)
                .eq("course_id", courseId)
                .single()

            const feedbackData = {
                user_id: session.user.id,
                course_id: courseId,
                enrollment_id: enrollmentData?.id,
                course_quality: parseInt(feedback.courseQuality),
                instructor_quality: parseInt(feedback.instructorQuality),
                content_clarity: parseInt(feedback.contentClarity),
                course_difficulty: parseInt(feedback.courseDifficulty),
                would_recommend: feedback.wouldRecommend === "true",
                comments: feedback.comments || null,
                submitted_at: new Date().toISOString(),
            }

            if (existingFeedback) {
                const { error } = await supabase
                    .from("course_feedback")
                    .update(feedbackData)
                    .eq("id", existingFeedback.id)

                if (error) throw error
                toast.success("Success", {
                    description: "Feedback updated successfully"
                })
            } else {
                const { error } = await supabase
                    .from("course_feedback")
                    .insert([feedbackData])

                if (error) throw error
                toast.success("Success", {
                    description: "Feedback submitted successfully"
                })
            }

            setIsEditing(false)
            await fetchCourseAndFeedback()
        } catch (error: any) {
            console.error("Error submitting feedback:", error)
            toast.error("Error", {
                description: "Failed to submit feedback"
            })
        } finally {
            setSubmitting(false)
        }
    }

    const ratingOptions = [
        { value: "1", label: "Poor" },
        { value: "2", label: "Fair" },
        { value: "3", label: "Good" },
        { value: "4", label: "Very Good" },
        { value: "5", label: "Excellent" },
    ]

    const recommendOptions = [
        { value: "true", label: "Yes, I would" },
        { value: "false", label: "No, I wouldn't" },
    ]

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading feedback...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto py-8 px-4">
            {/* Header */}
            <div className="mb-8">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(-1)}
                    className="mb-4"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                </Button>
                <div className="flex items-center gap-3 mb-2">
                    <MessageCircle className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Course Feedback</h1>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                    Share your experience with <span className="font-semibold">{courseName}</span>
                </p>
            </div>

            {/* Feedback Card */}
            <Card className="border-gray-200 dark:border-gray-800">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b pt-4 border-gray-200 dark:border-gray-800">
                    <CardTitle>Your Feedback</CardTitle>
                    <CardDescription>
                        {existingFeedback && !isEditing ? "You've already submitted feedback" : "Help us improve by sharing your thoughts"}
                    </CardDescription>
                </CardHeader>

                <CardContent className="px-8">
                    {existingFeedback && !isEditing ? (
                        <div className="space-y-6">
                            {/* Summary Grid */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Your Ratings</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Course Quality</p>
                                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                            {existingFeedback.course_quality}/5 ⭐
                                        </p>
                                    </div>
                                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Instructor Quality</p>
                                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                            {existingFeedback.instructor_quality}/5 ⭐
                                        </p>
                                    </div>
                                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Content Clarity</p>
                                        <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                            {existingFeedback.content_clarity}/5 ⭐
                                        </p>
                                    </div>
                                    <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Course Difficulty</p>
                                        <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                                            {existingFeedback.course_difficulty}/5
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Other Info */}
                            <div className="border-t border-gray-200 dark:border-gray-800 pt-6 space-y-4">
                                <div>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Would you recommend this course?</p>
                                    <p className="text-lg font-semibold">
                                        {existingFeedback.would_recommend ? (
                                            <span className="text-green-600 dark:text-green-400">✓ Yes, I would</span>
                                        ) : (
                                            <span className="text-red-600 dark:text-red-400">✗ No, I wouldn't</span>
                                        )}
                                    </p>
                                </div>

                                {existingFeedback.comments && (
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Your Comments</p>
                                        <div className="bg-gray-50 dark:bg-gray-900/20 p-4 rounded-lg border border-gray-200 dark:border-gray-800">
                                            <p className="text-gray-700 dark:text-gray-300 italic">
                                                "{existingFeedback.comments}"
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                                    Submitted on {new Date(existingFeedback.submitted_at || existingFeedback.created_at).toLocaleDateString()}
                                </p>
                                <Button
                                    onClick={() => setIsEditing(true)}
                                    className="w-full bg-blue-600 hover:bg-blue-700"
                                >
                                    Edit Feedback
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <form className="space-y-8" onSubmit={(e) => {
                            e.preventDefault()
                            handleSubmitFeedback()
                        }}>
                            {/* Course Quality */}
                            <div>
                                <Label className="text-base font-semibold text-gray-900 dark:text-white mb-4 block">
                                    How would you rate the overall course quality?
                                </Label>
                                <RadioGroup value={feedback.courseQuality} onValueChange={(value) => handleInputChange("courseQuality", value)}>
                                    <div className="flex flex-wrap gap-3">
                                        {ratingOptions.map(option => (
                                            <div key={option.value} className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-900/20 transition cursor-pointer">
                                                <RadioGroupItem value={option.value} id={`quality-${option.value}`} />
                                                <Label htmlFor={`quality-${option.value}`} className="text-sm cursor-pointer font-normal">
                                                    {option.label}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                </RadioGroup>
                            </div>

                            <Separator />

                            {/* Instructor Quality */}
                            <div>
                                <Label className="text-base font-semibold text-gray-900 dark:text-white mb-4 block">
                                    How would you rate the instructor?
                                </Label>
                                <RadioGroup value={feedback.instructorQuality} onValueChange={(value) => handleInputChange("instructorQuality", value)}>
                                    <div className="flex flex-wrap gap-3">
                                        {ratingOptions.map(option => (
                                            <div key={option.value} className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-900/20 transition cursor-pointer">
                                                <RadioGroupItem value={option.value} id={`instructor-${option.value}`} />
                                                <Label htmlFor={`instructor-${option.value}`} className="text-sm cursor-pointer font-normal">
                                                    {option.label}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                </RadioGroup>
                            </div>

                            <Separator />

                            {/* Content Clarity */}
                            <div>
                                <Label className="text-base font-semibold text-gray-900 dark:text-white mb-4 block">
                                    Was the course content clear and easy to understand?
                                </Label>
                                <RadioGroup value={feedback.contentClarity} onValueChange={(value) => handleInputChange("contentClarity", value)}>
                                    <div className="flex flex-wrap gap-3">
                                        {ratingOptions.map(option => (
                                            <div key={option.value} className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-900/20 transition cursor-pointer">
                                                <RadioGroupItem value={option.value} id={`clarity-${option.value}`} />
                                                <Label htmlFor={`clarity-${option.value}`} className="text-sm cursor-pointer font-normal">
                                                    {option.label}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                </RadioGroup>
                            </div>

                            <Separator />

                            {/* Course Difficulty */}
                            <div>
                                <Label className="text-base font-semibold text-gray-900 dark:text-white mb-4 block">
                                    How would you rate the course difficulty?
                                </Label>
                                <RadioGroup value={feedback.courseDifficulty} onValueChange={(value) => handleInputChange("courseDifficulty", value)}>
                                    <div className="flex flex-wrap gap-3">
                                        {ratingOptions.map(option => (
                                            <div key={option.value} className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-900/20 transition cursor-pointer">
                                                <RadioGroupItem value={option.value} id={`difficulty-${option.value}`} />
                                                <Label htmlFor={`difficulty-${option.value}`} className="text-sm cursor-pointer font-normal">
                                                    {option.label}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                </RadioGroup>
                            </div>

                            <Separator />

                            {/* Recommendation */}
                            <div>
                                <Label className="text-base font-semibold text-gray-900 dark:text-white mb-4 block">
                                    Would you recommend this course to others?
                                </Label>
                                <RadioGroup value={feedback.wouldRecommend} onValueChange={(value) => handleInputChange("wouldRecommend", value)}>
                                    <div className="flex flex-wrap gap-3">
                                        {recommendOptions.map(option => (
                                            <div key={option.value} className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-900/20 transition cursor-pointer">
                                                <RadioGroupItem value={option.value} id={`recommend-${option.value}`} />
                                                <Label htmlFor={`recommend-${option.value}`} className="text-sm cursor-pointer font-normal">
                                                    {option.label}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                </RadioGroup>
                            </div>

                            <Separator />

                            {/* Comments */}
                            <div>
                                <Label htmlFor="comments" className="text-base font-semibold text-gray-900 dark:text-white mb-3 block">
                                    Additional Comments <span className="text-gray-500 font-normal">(Optional)</span>
                                </Label>
                                <Textarea
                                    id="comments"
                                    placeholder="Share any additional thoughts, suggestions, or areas for improvement..."
                                    value={feedback.comments}
                                    onChange={(e) => handleInputChange("comments", e.target.value)}
                                    className="min-h-32 resize-none"
                                />
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-3 border-t border-gray-200 dark:border-gray-800 pt-6">
                                {existingFeedback && (
                                    <Button
                                        type="button"
                                        onClick={() => setIsEditing(false)}
                                        variant="outline"
                                        className="flex-1"
                                    >
                                        Cancel
                                    </Button>
                                )}
                                <Button
                                    type="submit"
                                    disabled={submitting}
                                    className={`${existingFeedback ? "flex-1" : "w-full"} bg-blue-600 hover:bg-blue-700`}
                                >
                                    <Send className="w-4 h-4 mr-2" />
                                    {submitting ? "Submitting..." : existingFeedback && !isEditing ? "Update" : "Submit"} Feedback
                                </Button>
                            </div>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}