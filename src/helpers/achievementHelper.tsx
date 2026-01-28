import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

interface BadgeAwardResult {
  success: boolean
  badgeName?: string
  message: string
  xpAwarded?: number
  newLevel?: number
}

/**
 * Award a badge to a user if they don't already have it
 * @param userId - The user's ID
 * @param badgeName - The name of the badge to award
 * @returns Promise with success status and message
 */
export const awardBadge = async (
  userId: string,
  badgeName: string,
  showToast: boolean = true
): Promise<BadgeAwardResult> => {
  try {
    // Find the badge by name
    const { data: badge, error: badgeError } = await supabase
      .from("badges")
      .select("id, xp_reward")
      .eq("name", badgeName)
      .single()

    if (badgeError || !badge) {
      console.warn(`Badge "${badgeName}" not found`)
      return {
        success: false,
        message: `Badge "${badgeName}" not found`
      }
    }

    // Check if user already has this badge
    const { data: existingBadge, error: existingError } = await supabase
      .from("user_badges")
      .select("id")
      .eq("user_id", userId)
      .eq("badge_id", badge.id)
      .single()

    if (existingError && existingError.code !== 'PGRST116') {
      throw existingError
    }

    // If user already has the badge, return early
    if (existingBadge) {
      return {
        success: false,
        message: `You already have the "${badgeName}" badge`
      }
    }

    // Award the badge
    const { error: insertError } = await supabase
      .from("user_badges")
      .insert({
        user_id: userId,
        badge_id: badge.id
      })

    if (insertError) throw insertError

    // Get current user stats
    const { data: userStats, error: statsError } = await supabase
      .from("user_stats")
      .select("badges_count, total_xp, current_level")
      .eq("user_id", userId)
      .single()

    if (statsError && statsError.code !== 'PGRST116') {
      throw statsError
    }

    const currentBadgesCount = userStats?.badges_count || 0
    const currentXP = userStats?.total_xp || 0
    const currentLevel = userStats?.current_level || 1
    const newTotalXP = currentXP + (badge.xp_reward || 0)
    
    // Calculate new level based on XP
    const newLevel = getLevelFromXP(newTotalXP)
    const leveledUp = newLevel > currentLevel

    // Update user stats: increment badges count and add XP
    const { error: updateError } = await supabase
      .from("user_stats")
      .update({ 
        badges_count: currentBadgesCount + 1,
        total_xp: newTotalXP,
        current_level: newLevel
      })
      .eq("user_id", userId)

    if (updateError) throw updateError

    // If leveled up, check for level-based badges
    if (leveledUp) {
      await checkAndAwardLevelBadges(userId, newLevel)
      
      if (showToast) {
        toast.success(`Level Up! 🎊`, {
          description: `You've reached Level ${newLevel}!`
        })
      }
    }

    // Check XP milestones
    await checkAndAwardXPMilestones(userId, newTotalXP)

    // Check badge collection milestones
    await checkAndAwardBadgeCollectionMilestones(userId, currentBadgesCount + 1)

    if (showToast) {
      toast.success("Achievement Unlocked! 🎉", {
        description: `Congratulations! You've earned the "${badgeName}" badge${badge.xp_reward > 0 ? ` and ${badge.xp_reward} XP!` : '!'}`      })
    }

    return {
      success: true,
      badgeName: badgeName,
      message: `Successfully awarded "${badgeName}" badge`,
      xpAwarded: badge.xp_reward || 0,
      newLevel: newLevel
    }
  } catch (error) {
    console.error("Error awarding badge:", error)
    if (showToast) {
      toast.error("Error", {
        description: "Failed to award badge"
      })
    }
    return {
      success: false,
      message: "Failed to award badge"
    }
  }
}

/**
 * Award XP to user without a badge
 * @param userId - The user's ID
 * @param xpAmount - Amount of XP to award
 * @param reason - Reason for XP award (for potential logging)
 */
