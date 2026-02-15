import { useEffect, useState } from "react"
import { supabase } from "@/packages/supabase/supabase"
import { Avatar, AvatarFallback, AvatarImage } from "@/packages/shadcn/ui/avatar"
import { toast } from "sonner"
import { Crown, Zap } from "lucide-react"

interface LeaderboardUser {
    id: string
    name: string
    avatar_url?: string
    avatar_border?: string
    total_xp: number
    current_level: number
    leaderboard_rank: number | null
}

const AVATAR_BORDERS = [
    { id: 'none', name: 'None', image: null },
    { id: 'Border 1', name: 'Border 1', image: '/images/avatar-border/avatar-4.png' },
    { id: 'Border 2', name: 'Border 2', image: '/images/avatar-border/avatar-1.png' },
    { id: 'Border 3', name: 'Border 3', image: '/images/avatar-border/avatar-5.png' },
    { id: 'Border 4', name: 'Border 4', image: '/images/avatar-border/avatar-6.png' },
    { id: 'Border 5', name: 'Border 5', image: '/images/avatar-border/avatar-8.png' },
]

export default function Leaderboard() {
    const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([])
    const [loading, setLoading] = useState(true)
    const [currentUserRank, setCurrentUserRank] = useState<LeaderboardUser | null>(null)

    useEffect(() => {
        fetchLeaderboard()
    }, [])

    const fetchLeaderboard = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession()

            // Fetch all users with their stats
            const { data: usersWithStats, error } = await supabase
                .from("user_stats")
                .select(`
                    total_xp,
                    current_level,
                    leaderboard_rank,
                    users (
                        id,
                        name,
                        avatar_url,
                        avatar_border
                    )
                `)
                .order("total_xp", { ascending: false })

            if (error) throw error

            // Transform data
            const leaderboard = (usersWithStats || []).map((stat: any, index: number) => ({
                id: stat.users.id,
                name: stat.users.name,
                avatar_url: stat.users.avatar_url,
                avatar_border: stat.users.avatar_border,
                total_xp: stat.total_xp,
                current_level: stat.current_level,
                leaderboard_rank: index + 1
            }))

            setLeaderboardData(leaderboard)

            // Set current user's rank
            if (session) {
                const userRank = leaderboard.find((user: LeaderboardUser) => user.id === session.user.id)
                if (userRank) {
                    setCurrentUserRank(userRank)
                }
            }
        } catch (error: any) {
            console.error("Error fetching leaderboard:", error)
            toast.error("Error", {
                description: "Failed to load leaderboard"
            })
        } finally {
            setLoading(false)
        }
    }

    const getSelectedBorderImage = (borderId: string | undefined) => {
        const border = AVATAR_BORDERS.find(b => b.id === borderId)
        return border?.image || undefined
    }

    const getMedalColor = (rank: number) => {
        switch (rank) {
            case 1:
                return "bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300"
            case 2:
                return "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
            case 3:
                return "bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300"
            default:
                return "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
        }
    }

    const getMedalIcon = (rank: number) => {
        switch (rank) {
            case 1:
                return "🥇"
            case 2:
                return "🥈"
            case 3:
                return "🥉"
            default:
                return `#${rank}`
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading leaderboard...</p>
                </div>
            </div>
        )
    }

    const topThree = leaderboardData.slice(0, 3)
    const restOfLeaderboard = leaderboardData.slice(3)

    return (
        <div className="space-y-8 px-20 mx-auto py-6">
            {/* Header */}
            <div className="space-y-2">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                    Leaderboard
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Top learners by XP
                </p>
                {currentUserRank && (
                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Your Rank: <span className="font-bold text-blue-600 dark:text-blue-400">#{currentUserRank.leaderboard_rank}</span> • 
                            Level: <span className="font-bold text-blue-600 dark:text-blue-400">{currentUserRank.current_level}</span> • 
                            XP: <span className="font-bold text-blue-600 dark:text-blue-400">{currentUserRank.total_xp.toLocaleString()}</span>
                        </p>
                    </div>
                )}
            </div>

            {/* Top 3 - Olympic Style */}
            {leaderboardData.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end mb-8">
                    {/* 2nd Place */}
                    {topThree[1] && (
                        <div className="md:order-1 flex flex-col items-center">
                            <div className="w-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center space-y-4 hover:shadow-lg transition-shadow">
                                <div className="relative w-20 h-20 mx-auto">
                                    <Avatar className="w-full h-full border-4 border-gray-400 shadow-lg">
                                        <AvatarImage src={topThree[1].avatar_url || undefined} alt={topThree[1].name} />
                                        <AvatarFallback className="bg-gradient-to-br from-gray-400 to-gray-600 text-white text-lg font-bold">
                                            {topThree[1].name.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    {getSelectedBorderImage(topThree[1].avatar_border) && (
                                        <img
                                            src={getSelectedBorderImage(topThree[1].avatar_border) as string}
                                            alt="Avatar Border"
                                            className="absolute inset-0 w-full h-full pointer-events-none scale-150"
                                        />
                                    )}
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">🥈</p>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                                        {topThree[1].name}
                                    </h3>
                                </div>
                                <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center justify-center gap-2">
                                        <Crown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                        <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                                            Level {topThree[1].current_level}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-center gap-2">
                                        <Zap className="w-4 h-4 text-yellow-500" />
                                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                                            {topThree[1].total_xp.toLocaleString()} XP
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 1st Place - Center and Larger */}
                    {topThree[0] && (
                        <div className="md:order-2 flex flex-col items-center">
                            <div className="w-full bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950/50 dark:to-yellow-900/30 border-4 border-yellow-400 dark:border-yellow-600 rounded-xl p-8 text-center space-y-4 shadow-2xl hover:shadow-3xl transition-shadow transform scale-105">
                                <div className="relative w-28 h-28 mx-auto">
                                    <Avatar className="w-full h-full border-4 border-yellow-400 shadow-xl">
                                        <AvatarImage src={topThree[0].avatar_url || undefined} alt={topThree[0].name} />
                                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-2xl font-bold">
                                            {topThree[0].name.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    {getSelectedBorderImage(topThree[0].avatar_border) && (
                                        <img
                                            src={getSelectedBorderImage(topThree[0].avatar_border) as string}
                                            alt="Avatar Border"
                                            className="absolute inset-0 w-full h-full pointer-events-none scale-150"
                                        />
                                    )}
                                </div>
                                <div>
                                    <p className="text-4xl font-bold">🥇</p>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white truncate">
                                        {topThree[0].name}
                                    </h3>
                                </div>
                                <div className="space-y-2 pt-4 border-t-2 border-yellow-400 dark:border-yellow-600">
                                    <div className="flex items-center justify-center gap-2">
                                        <Crown className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                                        <span className="text-base font-bold text-yellow-600 dark:text-yellow-400">
                                            Level {topThree[0].current_level}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-center gap-2">
                                        <Zap className="w-5 h-5 text-yellow-500" />
                                        <span className="text-base font-bold text-gray-900 dark:text-white">
                                            {topThree[0].total_xp.toLocaleString()} XP
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 3rd Place */}
                    {topThree[2] && (
                        <div className="md:order-3 flex flex-col items-center">
                            <div className="w-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center space-y-4 hover:shadow-lg transition-shadow">
                                <div className="relative w-20 h-20 mx-auto">
                                    <Avatar className="w-full h-full border-4 border-orange-400 shadow-lg">
                                        <AvatarImage src={topThree[2].avatar_url || undefined} alt={topThree[2].name} />
                                        <AvatarFallback className="bg-gradient-to-br from-orange-400 to-orange-600 text-white text-lg font-bold">
                                            {topThree[2].name.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    {getSelectedBorderImage(topThree[2].avatar_border) && (
                                        <img
                                            src={getSelectedBorderImage(topThree[2].avatar_border) as string}
                                            alt="Avatar Border"
                                            className="absolute inset-0 w-full h-full pointer-events-none scale-150"
                                        />
                                    )}
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">🥉</p>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                                        {topThree[2].name}
                                    </h3>
                                </div>
                                <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center justify-center gap-2">
                                        <Crown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                        <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                                            Level {topThree[2].current_level}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-center gap-2">
                                        <Zap className="w-4 h-4 text-yellow-500" />
                                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                                            {topThree[2].total_xp.toLocaleString()} XP
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Rest of Leaderboard */}
            {restOfLeaderboard.length > 0 && (
                <div className="space-y-3">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Rankings</h2>
                    <div className="space-y-2">
                        {restOfLeaderboard.map((user) => (
                            <div
                                key={user.id}
                                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow flex items-center justify-between gap-4"
                            >
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    {/* Rank */}
                                    <div className={`flex items-center justify-center w-10 h-10 rounded-lg font-bold text-sm flex-shrink-0 ${getMedalColor(user.leaderboard_rank!)}`}>
                                        {user.leaderboard_rank! <= 3 ? getMedalIcon(user.leaderboard_rank!) : `#${user.leaderboard_rank}`}
                                    </div>

                                    {/* Avatar */}
                                    <div className="relative w-12 h-12 flex-shrink-0">
                                        <Avatar className="w-full h-full border-2 border-gray-300 dark:border-gray-600">
                                            <AvatarImage src={user.avatar_url || undefined} alt={user.name} />
                                            <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white font-bold">
                                                {user.name.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        {getSelectedBorderImage(user.avatar_border) && (
                                            <img
                                                src={getSelectedBorderImage(user.avatar_border) as string}
                                                alt="Avatar Border"
                                                className="absolute inset-0 w-full h-full pointer-events-none scale-150 rounded-full"
                                            />
                                        )}
                                    </div>

                                    {/* User Info */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-gray-900 dark:text-white truncate">
                                            {user.name}
                                        </h3>
                                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                            <Crown className="w-3 h-3" />
                                            <span>Level {user.current_level}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* XP */}
                                <div className="flex items-center gap-1 flex-shrink-0">
                                    <Zap className="w-4 h-4 text-yellow-500" />
                                    <span className="font-bold text-gray-900 dark:text-white">
                                        {user.total_xp.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}