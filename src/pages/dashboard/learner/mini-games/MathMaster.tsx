import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { Button } from "@/packages/shadcn/ui/button"
import { Card, CardContent } from "@/packages/shadcn/ui/card"
import { Progress } from "@/packages/shadcn/ui/progress"
import { ArrowLeft, Volume2, RotateCcw, Trophy, Clock, Award, Target } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/packages/supabase/supabase"

interface GameResult {
  game_id: string
  score: number
  xp_earned: number
  coin_earned: number
  is_high_score: boolean
  message: string
}

type MathMode = "easy" | "medium" | "hard"

function generateQuestion(mode: MathMode) {
  let a = 0, b = 0, op = "+", answer = 0
  switch (mode) {
    case "easy":
      a = Math.floor(Math.random() * 10) + 1
      b = Math.floor(Math.random() * 10) + 1
      op = Math.random() > 0.5 ? "+" : "-"
      answer = op === "+" ? a + b : a - b
      break
    case "medium":
      a = Math.floor(Math.random() * 50) + 10
      b = Math.floor(Math.random() * 50) + 10
      op = Math.random() > 0.5 ? "*" : "+"
      answer = op === "*" ? a * b : a + b
      break
    case "hard":
      a = Math.floor(Math.random() * 100) + 50
      b = Math.floor(Math.random() * 20) + 2
      op = Math.random() > 0.5 ? "/" : "-"
      answer = op === "/" ? Math.floor(a / b) : a - b
      break
  }
  return {
    question: `${a} ${op} ${b}`,
    answer: answer,
  }
}

