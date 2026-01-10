import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Trophy, Star, Award, TrendingUp } from "lucide-react"

interface UserStats {
  total_xp: number
  current_level: number
  badges_count: number
  leaderboard_rank: number | null
}

interface AvailableChallenge {
  id: string
  title: string
  description: string
  type: "quiz" | "challenge"
  difficulty: "beginner" | "intermediate" | "advanced"
  topic: string
  course_title: string
  xp_reward: number
}

interface AvailableCourse {
  id: string
  title: string
  description: string
  category: string
  image_url: string
  levels: number
  max_xp: number
  instructor_name: string
  enrolled: boolean
}

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState<UserStats>({
    total_xp: 0,
    current_level: 1,
    badges_count: 0,
    leaderboard_rank: null
  })
  const [availableCourses, setAvailableCourses] = useState<AvailableCourse[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
          toast.error("Unauthorized", {
            description: "Please sign in to access the dashboard"
          })
          navigate("/login")
          return
        }

        // Fetch user profile from users table
        const { data: userProfile, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single()

        if (error) {
          toast.error("Error", {
            description: "Failed to load user profile"
          })
          navigate("/login")
          return
        }

        setUser(userProfile)

        // Fetch user stats
        await fetchUserStats(session.user.id)

        await fetchAvailableCourses()

        toast.success("Welcome!", {
          description: `Welcome back, ${userProfile.name}!`
        })
      } catch (err) {
        toast.error("Error", {
          description: "An unexpected error occurred"
        })
        navigate("/login")
      } finally {
        setLoading(false)
      }
    }

    checkUser()
  }, [navigate])

  const fetchAvailableCourses = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      // Fetch published courses with enrollment status
      const { data: courses, error } = await supabase
        .from("courses")
        .select(`
              id,
              title,
              description,
              category,
              image_url,
              levels,
              max_xp,
              status,
              users (
                name
              )
            `)
        .eq("status", "published")

      if (error) throw error

      // Check enrollment status for each course
      const coursesWithEnrollment = await Promise.all(
        courses.map(async (course) => {
          const { data: enrollment } = await supabase
            .from("enrollments")
            .select("id")
            .eq("user_id", session.user.id)
            .eq("course_id", course.id)
            .single()

          return {
            id: course.id,
            title: course.title,
            description: course.description,
            category: course.category,
            image_url: course.image_url,
            levels: course.levels,
            max_xp: course.max_xp,
            instructor_name: (course.users as any)?.name || "Unknown Instructor",
            enrolled: !!enrollment
          }
        })
      )

      setAvailableCourses(coursesWithEnrollment)
    } catch (error) {
      console.error("Error fetching available courses:", error)
    }
  }

  const handleEnrollCourse = async (courseId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { error } = await supabase
        .from("enrollments")
        .insert({
          user_id: session.user.id,
          course_id: courseId
        })

      if (error) throw error

      // Update local state
      setAvailableCourses(courses =>
        courses.map(course =>
          course.id === courseId ? { ...course, enrolled: true } : course
        )
      )

      toast.success("Enrolled!", {
        description: "You have successfully enrolled in this course"
      })
    } catch (error: any) {
      console.error("Error enrolling in course:", error)
      toast.error("Error", {
        description: "Failed to enroll in course"
      })
    }
  }

  const fetchUserStats = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_stats")
        .select("*")
        .eq("user_id", userId)
        .single()

      if (error && error.code !== "PGRST116") throw error

      if (data) {
        setStats({
          total_xp: data.total_xp || 0,
          current_level: data.current_level || 1,
          badges_count: data.badges_count || 0,
          leaderboard_rank: data.leaderboard_rank
        })
      }
    } catch (error) {
      console.error("Error fetching user stats:", error)
    }
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      toast.success("Signed Out", {
        description: "You have been successfully signed out"
      })
      navigate("/")
    } catch (err) {
      toast.error("Error", {
        description: "Failed to sign out"
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="dark:from-[#18181b] dark:to-[#27272a]">
      <div className="mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Welcome back, <span className="text-blue-600 dark:text-blue-400">{user.name}</span>!
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">@{user.username}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="px-6 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition-all"
          >
            Sign Out
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* XP Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Experience Points</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_xp.toLocaleString()} XP</div>
              <p className="text-xs text-muted-foreground">Keep learning to earn more!</p>
            </CardContent>
          </Card>

          {/* Level Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Level</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Level {stats.current_level}</div>
              <p className="text-xs text-muted-foreground">Next level at {(stats.current_level * 1000).toLocaleString()} XP</p>
            </CardContent>
          </Card>

          {/* Badges Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Badges Earned</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.badges_count}</div>
              <p className="text-xs text-muted-foreground">Collect achievements!</p>
            </CardContent>
          </Card>

          {/* Rank Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Leaderboard Rank</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.leaderboard_rank ? `#${stats.leaderboard_rank}` : "Unranked"}
              </div>
              <p className="text-xs text-muted-foreground">Climb the rankings!</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Available Courses */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Available Courses
                </CardTitle>
                <CardDescription>
                  Explore and enroll in courses to start learning!
                </CardDescription>
              </CardHeader>
              <CardContent>
                {availableCourses.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                      No courses available yet. Check back soon!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availableCourses.map((course) => (
                      <Card key={course.id} className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex gap-3">
                            <img
                              src={course.image_url || "/placeholder-course.jpg"}
                              alt={course.title}
                              className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                                {course.title}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                                {course.description}
                              </p>
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className="text-xs capitalize">
                                  {course.category}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  {course.levels} levels
                                </span>
                              </div>
                              <p className="text-xs text-gray-500">
                                By {course.instructor_name}
                              </p>
                            </div>
                          </div>
                          <div className="mt-3 flex justify-between items-center">
                            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                              {course.max_xp.toLocaleString()} XP total
                            </span>
                            <Button
                              onClick={() => course.enrolled ? navigate(`/dashboard/learner/course/${course.id}`) : handleEnrollCourse(course.id)}
                              size="sm"
                              variant={course.enrolled ? "outline" : "default"}
                            >
                              {course.enrolled ? "Continue Learning" : "Enroll Now"}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* User Info */}
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Your learning profile</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Full Name</p>
                <p className="text-gray-900 dark:text-white font-semibold">{user.name}</p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Username</p>
                <p className="text-gray-900 dark:text-white font-semibold">@{user.username}</p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Email</p>
                <p className="text-gray-900 dark:text-white font-semibold text-sm break-all">{user.email}</p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Role</p>
                <p className="text-gray-900 dark:text-white font-semibold capitalize">{user.role}</p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Verified</p>
                <p className={`font-semibold ${user.is_verified ? "text-green-600" : "text-yellow-600"}`}>
                  {user.is_verified ? "✓ Verified" : "⏳ Pending"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}