import { useEffect, useState } from "react"
import { supabase } from "@/packages/supabase/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Award, Star } from "lucide-react"

interface EarnedBadge {
  id: string
  name: string
  description: string
  icon: string
  category: string
  earned_at: string
}

export default function Badges() {
  const [earnedBadges, setEarnedBadges] = useState<EarnedBadge[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEarnedBadges()
  }, [])

  const fetchEarnedBadges = async () => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data, error } = await supabase
        .from("user_badges")
        .select(`
          id,
          earned_at,
          badges (
            id,
            name,
            description,
            icon,
            category
          )
        `)
        .eq("user_id", session.user.id)
        .order("earned_at", { ascending: false })

      if (error) throw error

      const badges = data.map((item: any) => ({
        id: item.badges.id,
        name: item.badges.name,
        description: item.badges.description,
        icon: item.badges.icon,
        category: item.badges.category,
        earned_at: item.earned_at
      }))

      setEarnedBadges(badges)
    } catch (error: any) {
      console.error("Error fetching badges:", error)
      toast.error("Error", {
        description: "Failed to load badges"
      })
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your badges...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            My Badges
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            View all the badges you've earned through your learning journey
          </p>
        </div>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {earnedBadges.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              No badges earned yet. Keep learning to unlock achievements!
            </p>
          </div>
        ) : (
          earnedBadges.map((badge) => (
            <Card key={badge.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center pb-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
                  {badge.icon ? (
                    <span className="text-4xl">{badge.icon}</span>
                  ) : (
                    <Star className="w-10 h-10 text-white" />
                  )}
                </div>
                <CardTitle className="text-xl">{badge.name}</CardTitle>
                <CardDescription>{badge.description}</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Badge variant="outline" className="capitalize mb-2">
                  {badge.category}
                </Badge>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Earned on {formatDate(badge.earned_at)}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}