export default function MathMaster() {
  const navigate = useNavigate()
  const location = useLocation()
  const gameId = location.state?.gameId

  const [gameStarted, setGameStarted] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [timeLeft, setTimeLeft] = useState(120)
  const [gameMode, setGameMode] = useState<MathMode>("easy")
  const [userId, setUserId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [gameResult, setGameResult] = useState<GameResult | null>(null)

  const [questions, setQuestions] = useState<{ question: string; answer: number }[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [currentInput, setCurrentInput] = useState("")
  const [score, setScore] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [moves, setMoves] = useState(0)

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
      } else {
        toast.error("Please login to play games")
        navigate("/login")
      }
    }
    getUser()
  }, [navigate])

  // Initialize game based on difficulty
  useEffect(() => {
    initializeGame()
  }, [gameMode])

  // Timer effect
  useEffect(() => {
    if (!gameStarted || gameOver) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setGameOver(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [gameStarted, gameOver])

  const initializeGame = () => {
    let questionCount = 0
    switch (gameMode) {
      case "easy":
        questionCount = 8
        break
      case "medium":
        questionCount = 12
        break
      case "hard":
        questionCount = 16
        break
    }
    const qs = Array.from({ length: questionCount }, () => generateQuestion(gameMode))
    setQuestions(qs)
    setCurrentIndex(0)
    setCurrentInput("")
    setScore(0)
    setCorrectCount(0)
    setMoves(0)
    setGameStarted(false)
    setGameOver(false)
    setGameResult(null)
    setTimeLeft(gameMode === "easy" ? 120 : gameMode === "medium" ? 180 : 240)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentInput(e.target.value)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (gameOver || !gameStarted) return

    setMoves((m) => m + 1)
    const correct = Number(currentInput) === questions[currentIndex].answer
    if (correct) {
      setScore((s) => s + 100)
      setCorrectCount((c) => c + 1)
      toast.success("Correct!")
    } else {
      toast.error("Incorrect!")
    }
    setCurrentInput("")
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((i) => i + 1)
    } else {
      setGameOver(true)
    }
  }

  const handlePlaySound = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.value = 800
    oscillator.type = "sine"

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.5)
  }

  const submitGameScore = async () => {
    if (!userId || !gameId) {
      toast.error("Unable to save game result")
      return
    }

    setIsSubmitting(true)
    try {
      // Accuracy: correctCount/questions.length * 100
      const accuracy = (correctCount / questions.length) * 100
      const timeTaken = (gameMode === "easy" ? 120 : gameMode === "medium" ? 180 : 240) - timeLeft

      // Call the complete_mini_game RPC function
      const { data, error } = await supabase.rpc("complete_mini_game", {
        p_user_id: userId,
        p_game_id: gameId,
        p_score: score,
        p_time_taken: timeTaken,
        p_accuracy: accuracy,
      })

      if (error) {
        console.error("Error submitting game score:", error)
        toast.error("Failed to save game score")
        setIsSubmitting(false)
        return
      }

      if (data && data[0]) {
        const result = data[0]
        setGameResult(result)
        toast.success(result.message)
      }
    } catch (error) {
      console.error("Error in submitGameScore:", error)
      toast.error("An error occurred while saving your game")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Auto-submit when game ends
  useEffect(() => {
    if (gameOver && !gameResult && userId && gameId) {
      const timer = setTimeout(() => {
        submitGameScore()
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [gameOver, gameResult, userId, gameId])

  const progress = (correctCount / questions.length) * 100

  return (
    <div className="min-h-screen p-4 sm:p-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard/learner/mini-games")}
            className="gap-2 hover:bg-white/50 dark:hover:bg-gray-700/50"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <h1 className="text-3xl sm:text-4xl font-bold head-font text-gray-900 dark:text-white flex items-center gap-3">
            <Target className="w-9 h-9 text-purple-600" />
            Math Master
          </h1>
          <div className="w-10"></div>
        </div>

        {/* Game Info */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <Card className="border-0 shadow-lg overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-blue-400 to-blue-600"></div>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">Time Left</p>
              </div>
              <p className={`text-2xl font-bold ${timeLeft <= 10 ? "text-red-600 dark:text-red-400" : "text-gray-900 dark:text-white"}`}>
                {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-green-400 to-green-600"></div>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-4 h-4 text-green-600 dark:text-green-400" />
                <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">Correct</p>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {correctCount}/{questions.length}
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-yellow-400 to-yellow-600"></div>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">Moves</p>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{moves}</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-purple-400 to-purple-600"></div>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">Score</p>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{score}</p>
            </CardContent>
          </Card>
        </div>

        {/* Progress Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md mb-8">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Progress</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{Math.round(progress)}%</p>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Difficulty Selection (Before Game Starts) */}
      {!gameStarted && correctCount === 0 && (
        <div className="max-w-6xl mx-auto mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Select Difficulty</h2>
            <div className="grid grid-cols-3 gap-4">
              {(["easy", "medium", "hard"] as const).map((mode) => (
                <Button
                  key={mode}
                  onClick={() => setGameMode(mode)}
                  className={`h-16 font-bold capitalize transition-colors ${
                    gameMode === mode
                      ? "bg-purple-600 hover:bg-purple-700 text-white"
                      : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white"
                  }`}
                >
                  {mode}
                  <span className="text-xs ml-2">
                    {mode === "easy" ? "(8 questions)" : mode === "medium" ? "(12 questions)" : "(16 questions)"}
                  </span>
                </Button>
              ))}
            </div>
            <Button
              className="mt-6 w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold"
              onClick={() => setGameStarted(true)}
            >
              Start Game
            </Button>
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {gameOver && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="border-0 shadow-2xl bg-white dark:bg-gray-800 max-w-md w-full">
            <CardContent className="p-8 text-center">
              <div className="flex justify-center mb-4">
                <Trophy className="w-16 h-16 text-yellow-500" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                {correctCount === questions.length ? "Victory" : "Time's Up"}
              </h2>
              <div className="space-y-3 mb-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Score</span>
                  <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">{score}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Correct</span>
                  <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {correctCount}/{questions.length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Moves</span>
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{moves}</span>
                </div>

                {/* Game Result from Database */}
                {gameResult && (
                  <>
                    <div className="border-t border-gray-300 dark:border-gray-600 pt-3 mt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">XP Earned</span>
                        <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                          +{gameResult.xp_earned}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-gray-600 dark:text-gray-400">Coins Earned</span>
                        <span className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                          +{gameResult.coin_earned}
                        </span>
                      </div>
                      {gameResult.is_high_score && (
                        <div className="mt-2 p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded border border-yellow-300 dark:border-yellow-700">
                          <p className="text-sm font-bold text-yellow-700 dark:text-yellow-400 flex items-center justify-center gap-2">
                            <Trophy className="w-4 h-4" />
                            New High Score
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Submit button or loading state */}
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    initializeGame()
                    setGameMode("easy")
                  }}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold"
                  disabled={isSubmitting}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Play Again
                </Button>
                <Button
                  onClick={() => navigate("/dashboard/learner/mini-games")}
                  variant="outline"
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  Back to Games
                </Button>
              </div>

              {isSubmitting && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                  Saving your score...
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Game Play Area */}
      {gameStarted && !gameOver && (
        <div className="max-w-xl mx-auto mt-8">
          <Card className="shadow-lg">
            <CardContent className="p-8 flex flex-col items-center">
              <div className="mb-6 flex items-center gap-2">
                <Target className="w-8 h-8 text-purple-600" />
                <span className="text-lg font-bold text-gray-900 dark:text-white">Solve the math:</span>
              </div>
              <div className="mb-6">
                <span className="text-3xl font-mono font-bold tracking-widest text-purple-700 dark:text-purple-300">
                  {questions[currentIndex]?.question}
                </span>
              </div>
              <form onSubmit={handleSubmit} className="w-full flex flex-col items-center gap-4">
                <input
                  type="number"
                  value={currentInput}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 focus:border-purple-500 dark:focus:border-purple-400 text-lg"
                  placeholder="Type your answer"
                  autoFocus
                  disabled={gameOver}
                />
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold"
                  disabled={gameOver}
                >
                  Submit
                </Button>
              </form>
              <div className="mt-6 flex gap-4">
                <Button
                  onClick={handlePlaySound}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  disabled={gameOver}
                >
                  <Volume2 className="w-5 h-5" />
                  Sound
                </Button>
                <Button
                  onClick={() => initializeGame()}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  disabled={gameOver || isSubmitting}
                >
                  <RotateCcw className="w-5 h-5" />
                  Reset Game
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}