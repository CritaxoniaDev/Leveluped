import { useState, useEffect } from "react"
import { Button } from "@/packages/shadcn/ui/button"
import { Badge } from "@/packages/shadcn/ui/badge"
import { Star, Flame, Trophy, Sparkles, X } from "lucide-react"

interface LoginStreakDialogProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    streakInfo: {
        total_stars: number
        login_streak: number
        stars_earned: number
        streak_bonus_earned: boolean
        streak_milestone: number
    }
}

export function LoginStreakDialog({
    isOpen,
    onOpenChange,
    streakInfo,
}: LoginStreakDialogProps) {
    const [animationPhase, setAnimationPhase] = useState(0)

    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => setAnimationPhase(1), 300)
            return () => clearTimeout(timer)
        }
    }, [isOpen])

    if (!isOpen) return null

    const getMilestoneMessage = (streak: number, milestone: number) => {
        if (milestone === 14) {
            return {
                title: "🎊 Two Week Champion! 🎊",
                description: "You've logged in for 14 consecutive days! Incredible dedication!",
                color: "from-purple-600 to-pink-600",
                emoji: "👑"
            }
        } else if (milestone === 7) {
            return {
                title: "🌟 One Week Warrior! 🌟",
                description: "You've logged in for a full week! Keep the momentum going!",
                color: "from-blue-600 to-cyan-600",
                emoji: "⚡"
            }
        } else if (milestone === 3) {
            return {
                title: "🔥 Hot Streak! 🔥",
                description: "You've logged in for 3 days in a row! Great start!",
                color: "from-orange-600 to-red-600",
                emoji: "🔥"
            }
        } else {
            return {
                title: "✨ Welcome Back! ✨",
                description: `You're on a ${streak}-day login streak!`,
                color: "from-yellow-500 to-orange-500",
                emoji: "⭐"
            }
        }
    }

    const milestone = getMilestoneMessage(streakInfo.login_streak, streakInfo.streak_milestone)

    return (
        <div className={`fixed inset-0 z-[9999] flex items-center justify-center transition-all duration-300 ${
            isOpen ? "bg-black/50 backdrop-blur-sm" : "pointer-events-none"
        }`}>
            <div className={`relative bg-white dark:bg-gray-900 rounded-lg shadow-2xl max-w-md w-full mx-4 overflow-hidden transform transition-all duration-500 ${
                animationPhase === 1 
                    ? "scale-100 opacity-100" 
                    : "scale-95 opacity-0"
            }`}>
                {/* Close Button */}
                <button
                    onClick={() => onOpenChange(false)}
                    className="absolute top-4 right-4 z-10 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                    <X className="w-5 h-5 text-gray-500" />
                </button>

                <div className={`absolute inset-0 bg-gradient-to-br ${milestone.color} opacity-10 pointer-events-none`}></div>

                <div className="relative z-10 text-center px-6 pt-8">
                    <div className={`text-6xl mb-4 transition-all duration-700 ${
                        animationPhase === 1 ? "scale-100 opacity-100" : "scale-0 opacity-0"
                    }`}>
                        {milestone.emoji}
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-yellow-500 via-red-500 to-pink-500 bg-clip-text text-transparent">
                        {milestone.title}
                    </h2>

                    <p className="text-base text-gray-600 dark:text-gray-300 mt-2">
                        {milestone.description}
                    </p>
                </div>

                <div className="relative z-10 space-y-6 px-6 py-6">
                    {/* Stars Earned Card */}
                    <div className={`bg-gradient-to-r from-yellow-100 to-yellow-50 dark:from-yellow-900/30 dark:to-yellow-800/20 rounded-lg p-4 border-2 border-yellow-200 dark:border-yellow-700 transform transition-all duration-700 ${
                        animationPhase === 1 ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                    }`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                    Stars Earned Today
                                </p>
                                <div className="flex items-center gap-2">
                                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                                    <span className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                                        +{streakInfo.stars_earned}
                                    </span>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Stars</p>
                                <div className="flex items-center gap-1 justify-end">
                                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {streakInfo.total_stars}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {streakInfo.streak_bonus_earned && (
                            <div className="mt-3 pt-3 border-t border-yellow-200 dark:border-yellow-700">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                                    <span className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                                        Streak Bonus Applied! 🎁
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Streak Info Card */}
                    <div className={`bg-gradient-to-r from-red-100 to-red-50 dark:from-red-900/30 dark:to-red-800/20 rounded-lg p-4 border-2 border-red-200 dark:border-red-700 transform transition-all duration-700 delay-100 ${
                        animationPhase === 1 ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                    }`}>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <Flame className="w-5 h-5 text-red-500" />
                                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    Login Streak
                                </span>
                            </div>
                            <Badge className="bg-red-500 hover:bg-red-600 text-white text-lg px-3 py-1">
                                {streakInfo.login_streak} 🔥
                            </Badge>
                        </div>

                        <div className="space-y-2">
                            {[3, 7, 14].map((milestone) => (
                                <div key={milestone} className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${
                                        streakInfo.login_streak >= milestone
                                            ? "bg-green-500"
                                            : "bg-gray-300 dark:bg-gray-600"
                                    }`}></div>
                                    <span className={`text-sm ${
                                        streakInfo.login_streak >= milestone
                                            ? "text-gray-700 dark:text-gray-300 font-medium"
                                            : "text-gray-500 dark:text-gray-400"
                                    }`}>
                                        {milestone}-Day Milestone
                                    </span>
                                    {streakInfo.login_streak >= milestone && (
                                        <Trophy className="w-4 h-4 text-yellow-500 ml-auto" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Next Milestone Card */}
                    {streakInfo.login_streak < 14 && (
                        <div className={`bg-gradient-to-r from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/20 rounded-lg p-4 border-2 border-blue-200 dark:border-blue-700 transform transition-all duration-700 delay-200 ${
                            animationPhase === 1 ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                        }`}>
                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Next Milestone
                            </p>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                                        Days Until Next Goal
                                    </p>
                                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                        {streakInfo.login_streak < 3 
                                            ? 3 - streakInfo.login_streak
                                            : streakInfo.login_streak < 7
                                            ? 7 - streakInfo.login_streak
                                            : 14 - streakInfo.login_streak}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                                        Your Goal
                                    </p>
                                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                        {streakInfo.login_streak < 3 
                                            ? "3-Day 🔥"
                                            : streakInfo.login_streak < 7
                                            ? "7-Day ⭐"
                                            : "14-Day 👑"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Completion Message */}
                    {streakInfo.login_streak >= 14 && (
                        <div className={`bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-lg p-4 border-2 border-purple-200 dark:border-purple-700 transform transition-all duration-700 delay-200 ${
                            animationPhase === 1 ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                        }`}>
                            <p className="text-center font-semibold text-purple-700 dark:text-purple-400">
                                ✨ You've Reached the Ultimate Milestone! ✨
                            </p>
                            <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-1">
                                Keep this incredible streak going!
                            </p>
                        </div>
                    )}
                </div>

                <div className="relative z-10 px-6 pb-6 transform transition-all duration-700 delay-300 ${
                    animationPhase === 1 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                }">
                    <Button
                        onClick={() => onOpenChange(false)}
                        className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold"
                        size="lg"
                    >
                        Continue Learning! 🚀
                    </Button>
                </div>
            </div>
        </div>
    )
}