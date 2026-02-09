import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

interface BadgeAwardResult {
  success: boolean
  badgeId?: string
  newXP?: number
  badgeName?: string
  message: string
  xpAwarded?: number
  newLevel?: number
}

/**
 * Calculate level from total XP
 * @param xp - Total XP
 * @returns Level number
 */
const getLevelFromXP = (xp: number): number => {
  if (xp <= 0) return 1
  let level = 1
  let required = 0
  while (true) {
    const nextRequired = required + 60 + (level - 1) * 15
    if (xp < nextRequired) break
    required = nextRequired
    level++
  }
  return level
}

/**
 * Update user stats (XP and level) - helper function
 */
const updateUserStats = async (
  userId: string,
  newTotalXP: number,
  newLevel: number
): Promise<boolean> => {
  try {
    // Method 1: Try RPC function first
    const { error: rpcError } = await supabase.rpc('update_user_stats_simple', {
      p_user_id: userId,
      p_total_xp: newTotalXP,
      p_current_level: newLevel
    })

    if (!rpcError) {
      console.log(`✅ Stats updated via RPC: total_xp=${newTotalXP}, current_level=${newLevel}`)
      return true
    }

    console.warn("RPC failed, trying upsert:", rpcError.message)

    // Method 2: Try upsert
    const { error: upsertError } = await supabase
      .from("user_stats")
      .upsert({
        user_id: userId,
        total_xp: newTotalXP,
        current_level: newLevel,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })

    if (!upsertError) {
      console.log(`✅ Stats updated via upsert: total_xp=${newTotalXP}, current_level=${newLevel}`)
      return true
    }

    console.warn("Upsert failed, trying separate update/insert:", upsertError.message)

    // Method 3: Try direct update
    const { data: updateData, error: updateError } = await supabase
      .from("user_stats")
      .update({
        total_xp: newTotalXP,
        current_level: newLevel,
        updated_at: new Date().toISOString()
      })
      .eq("user_id", userId)
      .select()

    if (!updateError && updateData && updateData.length > 0) {
      console.log(`✅ Stats updated via direct update: total_xp=${newTotalXP}, current_level=${newLevel}`)
      return true
    }

    // Method 4: Try insert if update found no rows
    if (!updateData || updateData.length === 0) {
      console.log("No existing stats found, trying insert...")
      const { error: insertError } = await supabase
        .from("user_stats")
        .insert({
          user_id: userId,
          total_xp: newTotalXP,
          current_level: newLevel
        })

      if (!insertError) {
        console.log(`✅ Stats inserted: total_xp=${newTotalXP}, current_level=${newLevel}`)
        return true
      }

      console.error("Insert failed:", insertError.message)
    }

    console.error("All update methods failed")
    return false

  } catch (error: any) {
    console.error("Error in updateUserStats:", error.message)
    return false
  }
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
    console.log(`🏆 Attempting to award badge "${badgeName}" to user ${userId}`)

    // Get the badge by name
    const { data: badge, error: badgeError } = await supabase
      .from("badges")
      .select("id, xp_reward, name")
      .eq("name", badgeName)
      .single()

    if (badgeError || !badge) {
      console.warn(`❌ Badge "${badgeName}" not found in database:`, badgeError)
      return {
        success: false,
        message: "Badge not found"
      }
    }

    console.log(`Found badge:`, badge)

    // Check if user already has this badge
    const { data: existingBadge } = await supabase
      .from("user_badges")
      .select("id")
      .eq("user_id", userId)
      .eq("badge_id", badge.id)
      .maybeSingle()

    if (existingBadge) {
      console.log(`User already has badge "${badgeName}"`)
      return {
        success: false,
        message: "You already have this badge"
      }
    }

    // Award the badge first
    const { error: awardError } = await supabase
      .from("user_badges")
      .insert({
        user_id: userId,
        badge_id: badge.id,
        earned_at: new Date().toISOString()
      })

    if (awardError) {
      console.error("❌ Error inserting badge:", awardError)
      throw awardError
    }

    console.log(`✅ Badge "${badgeName}" inserted successfully`)

    // Get current stats
    let { data: currentStats } = await supabase
      .from("user_stats")
      .select("total_xp, current_level")
      .eq("user_id", userId)
      .maybeSingle()

    const currentXP = currentStats?.total_xp || 0
    const currentLevel = currentStats?.current_level || 1
    const xpReward = badge.xp_reward || 0
    const newTotalXP = currentXP + xpReward
    const newLevel = getLevelFromXP(newTotalXP)

    // Update user stats
    const statsUpdated = await updateUserStats(userId, newTotalXP, newLevel)

    if (!statsUpdated) {
      console.warn("⚠️ Stats update failed, but badge was awarded")
      if (showToast) {
        toast.success(`Badge Unlocked! 🏆`, {
          description: `You earned the "${badgeName}" badge!`
        })
      }
      return {
        success: true,
        message: `Successfully awarded ${badgeName} badge (XP update failed)`,
        badgeId: badge.id,
        xpAwarded: 0
      }
    }

    // Check for level up
    const leveledUp = newLevel > currentLevel

    if (showToast) {
      toast.success(`Badge Unlocked! 🏆`, {
        description: `You earned the "${badgeName}" badge and ${xpReward} XP!`
      })

      if (leveledUp) {
        setTimeout(() => {
          toast.success(`Level Up! 🎊`, {
            description: `You've reached Level ${newLevel}!`
          })
        }, 1000)
      }
    }

    console.log(`🎉 Badge "${badgeName}" awarded successfully with ${xpReward} XP`)

    return {
      success: true,
      message: `Successfully awarded ${badgeName} badge`,
      badgeId: badge.id,
      xpAwarded: xpReward,
      newLevel: newLevel,
      newXP: newTotalXP
    }

  } catch (error: any) {
    console.error("❌ Error awarding badge:", error)
    if (showToast) {
      toast.error("Error", {
        description: "Failed to award badge"
      })
    }
    return {
      success: false,
      message: error.message
    }
  }
}