export const awardXP = async (
  userId: string,
  xpAmount: number,
): Promise<{ success: boolean; newXP: number; newLevel: number }> => {
  try {
    // Get current user stats
    const { data: userStats, error: statsError } = await supabase
      .from("user_stats")
      .select("total_xp, current_level")
      .eq("user_id", userId)
      .single()

    if (statsError) throw statsError

    const currentXP = userStats?.total_xp || 0
    const currentLevel = userStats?.current_level || 1
    const newTotalXP = currentXP + xpAmount
    
    // Calculate new level based on XP
    const newLevel = getLevelFromXP(newTotalXP)
    const leveledUp = newLevel > currentLevel

    // Update user stats: add XP
    const { error: updateError } = await supabase
      .from("user_stats")
      .update({ 
        total_xp: newTotalXP,
        current_level: newLevel
      })
      .eq("user_id", userId)

    if (updateError) throw updateError

    // If leveled up, check for level-based badges
    if (leveledUp) {
      await checkAndAwardLevelBadges(userId, newLevel)
      
      toast.success(`Level Up! 🎊`, {
        description: `You've reached Level ${newLevel}!`
      })
    }

    // Check XP milestones
    await checkAndAwardXPMilestones(userId, newTotalXP)

    return {
      success: true,
      newXP: newTotalXP,
      newLevel: newLevel
    }
  } catch (error) {
    console.error("Error awarding XP:", error)
    return {
      success: false,
      newXP: 0,
      newLevel: 1
    }
  }
}

/**
 * Calculate level from total XP
 * @param xp - Total XP
 * @returns Level number
 */
const getLevelFromXP = (xp: number): number => {
  let level = 1
  let xpRequired = 0
  let increment = 100

  while (xp >= xpRequired) {
    level++
    xpRequired += increment
    increment += 50
  }

  return level - 1
}

/**
 * Check if user qualifies for level-based badges and award them
 * @param userId - The user's ID
 * @param currentLevel - The user's current level
 */
export const checkAndAwardLevelBadges = async (
  userId: string,
  currentLevel: number
): Promise<void> => {
  const levelBadges: { [key: number]: string } = {
    1: "🌱 Beginner Badge",
    10: "🥉 Bronze Badge",
    30: "🥈 Silver Badge",
    50: "🥇 Gold Badge",
    70: "💎 Master Badge"
  }

  // Check each level badge
  for (const [level, badgeName] of Object.entries(levelBadges)) {
    if (currentLevel >= parseInt(level)) {
      await awardBadge(userId, badgeName, false)
    }
  }
}

/**
 * Check and award XP milestone badges
 * @param userId - The user's ID
 * @param totalXP - The user's total XP
 */
export const checkAndAwardXPMilestones = async (
  userId: string,
  totalXP: number
): Promise<void> => {
  const xpMilestones: { [key: number]: string } = {
    1000: "XP Hunter",
    5000: "XP Collector",
    10000: "XP Master",
    25000: "XP Legend"
  }

  for (const [xp, badgeName] of Object.entries(xpMilestones)) {
    if (totalXP >= parseInt(xp)) {
      await awardBadge(userId, badgeName, false)
    }
  }
}

/**
 * Check and award badge collection milestones
 * @param userId - The user's ID
 * @param badgesCount - The user's total badges count
 */
export const checkAndAwardBadgeCollectionMilestones = async (
  userId: string,
  badgesCount: number
): Promise<void> => {
  const badgeMilestones: { [key: number]: string } = {
    10: "Badge Collector",
    25: "Badge Hunter",
    50: "Badge Legend"
  }

  for (const [count, badgeName] of Object.entries(badgeMilestones)) {
    if (badgesCount >= parseInt(count)) {
      await awardBadge(userId, badgeName, false)
    }
  }
}

/**
 * Check and award first course enrollment badge
 * @param userId - The user's ID
 */
export const checkAndAwardFirstCourseEnrollment = async (
  userId: string
): Promise<void> => {
  try {
    const { data: enrollments, error: enrollError } = await supabase
      .from("enrollments")
      .select("id")
      .eq("user_id", userId)

    if (enrollError) throw enrollError

    if (enrollments && enrollments.length === 1) {
      await awardBadge(userId, "First Course Enrollment", true)
    }
  } catch (error) {
    console.error("Error checking first course enrollment:", error)
  }
}

/**
 * Check and award course enrollment milestones
 * @param userId - The user's ID
 */
export const checkAndAwardCourseEnrollmentMilestones = async (
  userId: string
): Promise<void> => {
  try {
    const { data: enrollments, error } = await supabase
      .from("enrollments")
      .select("id")
      .eq("user_id", userId)

    if (error) throw error

    const enrollmentCount = enrollments?.length || 0
    const milestones: { [key: number]: string } = {
      3: "Explorer",
      10: "Adventurer"
    }

    for (const [count, badgeName] of Object.entries(milestones)) {
      if (enrollmentCount >= parseInt(count)) {
        await awardBadge(userId, badgeName, false)
      }
    }
  } catch (error) {
    console.error("Error checking course enrollment milestones:", error)
  }
}

