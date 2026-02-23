import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/packages/shadcn/ui/card"
import { Badge } from "@/packages/shadcn/ui/badge"
import { Button } from "@/packages/shadcn/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/packages/shadcn/ui/dialog"
import { Tabs, TabsList, TabsTrigger } from "@/packages/shadcn/ui/tabs"
import { toast } from "sonner"
import {
    Play,
    Coins,
    Trophy,
    Zap,
    Brain,
    BookOpen,
    Gamepad2,
    Search,
    Clock,
    Target,
} from "lucide-react"
import { Input } from "@/packages/shadcn/ui/input"
import { supabase } from "@/packages/supabase/supabase"

interface MiniGame {
    id: string
    name: string
    description: string
    icon: string
    category: string
    difficulty: "easy" | "medium" | "hard"
    is_free: boolean
    coin_cost: number
    game_type: string
    xp_reward: number
    coin_reward: number
    time_limit: number
    thumbnail_url?: string
    instructions: string
    is_published: boolean
}

interface UserWallet {
    user_id: string
    total_coins: number
    spent_coins: number
    available_coins: number
}

interface UserStats {
    user_id: string
    total_xp: number
    current_level: number
}

interface UserGameScore {
    user_id: string
    game_id: string
    is_high_score: boolean
}

const DIFFICULTY_COLORS = {
    easy: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    hard: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
}

const GAME_TYPE_ICONS: { [key: string]: React.ReactNode } = {
    memory: <Brain className="w-5 h-5" />,
    word: <BookOpen className="w-5 h-5" />,
    math: <Target className="w-5 h-5" />,
    puzzle: <Gamepad2 className="w-5 h-5" />,
    reflex: <Zap className="w-5 h-5" />,
    logic: <Trophy className="w-5 h-5" />,
}

