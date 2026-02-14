import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { supabase } from "@/packages/supabase/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { ArrowLeft, Clock, CheckCircle, XCircle, Trophy, Target, Zap, Star, Code, Lightbulb } from "lucide-react"
import { CodeBlock, dracula } from 'react-code-blocks'

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
  answers: { [key: number]: string | string[] }
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
  const [showHint, setShowHint] = useState<{ [key: number]: boolean }>({})

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
      handleSubmit(true)
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

      const sanitizedData = {
        ...data,
        content: Array.isArray(data.content) ? data.content : [],
        quests: Array.isArray(data.quests) ? data.quests : []
      }

      setResourceContent(sanitizedData)
      setTimeLeft((data.time_limit || 10) * 60)

      const { data: existingAttempt } = await supabase
        .from("resource_attempts")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("resource_content_id", id)
        .eq("status", "in_progress")
        .maybeSingle()

      if (existingAttempt) {
        setAttempt({
          id: existingAttempt.id,
          answers: existingAttempt.answers || {},
          timeRemaining: Math.max(0, (data.time_limit || 10) * 60 - Math.floor((Date.now() - new Date(existingAttempt.started_at).getTime()) / 1000)),
          currentQuestion: Object.keys(existingAttempt.answers || {}).length
        })
        setTimeLeft(Math.max(0, (data.time_limit || 10) * 60 - Math.floor((Date.now() - new Date(existingAttempt.started_at).getTime()) / 1000)))
      } else {
        const { data: newAttempt, error: attemptError } = await supabase
          .from("resource_attempts")
          .insert({
            user_id: session.user.id,
            resource_content_id: id,
            max_score: sanitizedData.content?.length || 0
          })
          .select()
          .single()

        if (attemptError) throw attemptError

        setAttempt({
          id: newAttempt.id,
          answers: {},
          timeRemaining: (data.time_limit || 10) * 60,
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

  const handleAnswerChange = (questionIndex: number, answer: string | string[]) => {
    if (!attempt) return

    const newAnswers = { ...attempt.answers, [questionIndex]: answer }
    setAttempt({ ...attempt, answers: newAnswers })

    supabase
      .from("resource_attempts")
      .update({ answers: newAnswers })
      .eq("id", attempt.id)
  }

  // Handle fill-in-the-blank answer changes
  const handleBlankChange = (questionIndex: number, blankIndex: number, value: string) => {
    if (!attempt) return

    const currentAnswers = attempt.answers[questionIndex] as string[] || []
    const newBlanks = [...currentAnswers]
    newBlanks[blankIndex] = value

    handleAnswerChange(questionIndex, newBlanks)
  }

  // Count blanks in a question
  const countBlanks = (question: string): number => {
    return (question.match(/\[BLANK\]/g) || []).length
  }

  // Render fill-in-the-blank question with input fields
  const renderFillInBlankQuestion = (question: string, questionIndex: number) => {
    const parts = question.split('[BLANK]')
    const currentAnswers = (attempt?.answers[questionIndex] as string[]) || []

    return (
      <div className="text-xl font-semibold text-gray-900 dark:text-white leading-relaxed">
        {parts.map((part, index) => (
          <span key={index}>
            {part}
            {index < parts.length - 1 && (
              <Input
                type="text"
                value={currentAnswers[index] || ''}
                onChange={(e) => handleBlankChange(questionIndex, index, e.target.value)}
                className="inline-block w-32 sm:w-40 mx-1 px-2 py-1 text-base font-mono border-b-2 border-blue-500 bg-blue-50 dark:bg-blue-900/30 focus:ring-2 focus:ring-blue-500"
                placeholder="your answer"
              />
            )}
          </span>
        ))}
      </div>
    )
  }

  const handleSubmit = async (timedOut = false) => {
    if (!attempt || !resourceContent) return

    try {
      setSubmitting(true)

      let correctAnswers = 0
      const questions = resourceContent.content || []

      questions.forEach((question: any, index: number) => {
        if (resourceContent.type === 'quiz') {
          if (attempt.answers[index] === question.correct_answer) {
            correctAnswers++
          }
        } else {
          const userAnswers = attempt.answers[index] as string[] || []
          const correctAnswer = question.answer?.toLowerCase().trim() || ''

          if (countBlanks(question.question) === 1) {
            if (userAnswers[0]?.toLowerCase().trim() === correctAnswer) {
              correctAnswers++
            }
          } else {
            const allCorrect = userAnswers.every((ans) =>
              ans?.toLowerCase().trim() === correctAnswer
            )
            if (allCorrect && userAnswers.length > 0) {
              correctAnswers++
            }
          }
        }
      })

      const finalScore = correctAnswers
      const xpEarned = resourceContent.quests?.[0]?.xp_reward || 50

      const { error } = await supabase
        .from("resource_attempts")
        .update({
          completed_at: new Date().toISOString(),
          time_taken: (resourceContent.time_limit || 10) * 60 - timeLeft,
          score: finalScore,
          status: timedOut ? 'timed_out' : 'completed',
          xp_earned: xpEarned
        })
        .eq("id", attempt.id)

      if (error) throw error

      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        // Call the updated increment_user_xp function and check for level up
        const { data: xpResult, error: xpError } = await supabase
          .rpc('increment_user_xp', {
            p_user_id: session.user.id,
            p_xp_amount: xpEarned
          })

        if (xpError) {
          console.error("Error incrementing XP:", xpError)
        } else if (xpResult && xpResult.length > 0) {
          const result = xpResult[0]
          console.log("XP Result:", result)

          // Check if user leveled up
          if (result.leveled_up) {
            toast.success("Level Up! 🎉", {
              description: `Congratulations! You've reached Level ${result.new_level}!`
            })
          }
        }

        await checkAndAwardBadges(session.user.id, finalScore, questions.length)
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

  const checkAndAwardBadges = async (userId: string, score: number, totalQuestions: number) => {
    try {
      if (score === totalQuestions && totalQuestions > 0) {
        const { data: perfectBadge } = await supabase
          .from("badges")
          .select("id")
          .eq("name", "Perfect Score")
          .maybeSingle()

        if (perfectBadge) {
          const { data: existing } = await supabase
            .from("user_badges")
            .select("id")
            .eq("user_id", userId)
            .eq("badge_id", perfectBadge.id)
            .maybeSingle()

          if (!existing) {
            await supabase
              .from("user_badges")
              .insert({
                user_id: userId,
                badge_id: perfectBadge.id
              })
            toast.success("Badge Earned!", {
              description: "Perfect Score!"
            })
          }
        }
      }

      const badgeName = resourceContent?.type === 'quiz' ? "Quiz Completed" : "Challenge Completed"
      const { data: completedBadge } = await supabase
        .from("badges")
        .select("id")
        .eq("name", badgeName)
        .maybeSingle()

      if (completedBadge) {
        const { data: existing } = await supabase
          .from("user_badges")
          .select("id")
          .eq("user_id", userId)
          .eq("badge_id", completedBadge.id)
          .maybeSingle()

        if (!existing) {
          await supabase
            .from("user_badges")
            .insert({
              user_id: userId,
              badge_id: completedBadge.id
            })
          toast.success("Badge Earned!", {
            description: `${badgeName}!`
          })
        }
      }
    } catch (error) {
      console.error("Error checking badges:", error)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getTimerColor = () => {
    const timeLimit = resourceContent?.time_limit || 10
    const percentage = (timeLeft / (timeLimit * 60)) * 100
    if (percentage > 50) return "text-green-600"
    if (percentage > 25) return "text-yellow-600"
    return "text-red-600"
  }

  const toggleHint = (index: number) => {
    setShowHint(prev => ({ ...prev, [index]: !prev[index] }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
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
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Content not found</p>
          <Button onClick={() => navigate(`/dashboard/learner/course/${courseId}`)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Course
          </Button>
        </div>
      </div>
    )
  }

  const questions = resourceContent.content || []

  if (questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No Questions Available
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              This {resourceContent.type} doesn't have any questions yet.
            </p>
            <Button onClick={() => navigate(`/dashboard/learner/course/${courseId}`)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Course
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Results Screen
  if (showResults) {
    const totalQuestions = questions.length
    const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0
    const isExcellent = percentage >= 80
    const isGood = percentage >= 60

    return (
      <div className="min-h-screen">
        <div className="px-4 sm:px-8 lg:px-20 mx-auto py-8">
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

              <div className="space-y-4 max-h-[500px] overflow-y-auto">
                <h3 className="text-xl font-semibold text-center mb-4">Review Your Answers</h3>
                {questions.map((question: any, index: number) => {
                  const userAnswer = attempt.answers[index]
                  let isCorrect = false

                  if (resourceContent.type === 'quiz') {
                    isCorrect = userAnswer === question.correct_answer
                  } else {
                    const userAnswers = userAnswer as string[] || []
                    const correctAnswer = question.answer?.toLowerCase().trim() || ''
                    isCorrect = userAnswers[0]?.toLowerCase().trim() === correctAnswer
                  }

                  return (
                    <div key={index} className={`border rounded-lg p-4 transition-all duration-300 ${isCorrect
                        ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                        : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                      }`}>
                      <div className="flex items-start gap-3">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isCorrect ? 'bg-green-500' : 'bg-red-500'
                          }`}>
                          {isCorrect ? (
                            <CheckCircle className="w-5 h-5 text-white" />
                          ) : (
                            <XCircle className="w-5 h-5 text-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          {resourceContent.type === 'quiz' ? (
                            <>
                              <p className="font-medium text-gray-900 dark:text-white mb-3">{question.question}</p>
                              <div className="space-y-2">
                                {(question.options || []).map((option: string, optionIndex: number) => {
                                  const optionLetter = String.fromCharCode(65 + optionIndex)
                                  const isUserAnswer = userAnswer === optionLetter
                                  const isCorrectAnswer = question.correct_answer === optionLetter

                                  return (
                                    <div
                                      key={optionIndex}
                                      className={`p-3 rounded-lg border transition-all duration-200 ${isCorrectAnswer
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
                            </>
                          ) : (
                            <>
                              <p className="font-medium text-gray-900 dark:text-white mb-3">
                                {question.question.replace(/\[BLANK\]/g, '_____')}
                              </p>
                              <div className="space-y-3">
                                <div>
                                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Your Answer:</p>
                                  <p className={`p-2 rounded ${isCorrect ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'}`}>
                                    {(userAnswer as string[])?.[0] || 'No answer provided'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Correct Answer:</p>
                                  <p className="p-2 rounded bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 font-medium">
                                    {question.answer}
                                  </p>
                                </div>
                                {question.explanation && (
                                  <div>
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Explanation:</p>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                                      {question.explanation}
                                    </p>
                                  </div>
                                )}
                                {question.code_example && (
                                  <div>
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Code Example:</p>
                                    <CodeBlock
                                      text={question.code_example.replace(/```javascript\n|```\n?/g, '')}
                                      language="javascript"
                                      theme={dracula}
                                      showLineNumbers={true}
                                    />
                                  </div>
                                )}
                              </div>
                            </>
                          )}
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

  // Question Screen
  const currentQuestionIndex = Math.min(attempt.currentQuestion, questions.length - 1)
  const currentQuestion = questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100

  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Error Loading Question
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              There was an issue loading the question. Please try again.
            </p>
            <Button onClick={() => navigate(`/dashboard/learner/course/${courseId}`)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Course
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentOptions = Array.isArray(currentQuestion.options) ? currentQuestion.options : []
  const isChallenge = resourceContent.type === 'challenge'

  // Check if current question is answered
  const isCurrentAnswered = () => {
    const answer = attempt.answers[currentQuestionIndex]
    if (isChallenge) {
      const answers = answer as string[] || []
      const blankCount = countBlanks(currentQuestion.question)
      return answers.filter(a => a?.trim()).length >= blankCount
    }
    return !!answer
  }

  return (
    <div className="min-h-screen">
      <div className="px-4 sm:px-8 lg:px-20 mx-auto py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <Button variant="ghost" onClick={() => navigate(`/dashboard/learner/course/${courseId}`)} className="hover:bg-white/50">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Course
          </Button>
          <div className="flex items-center gap-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Time Limit: {resourceContent.time_limit || 10} min
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
              <span className="font-medium">
                {isChallenge ? 'Challenge' : 'Question'} {currentQuestionIndex + 1} of {questions.length}
              </span>
              <span className="font-medium">{Math.round(progress)}% Complete</span>
            </div>
            <Progress
              value={progress}
              className="h-3 bg-gray-200 dark:bg-gray-700"
            />
            <div className="flex justify-between mt-2">
              {questions.map((_: any, index: number) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${index < currentQuestionIndex
                      ? 'bg-green-500'
                      : index === currentQuestionIndex
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
              <div className={`p-2 rounded-lg ${isChallenge ? 'bg-green-100 dark:bg-green-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
                {isChallenge ? (
                  <Code className="w-6 h-6 text-green-600" />
                ) : (
                  <Target className="w-6 h-6 text-blue-600" />
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
            <div className="space-y-8">
              <div className={`rounded-lg p-6 ${isChallenge ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20' : 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20'}`}>

                {isChallenge ? (
                  <>
                    {/* Challenge: Fill in the blank */}
                    <div className="mb-6">
                      {renderFillInBlankQuestion(currentQuestion.question, currentQuestionIndex)}
                    </div>

                    {/* Hint Button */}
                    {currentQuestion.explanation && (
                      <div className="mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleHint(currentQuestionIndex)}
                          className="gap-2"
                        >
                          <Lightbulb className="w-4 h-4" />
                          {showHint[currentQuestionIndex] ? 'Hide Hint' : 'Show Hint'}
                        </Button>
                        {showHint[currentQuestionIndex] && (
                          <div className="mt-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                            <p className="text-sm text-yellow-800 dark:text-yellow-200">
                              💡 {currentQuestion.explanation}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Code Example Preview */}
                    {currentQuestion.code_example && (
                      <div className="mt-6">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Reference Code:</p>
                        <CodeBlock
                          text={currentQuestion.code_example.replace(/```javascript\n|```\n?/g, '')}
                          language="javascript"
                          theme={dracula}
                          showLineNumbers={true}
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* Quiz: Multiple choice */}
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 leading-relaxed">
                      {currentQuestion.question}
                    </h3>
                    {currentOptions.length > 0 ? (
                      <RadioGroup
                        value={(attempt.answers[currentQuestionIndex] as string) || ""}
                        onValueChange={(value) => handleAnswerChange(currentQuestionIndex, value)}
                        className="space-y-3"
                      >
                        {currentOptions.map((option: string, index: number) => (
                          <div key={index} className="flex items-center space-x-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 cursor-pointer">
                            <RadioGroupItem value={String.fromCharCode(65 + index)} id={`option-${index}`} className="text-blue-600" />
                            <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer text-gray-700 dark:text-gray-300 font-medium">
                              <span className="font-bold text-blue-600 mr-2">{String.fromCharCode(65 + index)}.</span>
                              {option}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400">No options available for this question.</p>
                    )}
                  </>
                )}
              </div>

              <div className="flex justify-between pt-6">
                <Button
                  variant="outline"
                  onClick={() => setAttempt({ ...attempt, currentQuestion: Math.max(0, currentQuestionIndex - 1) })}
                  disabled={currentQuestionIndex === 0}
                  className="px-8 py-3 border-2 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  ← Previous
                </Button>
                {currentQuestionIndex < questions.length - 1 ? (
                  <Button
                    onClick={() => setAttempt({ ...attempt, currentQuestion: currentQuestionIndex + 1 })}
                    disabled={!isCurrentAnswered()}
                    className={`px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-200 ${isChallenge ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700' : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'}`}
                  >
                    Next →
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleSubmit()}
                    disabled={submitting || !isCurrentAnswered()}
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
                        Submit {isChallenge ? 'Challenge' : 'Quiz'}
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}