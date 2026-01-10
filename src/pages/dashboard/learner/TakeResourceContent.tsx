import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { ArrowLeft, Clock, CheckCircle, XCircle, Trophy, Target, Zap, Star } from "lucide-react"

interface ResourceContent {
  id: string
  title: string
  description: string
  type: "quiz" | "challenge"
  time_limit: number
  content: any[]
  quests: any[]
}

interface Attempt {
  id: string
  answers: { [key: number]: string }
  timeRemaining: number
  currentQuestion: number
}

export default function TakeResourceContent() {
  const { courseId, id } = useParams<{ courseId: string; id: string }>()
  const navigate = useNavigate()
  const [resourceContent, setResourceContent] = useState<ResourceContent | null>(null)
  const [attempt, setAttempt] = useState<Attempt | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [showResults, setShowResults] = useState(false)
  const [score, setScore] = useState(0)

  useEffect(() => {
    if (id) {
      fetchResourceContent()
    }
  }, [id])

  useEffect(() => {
    if (timeLeft > 0 && !showResults) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && !showResults && attempt) {
      handleSubmit(true) // Auto-submit on timeout
    }
  }, [timeLeft, showResults, attempt])

  const fetchResourceContent = async () => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        navigate("/login")
        return
      }

      const { data, error } = await supabase
        .from("resource_content")
        .select("*")
        .eq("id", id)
        .single()

      if (error) throw error

      setResourceContent(data)
      setTimeLeft(data.time_limit * 60) // Convert to seconds

      // Check for existing in-progress attempt
      const { data: existingAttempt } = await supabase
        .from("resource_attempts")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("resource_content_id", id)
        .eq("status", "in_progress")
        .single()

      if (existingAttempt) {
        setAttempt({
          id: existingAttempt.id,
          answers: existingAttempt.answers || {},
          timeRemaining: Math.max(0, data.time_limit * 60 - Math.floor((Date.now() - new Date(existingAttempt.started_at).getTime()) / 1000)),
          currentQuestion: Object.keys(existingAttempt.answers || {}).length
        })
        setTimeLeft(Math.max(0, data.time_limit * 60 - Math.floor((Date.now() - new Date(existingAttempt.started_at).getTime()) / 1000)))
      } else {
        // Create new attempt
        const { data: newAttempt, error: attemptError } = await supabase
          .from("resource_attempts")
          .insert({
            user_id: session.user.id,
            resource_content_id: id,
            max_score: data.content?.length || 0
          })
          .select()
          .single()

        if (attemptError) throw attemptError

        setAttempt({
          id: newAttempt.id,
          answers: {},
          timeRemaining: data.time_limit * 60,
          currentQuestion: 0
        })
      }
    } catch (error: any) {
      console.error("Error fetching resource content:", error)
      toast.error("Error", {
        description: "Failed to load content"
      })
      navigate(`/dashboard/learner/course/${courseId}`)
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerChange = (questionIndex: number, answer: string) => {
    if (!attempt) return

    const newAnswers = { ...attempt.answers, [questionIndex]: answer }
    setAttempt({ ...attempt, answers: newAnswers })

    // Auto-save progress
    supabase
      .from("resource_attempts")
      .update({ answers: newAnswers })
      .eq("id", attempt.id)
  }

  const handleSubmit = async (timedOut = false) => {
    if (!attempt || !resourceContent) return

    try {
      setSubmitting(true)

      // Calculate score
      let correctAnswers = 0
      const questions = resourceContent.content || []

      questions.forEach((question: any, index: number) => {
        if (attempt.answers[index] === question.correct_answer) {
          correctAnswers++
        }
      })

      const finalScore = correctAnswers
      const xpEarned = resourceContent.quests?.[0]?.xp_reward || 50

      // Update attempt
      const { error } = await supabase
        .from("resource_attempts")
        .update({
          completed_at: new Date().toISOString(),
          time_taken: resourceContent.time_limit * 60 - timeLeft,
          score: finalScore,
          status: timedOut ? 'timed_out' : 'completed',
          xp_earned: xpEarned
        })
        .eq("id", attempt.id)

      if (error) throw error

      // Update user stats
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        await supabase.rpc('increment_user_xp', { user_id: session.user.id, xp_amount: xpEarned })
      }

      setScore(finalScore)
      setShowResults(true)

      toast.success("Completed!", {
        description: `You earned ${xpEarned} XP!`
      })
    } catch (error: any) {
      console.error("Error submitting attempt:", error)
      toast.error("Error", {
        description: "Failed to submit answers"
      })
    } finally {
      setSubmitting(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getTimerColor = () => {
    const percentage = (timeLeft / (resourceContent?.time_limit || 1) / 60) * 100
    if (percentage > 50) return "text-green-600"
    if (percentage > 25) return "text-yellow-600"
    return "text-red-600"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center dark:from-blue-900/20 dark:to-purple-900/20">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-blue-500 border-t-purple-500 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">Loading your challenge...</p>
        </div>
      </div>
    )
  }

  if (!resourceContent || !attempt) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600 dark:text-gray-400">Content not found</p>
      </div>
    )
  }

  if (showResults) {
    const questions = resourceContent.content || []
    const totalQuestions = questions.length
    const percentage = Math.round((score / totalQuestions) * 100)
    const isExcellent = percentage >= 80
    const isGood = percentage >= 60

    return (
      <div className="dark:from-green-900/20 dark:via-blue-900/20 dark:to-purple-900/20">
        <div className="px-20 mx-auto py-8">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" onClick={() => navigate(`/dashboard/learner/course/${courseId}`)} className="hover:bg-white/50">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Course
            </Button>
          </div>

          <Card className="shadow-2xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-8">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-4 shadow-lg">
                {isExcellent ? (
                  <Trophy className="w-10 h-10 text-white" />
                ) : isGood ? (
                  <Star className="w-10 h-10 text-white" />
                ) : (
                  <Target className="w-10 h-10 text-white" />
                )}
              </div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {isExcellent ? "Excellent Work!" : isGood ? "Great Job!" : "Keep Practicing!"}
              </CardTitle>
              <CardDescription className="text-lg">
                You completed <span className="font-semibold text-blue-600">{resourceContent.title}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4 shadow-lg">
                  <div className="text-center text-white">
                    <div className="text-3xl font-bold">{percentage}%</div>
                    <div className="text-sm opacity-90">Score</div>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  {score} out of {totalQuestions} correct answers
                </p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  <span className="font-semibold text-yellow-600">
                    +{resourceContent.quests?.[0]?.xp_reward || 50} XP Earned!
                  </span>
                </div>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                <h3 className="text-xl font-semibold text-center mb-4">Review Your Answers</h3>
                {questions.map((question: any, index: number) => {
                  const userAnswer = attempt.answers[index]
                  const isCorrect = userAnswer === question.correct_answer

                  return (
                    <div key={index} className={`border rounded-lg p-4 transition-all duration-300 ${
                      isCorrect 
                        ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' 
                        : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                    }`}>
                      <div className="flex items-start gap-3">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          isCorrect ? 'bg-green-500' : 'bg-red-500'
                        }`}>
                          {isCorrect ? (
                            <CheckCircle className="w-5 h-5 text-white" />
                          ) : (
                            <XCircle className="w-5 h-5 text-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white mb-3">{question.question}</p>
                          <div className="space-y-2">
                            {question.options.map((option: string, optionIndex: number) => {
                              const optionLetter = String.fromCharCode(65 + optionIndex)
                              const isUserAnswer = userAnswer === optionLetter
                              const isCorrectAnswer = question.correct_answer === optionLetter

                              return (
                                <div
                                  key={optionIndex}
                                  className={`p-3 rounded-lg border transition-all duration-200 ${
                                    isCorrectAnswer
                                      ? 'border-green-300 bg-green-100 dark:border-green-600 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                                      : isUserAnswer && !isCorrectAnswer
                                      ? 'border-red-300 bg-red-100 dark:border-red-600 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                                      : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                                  }`}
                                >
                                  <span className="font-medium">{optionLetter}.</span> {option}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="flex justify-center gap-4 pt-6 border-t">
                <Button 
                  onClick={() => navigate(`/dashboard/learner/course/${courseId}`)}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  Back to Course
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => window.location.reload()}
                  className="border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                >
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const questions = resourceContent.content || []
  const currentQuestion = questions[attempt.currentQuestion]
  const progress = ((attempt.currentQuestion + 1) / questions.length) * 100

  return (
    <div className="dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20">
      <div className="px-20 mx-auto py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={() => navigate(`/dashboard/learner/course/${courseId}`)} className="hover:bg-white/50">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Course
          </Button>
          <div className="flex items-center gap-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Time Limit: {resourceContent.time_limit} min
              </span>
            </div>
            <div className={`flex items-center gap-2 font-mono text-xl font-bold ${getTimerColor()}`}>
              <Clock className="w-5 h-5" />
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>

        {/* Progress */}
        <Card className="mb-8 shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex justify-between text-sm mb-3">
              <span className="font-medium">Question {attempt.currentQuestion + 1} of {questions.length}</span>
              <span className="font-medium">{Math.round(progress)}% Complete</span>
            </div>
            <Progress 
              value={progress} 
              className="h-3 bg-gray-200 dark:bg-gray-700" 
            />
            <div className="flex justify-between mt-2">
              {questions.map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index < attempt.currentQuestion
                      ? 'bg-green-500'
                      : index === attempt.currentQuestion
                      ? 'bg-blue-500 animate-pulse'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Question */}
        <Card className="shadow-2xl border-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-lg ${resourceContent.type === 'quiz' ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-green-100 dark:bg-green-900/30'}`}>
                {resourceContent.type === 'quiz' ? (
                  <Target className="w-6 h-6 text-blue-600" />
                ) : (
                  <Trophy className="w-6 h-6 text-green-600" />
                )}
              </div>
              <div>
                <CardTitle className="text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {resourceContent.title}
                </CardTitle>
                <CardDescription className="text-base">{resourceContent.description}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {currentQuestion && (
              <div className="space-y-8">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 leading-relaxed">
                    {currentQuestion.question}
                  </h3>
                  <RadioGroup
                    value={attempt.answers[attempt.currentQuestion] || ""}
                    onValueChange={(value) => handleAnswerChange(attempt.currentQuestion, value)}
                    className="space-y-3"
                  >
                    {currentQuestion.options.map((option: string, index: number) => (
                      <div key={index} className="flex items-center space-x-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 cursor-pointer">
                        <RadioGroupItem value={String.fromCharCode(65 + index)} id={`option-${index}`} className="text-blue-600" />
                        <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer text-gray-700 dark:text-gray-300 font-medium">
                          <span className="font-bold text-blue-600 mr-2">{String.fromCharCode(65 + index)}.</span>
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="flex justify-between pt-6">
                  <Button
                    variant="outline"
                    onClick={() => setAttempt({ ...attempt, currentQuestion: Math.max(0, attempt.currentQuestion - 1) })}
                    disabled={attempt.currentQuestion === 0}
                    className="px-8 py-3 border-2 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    ← Previous
                  </Button>
                  {attempt.currentQuestion < questions.length - 1 ? (
                    <Button
                      onClick={() => setAttempt({ ...attempt, currentQuestion: attempt.currentQuestion + 1 })}
                      disabled={!attempt.answers[attempt.currentQuestion]}
                      className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      Next →
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => handleSubmit()} 
                      disabled={submitting || !attempt.answers[attempt.currentQuestion]}
                      className="px-8 py-3 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      {submitting ? (
                        <>
                          <div className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5 mr-2" />
                          Submit Quiz
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}