export default function MiniGames() {
    const navigate = useNavigate()
    const [games, setGames] = useState<MiniGame[]>([])
    const [wallet, setWallet] = useState<UserWallet | null>(null)
    const [, setUserStats] = useState<UserStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [selectedGame, setSelectedGame] = useState<MiniGame | null>(null)
    const [isGameDialogOpen, setIsGameDialogOpen] = useState(false)
    const [isPlayingGame] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState("all")
    const [searchQuery, setSearchQuery] = useState("")
    const [difficulty, setDifficulty] = useState<"all" | "easy" | "medium" | "hard">("all")
    const [userId, setUserId] = useState<string | null>(null)
    const [userGameScores, setUserGameScores] = useState<Map<string, UserGameScore>>(new Map())
    const [refreshKey] = useState(0)

    useEffect(() => {
        const getUser = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser()
            if (user) {
                setUserId(user.id)
                await Promise.all([fetchGames(), fetchWallet(user.id), fetchUserStats(user.id), fetchUserGameScores(user.id)])
            }
        }
        getUser()
    }, [refreshKey])

    const fetchGames = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from("mini_games")
                .select("*")
                .eq("is_published", true)
                .order("created_at", { ascending: false })

            if (error) {
                console.error("Error fetching games:", error)
                toast.error("Failed to load games")
                return
            }

            setGames(data || [])
        } catch (error) {
            console.error("Error fetching games:", error)
            toast.error("Failed to load games")
        } finally {
            setLoading(false)
        }
    }

    const fetchWallet = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from("user_wallets")
                .select("*")
                .eq("user_id", userId)
                .single()

            if (error && error.code !== "PGRST116") {
                // PGRST116 = no rows returned
                console.error("Error fetching wallet:", error)
                return
            }

            if (data) {
                setWallet(data)
            } else {
                // Initialize wallet if it doesn't exist
                const { data: newWallet } = await supabase
                    .from("user_wallets")
                    .insert([
                        {
                            user_id: userId,
                            total_coins: 0,
                            spent_coins: 0,
                            available_coins: 0,
                        },
                    ])
                    .select()
                    .single()

                if (newWallet) {
                    setWallet(newWallet)
                }
            }
        } catch (error) {
            console.error("Error fetching wallet:", error)
        }
    }

    const fetchUserStats = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from("user_stats")
                .select("*")
                .eq("user_id", userId)
                .single()

            if (error && error.code !== "PGRST116") {
                console.error("Error fetching stats:", error)
                return
            }

            if (data) {
                setUserStats(data)
            }
        } catch (error) {
            console.error("Error fetching stats:", error)
        }
    }

    const fetchUserGameScores = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from("mini_game_scores")
                .select("user_id, game_id, is_high_score")
                .eq("user_id", userId)

            if (error) {
                console.error("Error fetching user game scores:", error)
                return
            }

            if (data) {
                const scoresMap = new Map()
                data.forEach((score) => {
                    scoresMap.set(score.game_id, {
                        user_id: score.user_id,
                        game_id: score.game_id,
                        is_high_score: score.is_high_score,
                    })
                })
                setUserGameScores(scoresMap)
            }
        } catch (error) {
            console.error("Error fetching user game scores:", error)
        }
    }

    const filterGames = () => {
        return games.filter((game) => {
            const matchesCategory = selectedCategory === "all" || game.category === selectedCategory
            const matchesSearch =
                game.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                game.description.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesDifficulty = difficulty === "all" || game.difficulty === difficulty

            return matchesCategory && matchesSearch && matchesDifficulty
        })
    }

    const handlePlayGame = async (game: MiniGame) => {
        // Check if user has enough coins to play
        if (!game.is_free && wallet && wallet.available_coins < game.coin_cost) {
            toast.error(
                `You need ${game.coin_cost} coins to play this game. Currently you have ${wallet.available_coins} coins.`
            )
            return
        }

        setSelectedGame(game)
        setIsGameDialogOpen(true)
    }

    const startGame = async () => {
        if (selectedGame && userId) {
            // Navigate to the specific game based on game_type
            const gameRoutes: { [key: string]: string } = {
                memory: "/dashboard/learner/mini-games/memory-master",
                word: "/dashboard/learner/mini-games/word-blast",
                math: "/dashboard/learner/mini-games/math-master",
                puzzle: "/dashboard/learner/mini-games/puzzle-rush",
                reflex: "/dashboard/learner/mini-games/reflex-zone",
                logic: "/dashboard/learner/mini-games/logic-quest",
                numberninja: "/dashboard/learner/mini-games/number-ninja",
                colorconnect: "/dashboard/learner/mini-games/color-connect",
            }

            const route = gameRoutes[selectedGame.game_type]
            if (route) {
                navigate(route, { state: { gameId: selectedGame.id } })
                setIsGameDialogOpen(false)
            } else {
                toast.error("Game not found")
            }
        }
    }

    const getGameXPReward = (game: MiniGame): number => {
        // Check if user has already played this game
        const userScore = userGameScores.get(game.id)

        // If user has played this game before, return 0 XP
        if (userScore) {
            return 0
        }

        // If user hasn't played, return full XP reward
        return game.xp_reward
    }

    const hasPlayedGame = (gameId: string): boolean => {
        return userGameScores.has(gameId)
    }

    const categories = ["all", ...new Set(games.map((g) => g.category))]
    const filteredGames = filterGames()

    return (
        <div className="min-h-screen">
            {/* Main Content */}
            <div className=" mx-auto px-4 sm:px-6 lg:px-20 py-12">
                {/* Top Section */}
                <div className="mb-12">
                    <div className="text-left mb-4">
                        <h2 className="text-3xl sm:text-3xl font-bold head-font text-gray-900 dark:text-white mb-1">
                            Mini Games
                        </h2>
                        <p className="text-md text-gray-600 dark:text-gray-400 mx-auto">
                            Challenge yourself with our collection of mini games. Earn XP while having fun!
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div className="mb-8 space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <Input
                                placeholder="Search games..."
                                className="pl-12 h-11 border-2 border-gray-200 dark:border-gray-700 focus:border-purple-500 dark:focus:border-purple-400 rounded-lg"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* Difficulty Filter */}
                        <div className="flex gap-2 flex-wrap">
                            {["all", "easy", "medium", "hard"].map((diff) => (
                                <Button
                                    key={diff}
                                    variant={difficulty === diff ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setDifficulty(diff as any)}
                                    className={`capitalize ${difficulty === diff ? "bg-purple-600 hover:bg-purple-700 text-white" : ""
                                        }`}
                                >
                                    {diff}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Category Tabs */}
                    <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
                        <TabsList className="grid grid-cols-2 dark:border-gray-700 sm:grid-cols-4 md:grid-cols-7 w-full h-auto gap-2 bg-transparent">
                            {categories.map((category) => (
                                <TabsTrigger
                                    key={category}
                                    value={category}
                                    className="capitalize border-1 border-gray-200 py-2 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 data-[state=active]:bg-purple-600 data-[state=active]:text-white"
                                >
                                    {category}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </Tabs>
                </div>

                {/* Games Grid */}
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <Gamepad2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-600 dark:text-gray-400">Loading games...</p>
                        </div>
                    </div>
                ) : filteredGames.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {filteredGames.map((game) => {
                            const played = hasPlayedGame(game.id)
                            const xpReward = getGameXPReward(game)
                            // Only allow these game types to be playable, others are "Coming Soon"
                            const allowedTypes = [
                                "Math Master",
                                "Word Blast",
                                "Memory Master",
                            ]
                            const isComingSoon = !allowedTypes.includes(game.name)

                            return (
                                <Card
                                    key={game.id}
                                    className={`group border-1 border-gray-200 py-0 pb-6 dark:border-gray-700 duration-300 overflow-hidden relative ${isComingSoon ? "opacity-60 pointer-events-none" : ""}`}
                                >
                                    {/* Coming Soon Badge */}
                                    {isComingSoon && (
                                        <div className="absolute top-3 left-3 z-10">
                                            <Badge className="bg-gray-500 text-white font-semibold">
                                                Coming Soon
                                            </Badge>
                                        </div>
                                    )}

                                    {/* Played Badge */}
                                    {played && !isComingSoon && (
                                        <div className="absolute top-3 right-3 z-10">
                                            <Badge className="bg-green-500 text-white font-semibold">
                                                Played
                                            </Badge>
                                        </div>
                                    )}

                                    {/* Game Banner */}
                                    <div className={`relative h-48 bg-gradient-to-br from-purple-400 to-pink-400 dark:from-purple-900 dark:to-pink-900 overflow-hidden ${played ? 'opacity-75' : ''}`}>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-7xl">{game.icon}</span>
                                        </div>
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>

                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <div className="flex-1">
                                                <CardTitle className="text-xl group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                                    {game.name}
                                                </CardTitle>
                                                <CardDescription className="mt-1">{game.description}</CardDescription>
                                            </div>
                                            <div className="flex-shrink-0">{GAME_TYPE_ICONS[game.game_type]}</div>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="space-y-4">
                                        {/* Difficulty and Status */}
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <Badge className={`capitalize ${DIFFICULTY_COLORS[game.difficulty]}`}>
                                                {game.difficulty}
                                            </Badge>
                                            {game.is_free ? (
                                                <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                                    FREE
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                                    <Coins className="w-3 h-3 mr-1" />
                                                    {game.coin_cost}
                                                </Badge>
                                            )}
                                        </div>

                                        {/* Rewards */}
                                        <div className={`grid grid-cols-2 gap-3 ${game.coin_reward > 0 ? 'md:grid-cols-2' : 'md:grid-cols-1'}`}>
                                            {!played && (
                                                <div className={`p-2 rounded-lg ${xpReward > 0
                                                    ? 'bg-blue-50 dark:bg-blue-900/20'
                                                    : 'bg-gray-100 dark:bg-gray-800 opacity-60'}`}>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400">XP Reward</p>
                                                    <p className={`text-lg font-bold ${xpReward > 0
                                                        ? 'text-blue-600 dark:text-blue-400'
                                                        : 'text-gray-400 dark:text-gray-600'}`}>
                                                        {xpReward > 0 ? `+${xpReward}` : '0'}
                                                    </p>
                                                </div>
                                            )}
                                            {played && !isComingSoon && (
                                                <p className="text-lg text-green-500 dark:text-green-400 p-2">XP Already earned</p>
                                            )}
                                            {game.coin_reward > 0 && (
                                                <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                                                    <p className="text-xs text-gray-600 dark:text-gray-400">Coin Reward</p>
                                                    <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">+{game.coin_reward}</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Time Limit */}
                                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                            <Clock className="w-4 h-4" />
                                            <span>{Math.floor(game.time_limit / 60)}m {game.time_limit % 60}s</span>
                                        </div>

                                        {/* Play Button */}
                                        {!isComingSoon && (
                                            <Button
                                                className={`w-full text-white font-semibold mt-4 ${played
                                                    ? 'bg-green-500 hover:bg-green-600'
                                                    : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                                                    }`}
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handlePlayGame(game)
                                                }}
                                            >
                                                <Play className="w-4 h-4 mr-2" />
                                                {played ? 'Play Again' : 'Play Now'}
                                            </Button>
                                        )}
                                        {isComingSoon && (
                                            <Button
                                                className="w-full bg-gray-400 text-white font-semibold mt-4 cursor-not-allowed"
                                                disabled
                                            >
                                                Coming Soon
                                            </Button>
                                        )}
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                ) : (
                    <Card className="border-0 shadow-sm bg-white/80 dark:bg-gray-800/50">
                        <CardContent className="p-12 text-center">
                            <Gamepad2 className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                No Games Found
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                Try adjusting your filters or search query
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Game Dialog */}
            <Dialog open={isGameDialogOpen} onOpenChange={setIsGameDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <div className="flex items-center gap-4">
                            <div className="text-5xl">{selectedGame?.icon}</div>
                            <div>
                                <DialogTitle className="text-2xl font-bold head-font">
                                    {selectedGame?.name}
                                </DialogTitle>
                                <DialogDescription>{selectedGame?.description}</DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    {selectedGame && (
                        <div className="space-y-6">
                            {/* Played Info */}
                            {hasPlayedGame(selectedGame.id) && (
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                                    <p className="text-sm text-blue-700 dark:text-blue-400">
                                        You have already played this game. You can play again, but you won't earn XP again. You can still earn coins!
                                    </p>
                                </div>
                            )}

                            {/* Instructions */}
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                    <Target className="w-5 h-5 text-blue-600" />
                                    How to Play
                                </h3>
                                <p className="text-sm text-gray-700 dark:text-gray-300">{selectedGame.instructions}</p>
                            </div>

                            {/* Game Details */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                    <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">Difficulty</p>
                                    <Badge className={`capitalize mt-2 ${DIFFICULTY_COLORS[selectedGame.difficulty]}`}>
                                        {selectedGame.difficulty}
                                    </Badge>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                    <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">Time Limit</p>
                                    <p className="text-xl font-bold text-gray-900 dark:text-white mt-1 flex items-center gap-1">
                                        <Clock className="w-4 h-4" />
                                        {Math.floor(selectedGame.time_limit / 60)}m
                                    </p>
                                </div>
                                <div className={`p-4 rounded-lg border ${getGameXPReward(selectedGame) > 0
                                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                                    : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                                    }`}>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">XP Reward</p>
                                    <p className={`text-xl font-bold mt-1 ${getGameXPReward(selectedGame) > 0
                                        ? 'text-blue-600 dark:text-blue-400'
                                        : 'text-gray-400 dark:text-gray-600'
                                        }`}>
                                        {getGameXPReward(selectedGame) > 0 ? `+${getGameXPReward(selectedGame)}` : '0'}
                                    </p>
                                    {hasPlayedGame(selectedGame.id) && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Already earned</p>
                                    )}
                                </div>
                                <div
                                    className={`p-4 rounded-lg border ${selectedGame.coin_reward > 0
                                        ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
                                        : "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"
                                        }`}
                                >
                                    <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">Coin Reward</p>
                                    <p
                                        className={`text-xl font-bold mt-1 ${selectedGame.coin_reward > 0
                                            ? "text-yellow-600 dark:text-yellow-400"
                                            : "text-gray-600 dark:text-gray-400"
                                            }`}
                                    >
                                        +{selectedGame.coin_reward || "0"}
                                    </p>
                                </div>
                            </div>

                            {/* Cost Warning */}
                            {!selectedGame.is_free && wallet && wallet.available_coins < selectedGame.coin_cost ? (
                                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                                    <p className="text-sm text-red-700 dark:text-red-400">
                                        You need {selectedGame.coin_cost} coins to play. You currently have {wallet.available_coins} coins.
                                    </p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="mt-3 text-red-700 border-red-200 hover:bg-red-50 w-full"
                                        onClick={() => navigate("/dashboard/learner/coin-shop")}
                                    >
                                        Buy Coins
                                    </Button>
                                </div>
                            ) : !selectedGame.is_free ? (
                                <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                                    <p className="text-sm text-amber-700 dark:text-amber-400">
                                        <Coins className="w-4 h-4 inline mr-2" />
                                        Playing this game will cost {selectedGame.coin_cost} coins
                                    </p>
                                </div>
                            ) : null}

                            {/* Play Button */}
                            <Button
                                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold h-11"
                                onClick={startGame}
                                disabled={selectedGame && !selectedGame.is_free && wallet ? wallet.available_coins < selectedGame.coin_cost : false}
                            >
                                {isPlayingGame ? (
                                    <>
                                        <span>Loading...</span>
                                    </>
                                ) : (
                                    <>
                                        <Play className="w-4 h-4 mr-2" />
                                        {hasPlayedGame(selectedGame.id) ? 'Play Again' : 'Start Game'}
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}