/**
 * Award XP to user without a badge
 * @param userId - The user's ID
 * @param xpAmount - Amount of XP to award
 */
export const awardXP = async (
  userId: string,
  xpAmount: number,
): Promise<{ success: boolean; newXP: number; newLevel: number }> => {
  try {
    // Get current user stats
    let { data: userStats } = await supabase
      .from("user_stats")
      .select("total_xp, current_level")
      .eq("user_id", userId)
      .maybeSingle()

    const currentXP = userStats?.total_xp || 0
    const currentLevel = userStats?.current_level || 1
    const newTotalXP = currentXP + xpAmount
    const newLevel = getLevelFromXP(newTotalXP)
    const leveledUp = newLevel > currentLevel

    // Update user stats
    const statsUpdated = await updateUserStats(userId, newTotalXP, newLevel)

    if (!statsUpdated) {
      return {
        success: false,
        newXP: currentXP,
        newLevel: currentLevel
      }
    }

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

// ...rest of the file stays the same...

/**
 * Check if user qualifies for level-based badges and award them
 */
export const checkAndAwardLevelBadges = async (
  userId: string,
  currentLevel: number
): Promise<void> => {
  try {
    const levelBadges: { [key: number]: string } = {
      1: "🌱 Beginner Badge",
      10: "🥉 Bronze Badge",
      30: "🥈 Silver Badge",
      50: "🥇 Gold Badge",
      70: "💎 Master Badge"
    }

    for (const [level, badgeName] of Object.entries(levelBadges)) {
      if (currentLevel >= parseInt(level)) {
        await awardBadge(userId, badgeName, false)
      }
    }
  } catch (error) {
    console.error("Error checking level badges:", error)
  }
}

/**
 * Check and award XP milestone badges
 */
export const checkAndAwardXPMilestones = async (
  userId: string,
  totalXP: number
): Promise<void> => {
  try {
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
  } catch (error) {
    console.error("Error checking XP milestones:", error)
  }
}

/**
 * Check and award badge collection milestones
 */
export const checkAndAwardBadgeCollectionMilestones = async (
  userId: string
): Promise<void> => {
  try {
    const { data: userBadges, error } = await supabase
      .from("user_badges")
      .select("id")
      .eq("user_id", userId)

    if (error) throw error

    const badgesCount = userBadges?.length || 0

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
  } catch (error) {
    console.error("Error checking badge collection milestones:", error)
  }
}

/**
 * Check and award first course enrollment badge
 */
export const checkAndAwardFirstCourseEnrollment = async (
  userId: string
): Promise<void> => {
  try {
    const { data: enrollments, error } = await supabase
      .from("enrollments")
      .select("id")
      .eq("user_id", userId)

    if (error) throw error

    if (enrollments && enrollments.length >= 1) {
      await awardBadge(userId, "First Course Enrollment", true)
    }
  } catch (error) {
    console.error("Error checking first course enrollment:", error)
  }
}

/**
 * Check and award course enrollment milestones
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

    if (enrollmentCount >= 1) {
      await awardBadge(userId, "First Course Enrollment", false)
    }

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

    if (error) {
      console.warn("Error fetching completed courses:", error)
      return
    }

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
 */
export const checkAndAwardFirstLessonCompletion = async (
  userId: string
): Promise<void> => {
  try {
    const { data: completions, error } = await supabase
      .from("elearning_progress")
      .select("id")
      .eq("user_id", userId)
      .not("completed_at", "is", null)

    if (error) {
      console.warn("Error fetching lesson completions:", error)
      return
    }

    if (completions && completions.length >= 1) {
      await awardBadge(userId, "First Steps", true)
    }
  } catch (error) {
    console.error("Error checking first lesson completion:", error)
  }
}

/**
 * Check and award quiz master badge (100% score)
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
 * Check and award speed demon badge (completed in under 2 minutes)
 */
export const checkAndAwardSpeedDemon = async (
  userId: string,
  timeTaken: number
): Promise<void> => {
  try {
    if (timeTaken < 120) {
      await awardBadge(userId, "Speed Demon", true)
    }
    if (timeTaken < 30) {
      await awardBadge(userId, "Speedster", false)
    }
  } catch (error) {
    console.error("Error checking speed demon badge:", error)
  }
}

/**
 * Check and award world traveler badge
 */
export const checkAndAwardWorldTraveler = async (
  userId: string
): Promise<void> => {
  try {
    const { data: enrollments, error } = await supabase
      .from("enrollments")
      .select("course_id")
      .eq("user_id", userId)

    if (error || !enrollments || enrollments.length === 0) return

    const courseIds = enrollments.map(e => e.course_id)
    const { data: courses } = await supabase
      .from("courses")
      .select("country_id")
      .in("id", courseIds)

    const uniqueCountries = new Set(courses?.map(c => c.country_id).filter(Boolean))
    if (uniqueCountries.size >= 5) {
      await awardBadge(userId, "World Traveler", false)
    }
  } catch (error) {
    console.error("Error checking world traveler badge:", error)
  }
}

/**
 * Check and award knowledge seeker badge
 */
export const checkAndAwardKnowledgeSeeker = async (
  userId: string,
  courseId: string
): Promise<void> => {
  try {
    const { data: contents } = await supabase
      .from("elearning_content")
      .select("id")
      .eq("course_id", courseId)

    if (!contents || contents.length === 0) return

    const { data: progress } = await supabase
      .from("elearning_progress")
      .select("id")
      .eq("user_id", userId)
      .in("elearning_content_id", contents.map(c => c.id))
      .not("completed_at", "is", null)

    if (progress && progress.length === contents.length) {
      await awardBadge(userId, "Knowledge Seeker", false)
    }
  } catch (error) {
    console.error("Error checking knowledge seeker badge:", error)
  }
}

/**
 * Check and award starter badge on first login
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
 * Comprehensive achievement check
 */
export const checkAllAchievements = async (userId: string): Promise<void> => {
  try {
    let { data: stats } = await supabase
      .from("user_stats")
      .select("total_xp, current_level")
      .eq("user_id", userId)
      .maybeSingle()

    if (!stats) {
      stats = { total_xp: 0, current_level: 1 }
    }

    await checkAndAwardLevelBadges(userId, stats.current_level)
    await checkAndAwardXPMilestones(userId, stats.total_xp)
    await checkAndAwardBadgeCollectionMilestones(userId)
    await checkAndAwardCourseEnrollmentMilestones(userId)
    await checkAndAwardCourseCompletionBadges(userId)
    await checkAndAwardWorldTraveler(userId)
  } catch (error) {
    console.error("Error checking all achievements:", error)
  }
}

export { getLevelFromXP }