/**
 * Check and award course completion badges
 * @param userId - The user's ID
 */
export const checkAndAwardCourseCompletionBadges = async (
  userId: string
): Promise<void> => {
  try {
    const { data: completedCourses, error } = await supabase
      .from("enrollments")
      .select("id")
      .eq("user_id", userId)
      .not("completed_at", "is", null)

    if (error) throw error

    const completionCount = completedCourses?.length || 0
    const milestones: { [key: number]: string } = {
      1: "Course Rookie",
      5: "Course Veteran",
      10: "Course Master",
      25: "Course Legend"
    }

    for (const [count, badgeName] of Object.entries(milestones)) {
      if (completionCount >= parseInt(count)) {
        await awardBadge(userId, badgeName, false)
      }
    }
  } catch (error) {
    console.error("Error checking course completion badges:", error)
  }
}

/**
 * Check and award first lesson completion badge
 * @param userId - The user's ID
 */
export const checkAndAwardFirstLessonCompletion = async (
  userId: string
): Promise<void> => {
  try {
    const { data: completions, error: completionError } = await supabase
      .from("elearning_progress")
      .select("id")
      .eq("user_id", userId)
      .not("completed_at", "is", null)

    if (completionError) throw completionError

    if (completions && completions.length === 1) {
      await awardBadge(userId, "First Steps", true)
    }
  } catch (error) {
    console.error("Error checking first lesson completion:", error)
  }
}

/**
 * Check and award quiz/challenge completion badges
 * @param userId - The user's ID
 */
export const checkAndAwardQuizChallengeCompletions = async (
  userId: string
): Promise<void> => {
  try {
    const { data: attempts, error } = await supabase
      .from("resource_attempts")
      .select("resource_content!inner(type)")
      .eq("user_id", userId)
      .eq("status", "completed")

    if (error) throw error

    const quizCount = attempts?.filter((a: any) => a.resource_content?.type === "quiz").length || 0
    const challengeCount = attempts?.filter((a: any) => a.resource_content?.type === "challenge").length || 0

    if (quizCount >= 10) await awardBadge(userId, "Quiz Champion", false)
    if (challengeCount >= 10) await awardBadge(userId, "Challenge Conqueror", false)
  } catch (error) {
    console.error("Error checking quiz/challenge completions:", error)
  }
}

/**
 * Check and award quiz master badge (100% score)
 * @param userId - The user's ID
 * @param score - The user's quiz score
 * @param maxScore - The maximum possible score
 */
export const checkAndAwardQuizMaster = async (
  userId: string,
  score: number,
  maxScore: number
): Promise<void> => {
  try {
    if (score === maxScore && maxScore > 0) {
      await awardBadge(userId, "Quiz Master", true)
    }
  } catch (error) {
    console.error("Error checking quiz master badge:", error)
  }
}

/**
 * Check and award perfect score badges
 * @param userId - The user's ID
 */
export const checkAndAwardPerfectScoreBadges = async (
  userId: string,
): Promise<void> => {
  try {
    // Check for perfect score streak
    const { data: recentAttempts, error } = await supabase
      .from("resource_attempts")
      .select("score, max_score, resource_content!inner(type)")
      .eq("user_id", userId)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(3)

    if (error) throw error

    const quizAttempts = recentAttempts?.filter((a: any) => a.resource_content?.type === "quiz") || []
    if (quizAttempts.length >= 3) {
      const allPerfect = quizAttempts.slice(0, 3).every((a: any) => a.score === a.max_score)
      if (allPerfect) {
        await awardBadge(userId, "Perfect Score Streak", false)
      }
    }

    // Check for flawless victory
    const { data: perfectChallenges, error: perfectError } = await supabase
      .from("resource_attempts")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "completed")
      .eq("resource_content.type", "challenge")
      .eq("score", "max_score")

    if (!perfectError && perfectChallenges && perfectChallenges.length >= 1) {
      await awardBadge(userId, "Flawless Victory", false)
    }

    // Check for problem solver (5 perfect challenges)
    if (!perfectError && perfectChallenges && perfectChallenges.length >= 5) {
      await awardBadge(userId, "Problem Solver", false)
    }
  } catch (error) {
    console.error("Error checking perfect score badges:", error)
  }
}

/**
 * Check and award speed demon badge (completed in under 2 minutes)
 * @param userId - The user's ID
 * @param timeTaken - Time taken in seconds
 */
export const checkAndAwardSpeedDemon = async (
  userId: string,
  timeTaken: number
): Promise<void> => {
  try {
    if (timeTaken < 120) {
      await awardBadge(userId, "Speed Demon", true)
    }

    // Check for speedster (under 30 seconds)
    if (timeTaken < 30) {
      await awardBadge(userId, "Speedster", false)
    }

    // Check for lightning fast (5 under 1 minute)
    const { data: fastAttempts, error } = await supabase
      .from("resource_attempts")
      .select("id")
      .eq("user_id", userId)
      .lt("time_taken", 60)
      .eq("status", "completed")

    if (!error && fastAttempts && fastAttempts.length >= 5) {
      await awardBadge(userId, "Lightning Fast", false)
    }
  } catch (error) {
    console.error("Error checking speed demon badge:", error)
  }
}

/**
 * Check and award difficulty mastery badges
 * @param userId - The user's ID
 */
export const checkAndAwardDifficultyMasteryBadges = async (
  userId: string
): Promise<void> => {
  try {
    const { data: attempts, error } = await supabase
      .from("resource_attempts")
      .select("resource_content!inner(difficulty)")
      .eq("user_id", userId)
      .eq("status", "completed")

    if (error) throw error

    const beginnerCount = attempts?.filter((a: any) => a.resource_content?.difficulty === "beginner").length || 0
    const intermediateCount = attempts?.filter((a: any) => a.resource_content?.difficulty === "intermediate").length || 0
    const advancedCount = attempts?.filter((a: any) => a.resource_content?.difficulty === "advanced").length || 0

    if (beginnerCount >= 10) await awardBadge(userId, "Beginner Mastery", false)
    if (intermediateCount >= 10) await awardBadge(userId, "Intermediate Mastery", false)
    if (advancedCount >= 10) await awardBadge(userId, "Advanced Mastery", false)
    
    if (beginnerCount >= 5 && intermediateCount >= 5 && advancedCount >= 5) {
      await awardBadge(userId, "Expert Mastery", false)
    }
  } catch (error) {
    console.error("Error checking difficulty mastery badges:", error)
  }
}

/**
 * Check and award premium badges
 * @param userId - The user's ID
 * @param isPremiumCourse - Whether the enrolled course is premium
 */
export const checkAndAwardPremiumBadges = async (
  userId: string,
  isPremiumCourse: boolean
): Promise<void> => {
  try {
    if (!isPremiumCourse) return

    const { data: premiumEnrollments, error } = await supabase
      .from("enrollments")
      .select("courses!inner(premium_enabled)")
      .eq("user_id", userId)
      .eq("courses.premium_enabled", true)

    if (error) throw error

    const premiumCount = premiumEnrollments?.length || 0
    
    if (premiumCount === 1) {
      await awardBadge(userId, "Premium Pioneer", true)
    }

    const { data: completedPremium, error: completedError } = await supabase
      .from("enrollments")
      .select("id")
      .eq("user_id", userId)
      .eq("courses.premium_enabled", true)
      .not("completed_at", "is", null)

    if (!completedError && completedPremium && completedPremium.length >= 5) {
      await awardBadge(userId, "Premium Collector", false)
    }
  } catch (error) {
    console.error("Error checking premium badges:", error)
  }
}

/**
 * Check and award time-of-day badges
 * @param userId - The user's ID
 * @param completionTime - The time when activity was completed
 */
export const checkAndAwardTimeOfDayBadges = async (
  userId: string,
  completionTime: Date = new Date()
): Promise<void> => {
  try {
    const hour = completionTime.getHours()

    // Early Bird (before 8 AM)
    if (hour < 8) {
      await awardBadge(userId, "Early Bird", false)
    }

    // Night Owl (after 10 PM)
    if (hour >= 22) {
      await awardBadge(userId, "Night Owl", false)
    }

    // Coffee Lover (6-9 AM)
    if (hour >= 6 && hour < 9) {
      const { data: morningLessons, error } = await supabase
        .from("elearning_progress")
        .select("completed_at")
        .eq("user_id", userId)
        .not("completed_at", "is", null)

      if (!error && morningLessons) {
        const morningCount = morningLessons.filter((l: any) => {
          const lessonHour = new Date(l.completed_at).getHours()
          return lessonHour >= 6 && lessonHour < 9
        }).length

        if (morningCount >= 5) {
          await awardBadge(userId, "Coffee Lover", false)
        }
      }
    }

    // Midnight Scholar (exactly midnight)
    if (hour === 0 && completionTime.getMinutes() === 0) {
      await awardBadge(userId, "Midnight Scholar", false)
    }
  } catch (error) {
    console.error("Error checking time-of-day badges:", error)
  }
}

/**
 * Check and award starter badge on first login
 * @param userId - The user's ID
 */
export const checkAndAwardStarterBadge = async (
  userId: string
): Promise<void> => {
  try {
    await awardBadge(userId, "LevelupED Starter!", true)
  } catch (error) {
    console.error("Error awarding starter badge:", error)
  }
}

/**
 * Check and award leaderboard badges
 * @param userId - The user's ID
 */
export const checkAndAwardLeaderboardBadges = async (
  userId: string
): Promise<void> => {
  try {
    const { data: stats, error } = await supabase
      .from("user_stats")
      .select("leaderboard_rank")
      .eq("user_id", userId)
      .single()

    if (error) throw error

    const rank = stats?.leaderboard_rank
    if (rank <= 100) await awardBadge(userId, "Top 100", false)
    if (rank <= 50) await awardBadge(userId, "Top 50", false)
    if (rank <= 10) await awardBadge(userId, "Top 10", false)
    if (rank === 1) await awardBadge(userId, "Champion", false)
  } catch (error) {
    console.error("Error checking leaderboard badges:", error)
  }
}

/**
 * Check and award world traveler badge (courses from 5 different countries)
 * @param userId - The user's ID
 */
export const checkAndAwardWorldTraveler = async (
  userId: string
): Promise<void> => {
  try {
    const { data: enrollments, error } = await supabase
      .from("enrollments")
      .select("courses!inner(country_id)")
      .eq("user_id", userId)

    if (error) throw error

    const uniqueCountries = new Set(enrollments?.map((e: any) => e.courses?.country_id).filter(Boolean))
    if (uniqueCountries.size >= 5) {
      await awardBadge(userId, "World Traveler", false)
    }
  } catch (error) {
    console.error("Error checking world traveler badge:", error)
  }
}

/**
 * Check and award knowledge seeker (complete all lessons in a course)
 * @param userId - The user's ID
 * @param courseId - The course ID
 */
export const checkAndAwardKnowledgeSeeker = async (
  userId: string,
  courseId: string
): Promise<void> => {
  try {
    // Get all elearning_content for the course
    const { data: contents, error: contentError } = await supabase
      .from("elearning_content")
      .select("id")
      .eq("course_id", courseId)

    if (contentError) throw contentError

    const totalLessons = contents?.length || 0
    if (totalLessons === 0) return

    // Get completed lessons for the user in this course
    const { data: progress, error: progressError } = await supabase
      .from("elearning_progress")
      .select("id")
      .eq("user_id", userId)
      .in("elearning_content_id", contents.map(c => c.id))
      .not("completed_at", "is", null)

    if (progressError) throw progressError

    if (progress && progress.length === totalLessons) {
      await awardBadge(userId, "Knowledge Seeker", false)
    }
  } catch (error) {
    console.error("Error checking knowledge seeker badge:", error)
  }
}

/**
 * Comprehensive achievement check - called after major actions
 * @param userId - The user's ID
 */
export const checkAllAchievements = async (userId: string): Promise<void> => {
  try {
    // Fetch user stats
    const { data: stats, error } = await supabase
      .from("user_stats")
      .select("total_xp, current_level, badges_count, leaderboard_rank")
      .eq("user_id", userId)
      .single()

    if (error) throw error

    // Check all achievement types
    await checkAndAwardLevelBadges(userId, stats.current_level)
    await checkAndAwardXPMilestones(userId, stats.total_xp)
    await checkAndAwardBadgeCollectionMilestones(userId, stats.badges_count)
    await checkAndAwardLeaderboardBadges(userId)
    await checkAndAwardCourseEnrollmentMilestones(userId)
    await checkAndAwardCourseCompletionBadges(userId)
    await checkAndAwardQuizChallengeCompletions(userId)
    await checkAndAwardDifficultyMasteryBadges(userId)
    await checkAndAwardWorldTraveler(userId)
  } catch (error) {
    console.error("Error checking all achievements:", error)
  }
}

// Export the helper function for use in other files
export { getLevelFromXP }