ALTER TABLE users ADD COLUMN avatar_border VARCHAR(50) DEFAULT NULL;
ALTER TABLE users ADD COLUMN bio TEXT DEFAULT NULL;
ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500) DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Create an index for faster queries
CREATE INDEX idx_users_avatar_border ON users(avatar_border);

-- Create courses table
CREATE TABLE courses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    image_url TEXT,
    levels INTEGER DEFAULT 10,
    max_xp INTEGER DEFAULT 5000,
    leaderboard_enabled BOOLEAN DEFAULT true,
    badges_enabled BOOLEAN DEFAULT true,
    quests_enabled BOOLEAN DEFAULT true,
    premium_enabled BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    instructor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_courses_instructor_id ON courses(instructor_id);
CREATE INDEX idx_courses_status ON courses(status);
ALTER TABLE courses ADD COLUMN latitude DOUBLE PRECISION;
ALTER TABLE courses ADD COLUMN longitude DOUBLE PRECISION;
ALTER TABLE courses ADD COLUMN city_name TEXT;

-- Create indexes for the new columns if needed
CREATE INDEX idx_courses_country_id ON courses(country_id);
CREATE INDEX idx_courses_city_name ON courses(city_name);

-- Enable Row Level Security (RLS)
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Policy: Instructors can only see/manage their own courses
CREATE POLICY "Instructors can view their own courses" ON courses
    FOR SELECT USING (auth.uid() = instructor_id);

CREATE POLICY "Instructors can insert their own courses" ON courses
    FOR INSERT WITH CHECK (auth.uid() = instructor_id);

CREATE POLICY "Instructors can update their own courses" ON courses
    FOR UPDATE USING (auth.uid() = instructor_id);

CREATE POLICY "Anyone can view published courses" ON courses FOR SELECT USING (status = 'published');

CREATE POLICY "Instructors can delete their own courses" ON courses
    FOR DELETE USING (auth.uid() = instructor_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create resource_content table for quizzes and challenges
CREATE TABLE resource_content (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('quiz', 'challenge')),
    title TEXT NOT NULL,
    description TEXT,
    topic TEXT,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    question_count INTEGER DEFAULT 5,
    content JSONB, -- Stores AI-generated questions/challenges
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    ai_prompt TEXT, -- The prompt used for AI generation
    generated_at TIMESTAMP WITH TIME ZONE, -- When AI generation occurred
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE resource_content ADD COLUMN quests JSONB;
ALTER TABLE resource_content ADD COLUMN topic_index INTEGER;
ALTER TABLE resource_content ADD COLUMN programming_language TEXT;
ALTER TABLE resource_content ADD COLUMN code_template TEXT;
ALTER TABLE resource_content ADD COLUMN test_cases TEXT;
ALTER TABLE resource_content ADD COLUMN max_attempts INTEGER DEFAULT 3;

-- Create indexes for better performance
CREATE INDEX idx_resource_content_course_id ON resource_content(course_id);
CREATE INDEX idx_resource_content_type ON resource_content(type);
CREATE INDEX idx_resource_content_status ON resource_content(status);

-- Enable Row Level Security (RLS)
ALTER TABLE resource_content ENABLE ROW LEVEL SECURITY;

-- Policy: Instructors can manage resource content for their courses
CREATE POLICY "Instructors can view resource content for their courses" ON resource_content
    FOR SELECT USING (
        course_id IN (
            SELECT id FROM courses WHERE instructor_id = auth.uid()
        )
    );

CREATE POLICY "Instructors can insert resource content for their courses" ON resource_content
    FOR INSERT WITH CHECK (
        course_id IN (
            SELECT id FROM courses WHERE instructor_id = auth.uid()
        )
    );

CREATE POLICY "Instructors can update resource content for their courses" ON resource_content
    FOR UPDATE USING (
        course_id IN (
            SELECT id FROM courses WHERE instructor_id = auth.uid()
        )
    );

CREATE POLICY "Instructors can delete resource content for their courses" ON resource_content
    FOR DELETE USING (
        course_id IN (
            SELECT id FROM courses WHERE instructor_id = auth.uid()
        )
    );

CREATE POLICY "Enrolled learners can view published resource content" ON resource_content FOR SELECT USING (
  status = 'published' AND course_id IN (
    SELECT course_id FROM enrollments WHERE user_id = auth.uid()
  )
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_resource_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_resource_content_updated_at BEFORE UPDATE ON resource_content
    FOR EACH ROW EXECUTE FUNCTION update_resource_content_updated_at();

-- Create user_stats table for gamification data
CREATE TABLE user_stats (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    total_xp INTEGER DEFAULT 0,
    current_level INTEGER DEFAULT 1,
    badges_count INTEGER DEFAULT 0,
    leaderboard_rank INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create badges table
CREATE TABLE badges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    xp_reward INTEGER DEFAULT 0,
    category TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE badges 
ADD COLUMN instructor_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- Create user_badges table
CREATE TABLE user_badges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, badge_id)
);

-- Create enrollments table for course enrollment
CREATE TABLE enrollments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    progress_percentage INTEGER DEFAULT 0,
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, course_id)
);

-- Enable RLS
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- Policies for user_stats
CREATE POLICY "Users can view their own stats" ON user_stats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own stats" ON user_stats FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Instructors can view enrollments for their courses" ON enrollments FOR SELECT USING (
  course_id IN (
    SELECT id FROM courses WHERE instructor_id = auth.uid()
  )
);

-- Policies for badges (public read)
CREATE POLICY "Anyone can view badges" ON badges FOR SELECT USING (true);

-- Policies for user_badges
CREATE POLICY "Users can view their own badges" ON user_badges FOR SELECT USING (auth.uid() = user_id);

-- Policies for enrollments
CREATE POLICY "Users can view their own enrollments" ON enrollments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can enroll themselves" ON enrollments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Insert some sample badges
INSERT INTO badges (name, description, icon, xp_reward, level_required, category) VALUES
('LevelupED Starter!', 'Welcome to LevelupED! You have joined our learning platform.', '🎉', 0, 1, 'achievement'),
('First Steps', 'Complete your first lesson', '🎯', 50, 0, 'achievement'),
('Quiz Master', 'Score 100% on a quiz', '🧠', 100, 0, 'academic'),
('Speed Demon', 'Complete a challenge in under 2 minutes', '⚡', 75, 0, 'speed'),
('Streak Master', 'Complete 7 days in a row', '🔥', 200, 0, 'consistency'),
('🌱 Beginner Badge', 'Reach Level 1 in LevelupED', '🌱', 0, 1, 'level'),
('🥉 Bronze Badge', 'Reach Level 10 in LevelupED', '🥉', 0, 10, 'level'),
('🥈 Silver Badge', 'Reach Level 30 in LevelupED', '🥈', 0, 30, 'level'),
('🥇 Gold Badge', 'Reach Level 50 in LevelupED', '🥇', 0, 50, 'level'),
('💎 Master Badge', 'Reach Level 70 in LevelupED', '💎', 0, 70, 'level');

-- Course Completion Achievements
INSERT INTO badges (name, description, icon, xp_reward, level_required, category) VALUES
('Course Rookie', 'Complete your first course', '🎓', 150, 0, 'achievement'),
('Course Veteran', 'Complete 5 courses', '📖', 300, 5, 'achievement'),
('Course Master', 'Complete 10 courses', '🏆', 500, 10, 'achievement'),
('Course Legend', 'Complete 25 courses', '👑', 1000, 20, 'achievement'),

-- Quiz & Challenge Achievements
('Perfect Score Streak', 'Get 100% on 3 quizzes in a row', '🎯', 200, 0, 'academic'),
('Quiz Champion', 'Complete 10 quizzes', '📝', 150, 0, 'academic'),
('Challenge Conqueror', 'Complete 10 challenges', '⚔️', 150, 0, 'achievement'),
('Flawless Victory', 'Complete a challenge without any mistakes', '✨', 125, 0, 'achievement'),
('Problem Solver', 'Complete 5 challenges with 100% score', '🧩', 250, 0, 'academic'),

-- XP Milestones
('XP Hunter', 'Earn 1,000 total XP', '💰', 100, 0, 'milestone'),
('XP Collector', 'Earn 5,000 total XP', '💎', 250, 0, 'milestone'),
('XP Master', 'Earn 10,000 total XP', '👑', 500, 0, 'milestone'),
('XP Legend', 'Earn 25,000 total XP', '🌟', 1000, 0, 'milestone'),

-- Consistency & Dedication
('Early Bird', 'Complete a lesson before 8 AM', '🌅', 75, 0, 'consistency'),
('Night Owl', 'Complete a lesson after 10 PM', '🦉', 75, 0, 'consistency'),
('Weekend Warrior', 'Complete lessons on both Saturday and Sunday', '⚔️', 100, 0, 'consistency'),
('Monthly Dedication', 'Complete at least one lesson every day for 30 days', '📅', 500, 0, 'consistency'),
('Unstoppable', 'Complete 14 days in a row', '🔥', 350, 0, 'consistency'),
('Marathon Runner', 'Complete 30 days in a row', '🏃', 750, 0, 'consistency'),

-- Speed & Efficiency
('Lightning Fast', 'Complete 5 challenges in under 1 minute each', '⚡', 200, 0, 'speed'),
('Time Master', 'Complete 10 lessons in one day', '⏰', 250, 0, 'speed'),
('Speedster', 'Complete a quiz in under 30 seconds', '🚀', 100, 0, 'speed'),

-- Social & Engagement
('Helpful Hand', 'Help another learner (future feature)', '🤝', 100, 0, 'social'),
('Community Builder', 'Join 3 study groups (future feature)', '👥', 150, 0, 'social'),
('Discussion Star', 'Post 10 helpful comments (future feature)', '💬', 200, 0, 'social'),

-- Special Achievements
('Curious Mind', 'Complete lessons from 5 different course categories', '🔍', 200, 0, 'achievement'),
('Knowledge Seeker', 'Complete all lessons in a course', '📚', 300, 0, 'achievement'),
('Perfect Week', 'Complete at least one lesson every day for a week with 100% scores', '⭐', 400, 0, 'achievement'),
('Badge Collector', 'Earn 10 different badges', '🏅', 200, 0, 'achievement'),
('Badge Hunter', 'Earn 25 different badges', '🎖️', 500, 0, 'achievement'),
('Badge Legend', 'Earn 50 different badges', '👑', 1000, 0, 'achievement'),

-- Leaderboard Achievements
('Top 100', 'Reach top 100 on the leaderboard', '📊', 150, 0, 'leaderboard'),
('Top 50', 'Reach top 50 on the leaderboard', '📈', 250, 5, 'leaderboard'),
('Top 10', 'Reach top 10 on the leaderboard', '🏆', 500, 10, 'leaderboard'),
('Champion', 'Reach #1 on the leaderboard', '👑', 1000, 15, 'leaderboard'),

-- Skill Mastery
('Beginner Mastery', 'Complete 10 beginner-level challenges', '🌱', 100, 0, 'mastery'),
('Intermediate Mastery', 'Complete 10 intermediate-level challenges', '📊', 200, 5, 'mastery'),
('Advanced Mastery', 'Complete 10 advanced-level challenges', '🎯', 400, 10, 'mastery'),
('Expert Mastery', 'Complete 5 challenges from each difficulty level', '🏆', 500, 15, 'mastery'),

-- Exploration Achievements
('Explorer', 'Enroll in 3 different courses', '🗺️', 100, 0, 'achievement'),
('Adventurer', 'Enroll in 10 different courses', '🧭', 250, 5, 'achievement'),
('World Traveler', 'Complete courses from 5 different countries', '🌍', 300, 10, 'achievement'),

-- Premium & Special
('Premium Pioneer', 'Enroll in your first premium course', '💎', 150, 0, 'premium'),
('Premium Collector', 'Complete 5 premium courses', '👑', 500, 10, 'premium'),

-- Comeback & Resilience
('Comeback Kid', 'Return after 30 days of inactivity', '🔄', 100, 0, 'achievement'),
('Phoenix Rising', 'Improve from a failed quiz to a perfect score', '🔥', 150, 0, 'achievement'),
('Never Give Up', 'Complete a challenge after 3 failed attempts', '💪', 125, 0, 'achievement'),

-- Fun & Creative
('Night Shift', 'Complete 10 lessons between midnight and 6 AM', '🌙', 200, 0, 'fun'),
('Coffee Lover', 'Complete 5 lessons in the morning (6-9 AM)', '☕', 100, 0, 'fun'),
('Weekend Scholar', 'Complete 20 lessons on weekends', '📚', 250, 0, 'fun'),
('Midnight Scholar', 'Complete a lesson at exactly midnight', '🕐', 75, 0, 'fun');

INSERT INTO badges (name, description, icon, xp_reward, level_required, category) VALUES
('First Course Enrollment', 'Congratulations on enrolling in your first course!', '📚', 50, 0, 'achievement');


-- Function to update leaderboard ranks
CREATE OR REPLACE FUNCTION update_leaderboard_ranks()
RETURNS VOID AS $$
BEGIN
    UPDATE user_stats
    SET leaderboard_rank = ranked.rank
    FROM (
        SELECT user_id, ROW_NUMBER() OVER (ORDER BY total_xp DESC) as rank
        FROM user_stats
    ) ranked
    WHERE user_stats.user_id = ranked.user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to initialize user stats
CREATE OR REPLACE FUNCTION initialize_user_stats()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_stats (user_id) VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create user stats on user creation
CREATE TRIGGER create_user_stats_trigger
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION initialize_user_stats();

-- Function to increment user XP and update level
CREATE OR REPLACE FUNCTION increment_user_xp(user_id UUID, xp_amount INTEGER)
RETURNS VOID AS $$
DECLARE
    current_xp INTEGER;
    new_level INTEGER;
BEGIN
    -- Get current XP
    SELECT total_xp INTO current_xp FROM user_stats WHERE user_stats.user_id = increment_user_xp.user_id;
    
    -- Update XP
    UPDATE user_stats 
    SET total_xp = total_xp + xp_amount,
        current_level = FLOOR((total_xp + xp_amount) / 1000) + 1
    WHERE user_stats.user_id = increment_user_xp.user_id;
    
    -- Update leaderboard
    PERFORM update_leaderboard_ranks();
END;
$$ LANGUAGE plpgsql;

-- Add time_limit to resource_content table
ALTER TABLE resource_content ADD COLUMN time_limit INTEGER DEFAULT 10; -- in minutes

-- Create resource_attempts table to track learner attempts
CREATE TABLE resource_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resource_content_id UUID NOT NULL REFERENCES resource_content(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    time_taken INTEGER, -- in seconds
    score INTEGER DEFAULT 0,
    max_score INTEGER DEFAULT 0,
    answers JSONB, -- Store user's answers
    status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'timed_out')),
    xp_earned INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, resource_content_id, started_at) -- Prevent duplicate attempts
);

-- Enable RLS
ALTER TABLE resource_attempts ENABLE ROW LEVEL SECURITY;

-- Policies for resource_attempts
CREATE POLICY "Users can view their own attempts" ON resource_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own attempts" ON resource_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own attempts" ON resource_attempts FOR UPDATE USING (auth.uid() = user_id);

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_resource_attempts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger
CREATE TRIGGER update_resource_attempts_updated_at BEFORE UPDATE ON resource_attempts
    FOR EACH ROW EXECUTE FUNCTION update_resource_attempts_updated_at();

-- Create elearning_content table
CREATE TABLE elearning_content (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    topic TEXT NOT NULL,
    title TEXT NOT NULL,
    content JSONB NOT NULL, -- { sections: [{ title, content, links: [{ title, url }] }] }
    ai_generated BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add elearning_progress table to track section completion
CREATE TABLE elearning_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    elearning_content_id UUID NOT NULL REFERENCES elearning_content(id) ON DELETE CASCADE,
    completed_sections JSONB DEFAULT '[]', -- array of completed section indices
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, elearning_content_id)
);

-- Enable RLS
ALTER TABLE elearning_content ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Instructors can manage their elearning content" ON elearning_content FOR ALL USING (
  course_id IN (
    SELECT id FROM courses WHERE instructor_id = auth.uid()
  )
);

CREATE POLICY "Enrolled learners can view elearning content" ON elearning_content FOR SELECT USING (
  course_id IN (
    SELECT course_id FROM enrollments WHERE user_id = auth.uid()
  )
);

-- Create user_sessions table
CREATE TABLE user_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_session_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);

-- Create countries_levels table
CREATE TABLE countries_levels (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    country_name TEXT NOT NULL UNIQUE,
    min_level INTEGER NOT NULL,
    max_level INTEGER NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add country_id to courses table
ALTER TABLE courses ADD COLUMN country_id UUID REFERENCES countries_levels(id);
ALTER TABLE countries_levels ADD COLUMN base_country TEXT;

-- Create index
CREATE INDEX idx_courses_country_id ON courses(country_id);


-- Allow authenticated users to read their own avatars
CREATE POLICY "Users can read their own avatars"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'profile_pictures' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to upload avatars
CREATE POLICY "Users can upload their own avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile_pictures'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to update their avatars
CREATE POLICY "Users can update their own avatars"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profile_pictures'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to delete their avatars
CREATE POLICY "Users can delete their own avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profile_pictures'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create a simple function to update user stats without triggering leaderboard updates
CREATE OR REPLACE FUNCTION update_user_stats_simple(
  p_user_id UUID,
  p_total_xp INTEGER,
  p_current_level INTEGER
)
RETURNS VOID AS $$
BEGIN
  UPDATE user_stats 
  SET 
    total_xp = p_total_xp,
    current_level = p_current_level,
    updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_user_stats_simple(UUID, INTEGER, INTEGER) TO authenticated;



--------------------------------------------------------------------------------------------
-- Create star_currency table for tracking user stars
CREATE TABLE star_currency (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    total_stars INTEGER DEFAULT 0,
    earned_today INTEGER DEFAULT 0,
    last_login_date DATE,
    login_streak INTEGER DEFAULT 0,
    last_streak_reset_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create login_history table to track daily logins
CREATE TABLE login_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    login_date DATE NOT NULL,
    stars_earned INTEGER DEFAULT 0,
    streak_bonus_stars INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, login_date)
);

-- Create indexes for faster queries
CREATE INDEX idx_star_currency_user_id ON star_currency(user_id);
CREATE INDEX idx_login_history_user_id ON login_history(user_id);
CREATE INDEX idx_login_history_login_date ON login_history(login_date);

-- Enable RLS
ALTER TABLE star_currency ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;

-- Policies for star_currency
CREATE POLICY "Users can view their own star currency" ON star_currency 
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own star currency" ON star_currency 
    FOR UPDATE USING (auth.uid() = user_id);

-- Policies for login_history
CREATE POLICY "Users can view their own login history" ON login_history 
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own login history" ON login_history 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to initialize star currency on user creation
CREATE OR REPLACE FUNCTION initialize_star_currency()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO star_currency (user_id) VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create star currency on user creation
DROP TRIGGER IF EXISTS create_star_currency_trigger ON users;
CREATE TRIGGER create_star_currency_trigger
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION initialize_star_currency();

-- Function to handle daily login and streak
CREATE OR REPLACE FUNCTION handle_daily_login(p_user_id UUID)
RETURNS TABLE(
    total_stars INTEGER,
    login_streak INTEGER,
    stars_earned_today INTEGER,
    streak_bonus_earned BOOLEAN,
    streak_milestone_reached INTEGER
) AS $$
DECLARE
    v_last_login_date DATE;
    v_current_streak INTEGER;
    v_base_stars INTEGER := 10;
    v_streak_bonus_stars INTEGER := 0;
    v_total_earned INTEGER := 0;
    v_streak_milestone INTEGER := 0;
    v_today DATE := CURRENT_DATE;
BEGIN
    -- Get current streak info
    SELECT login_streak, last_login_date INTO v_current_streak, v_last_login_date
    FROM star_currency
    WHERE user_id = p_user_id;

    -- Check if already logged in today
    IF EXISTS (
        SELECT 1 FROM login_history 
        WHERE user_id = p_user_id AND login_date = v_today
    ) THEN
        -- Already logged in today, just return current stats
        SELECT total_stars, login_streak, earned_today, 0, 0
        INTO total_stars, login_streak, stars_earned_today, streak_bonus_earned, streak_milestone_reached
        FROM star_currency
        WHERE user_id = p_user_id;
        RETURN NEXT;
        RETURN;
    END IF;

    -- Calculate streak
    IF v_last_login_date IS NULL THEN
        -- First login
        v_current_streak := 1;
    ELSIF v_last_login_date = v_today - INTERVAL '1 day' THEN
        -- Consecutive day login
        v_current_streak := v_current_streak + 1;
    ELSIF v_last_login_date < v_today - INTERVAL '1 day' THEN
        -- Streak broken, reset
        v_current_streak := 1;
    ELSE
        -- Same day login, don't increment
        v_current_streak := v_current_streak;
    END IF;

    -- Calculate streak bonus
    IF v_current_streak >= 14 THEN
        v_streak_bonus_stars := 50;
        v_streak_milestone := 14;
    ELSIF v_current_streak >= 7 THEN
        v_streak_bonus_stars := 25;
        v_streak_milestone := 7;
    ELSIF v_current_streak >= 3 THEN
        v_streak_bonus_stars := 10;
        v_streak_milestone := 3;
    END IF;

    v_total_earned := v_base_stars + v_streak_bonus_stars;

    -- Update star_currency
    UPDATE star_currency
    SET 
        total_stars = total_stars + v_total_earned,
        earned_today = v_total_earned,
        last_login_date = v_today,
        login_streak = v_current_streak,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    -- Record login history
    INSERT INTO login_history (user_id, login_date, stars_earned, streak_bonus_stars)
    VALUES (p_user_id, v_today, v_base_stars, v_streak_bonus_stars);

    -- Return results
    SELECT 
        total_stars,
        login_streak,
        v_total_earned,
        (v_streak_bonus_stars > 0),
        v_streak_milestone
    INTO 
        total_stars,
        login_streak,
        stars_earned_today,
        streak_bonus_earned,
        streak_milestone_reached
    FROM star_currency
    WHERE user_id = p_user_id;

    RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION handle_daily_login(UUID) TO authenticated;


---------------------------------------------------------------------


-- Create messages table for instructor-learner communication
CREATE TABLE messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create conversations table to group messages
CREATE TABLE conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    participant_1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    participant_2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    last_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    last_message_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(participant_1_id, participant_2_id),
    CHECK (participant_1_id < participant_2_id)
);

-- Create indexes for faster queries
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX idx_messages_conversation ON messages(sender_id, recipient_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_is_read ON messages(is_read);
CREATE INDEX idx_conversations_participant_1 ON conversations(participant_1_id);
CREATE INDEX idx_conversations_participant_2 ON conversations(participant_2_id);
CREATE INDEX idx_conversations_last_message_at ON conversations(last_message_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Policies for messages
CREATE POLICY "Users can view messages they sent or received" ON messages
    FOR SELECT USING (
        auth.uid() = sender_id OR auth.uid() = recipient_id
    );

CREATE POLICY "Users can insert their own messages" ON messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their own messages" ON messages
    FOR UPDATE USING (auth.uid() = sender_id);

CREATE POLICY "Users can delete their own messages" ON messages
    FOR DELETE USING (auth.uid() = sender_id);

-- Policies for conversations
CREATE POLICY "Users can view conversations they are part of" ON conversations
    FOR SELECT USING (
        auth.uid() = participant_1_id OR auth.uid() = participant_2_id
    );

CREATE POLICY "Users can create conversations" ON conversations
    FOR INSERT WITH CHECK (
        auth.uid() = participant_1_id OR auth.uid() = participant_2_id
    );

-- Function to create or get conversation
CREATE OR REPLACE FUNCTION get_or_create_conversation(
    p_user_1_id UUID,
    p_user_2_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_conversation_id UUID;
    v_participant_1 UUID;
    v_participant_2 UUID;
BEGIN
    -- Ensure consistent ordering
    IF p_user_1_id < p_user_2_id THEN
        v_participant_1 := p_user_1_id;
        v_participant_2 := p_user_2_id;
    ELSE
        v_participant_1 := p_user_2_id;
        v_participant_2 := p_user_1_id;
    END IF;

    -- Try to get existing conversation
    SELECT id INTO v_conversation_id FROM conversations
    WHERE participant_1_id = v_participant_1 AND participant_2_id = v_participant_2;

    -- If not found, create new one
    IF v_conversation_id IS NULL THEN
        INSERT INTO conversations (participant_1_id, participant_2_id)
        VALUES (v_participant_1, v_participant_2)
        RETURNING id INTO v_conversation_id;
    END IF;

    RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update conversation on new message
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
DECLARE
    v_conversation_id UUID;
BEGIN
    -- Get or create conversation
    v_conversation_id := get_or_create_conversation(NEW.sender_id, NEW.recipient_id);

    -- Update conversation's last message
    UPDATE conversations
    SET last_message_id = NEW.id, last_message_at = NEW.created_at
    WHERE id = v_conversation_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update conversation on new message
CREATE TRIGGER update_conversation_on_new_message
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_on_message();

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_as_read(
    p_conversation_id UUID,
    p_user_id UUID
)
RETURNS VOID AS $$
BEGIN
    UPDATE messages
    SET is_read = true, read_at = NOW()
    WHERE (
        (sender_id != p_user_id AND recipient_id = p_user_id) OR
        (sender_id = p_user_id AND recipient_id != p_user_id)
    )
    AND is_read = false
    AND (sender_id, recipient_id) IN (
        SELECT 
            CASE WHEN participant_1_id = p_user_id THEN participant_2_id ELSE participant_1_id END,
            CASE WHEN participant_1_id = p_user_id THEN participant_1_id ELSE participant_2_id END
        FROM conversations
        WHERE id = p_conversation_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_or_create_conversation(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_messages_as_read(UUID, UUID) TO authenticated;

CREATE OR REPLACE VIEW conversations_with_messages AS
SELECT 
    c.id,
    c.participant_1_id,
    c.participant_2_id,
    c.last_message_id,
    c.last_message_at,
    c.created_at,
    c.updated_at,
    m.id as message_id,
    m.content as message_content,
    m.sender_id as message_sender_id,
    m.created_at as message_created_at
FROM conversations c
LEFT JOIN messages m ON c.last_message_id = m.id;

CREATE TABLE public.course_feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course_id uuid NOT NULL,
  enrollment_id uuid NOT NULL,
  course_quality integer CHECK (course_quality >= 1 AND course_quality <= 5),
  instructor_quality integer CHECK (instructor_quality >= 1 AND instructor_quality <= 5),
  content_clarity integer CHECK (content_clarity >= 1 AND content_clarity <= 5),
  course_difficulty integer CHECK (course_difficulty >= 1 AND course_difficulty <= 5),
  would_recommend boolean,
  comments text,
  submitted_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT course_feedback_pkey PRIMARY KEY (id),
  CONSTRAINT course_feedback_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT course_feedback_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE,
  CONSTRAINT course_feedback_enrollment_id_fkey FOREIGN KEY (enrollment_id) REFERENCES public.enrollments(id) ON DELETE CASCADE,
  CONSTRAINT course_feedback_unique UNIQUE(user_id, course_id)
);

-- Create index for faster queries
CREATE INDEX idx_course_feedback_course_id ON course_feedback(course_id);
CREATE INDEX idx_course_feedback_user_id ON course_feedback(user_id);

-- Enable RLS
ALTER TABLE course_feedback ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own feedback" ON course_feedback
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own feedback" ON course_feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feedback" ON course_feedback
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Instructors can view feedback for their courses" ON course_feedback
  FOR SELECT USING (
    course_id IN (
      SELECT id FROM courses WHERE instructor_id = auth.uid()
    )
  );

----------------------------------------------------------------

-- Stripe Products Table
CREATE TABLE public.stripe_products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  amount integer NOT NULL,
  currency text DEFAULT 'usd'::text,
  coins integer NOT NULL,
  stripe_product_id text UNIQUE NOT NULL,
  stripe_price_id text UNIQUE NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT stripe_products_pkey PRIMARY KEY (id)
);

-- User Wallets Table
CREATE TABLE public.user_wallets (
  user_id uuid NOT NULL UNIQUE,
  total_coins integer DEFAULT 0,
  spent_coins integer DEFAULT 0,
  available_coins integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_wallets_pkey PRIMARY KEY (user_id),
  CONSTRAINT user_wallets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Coin Transactions Table
CREATE TABLE public.coin_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount integer NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['purchase'::text, 'spend'::text, 'refund'::text, 'bonus'::text])),
  description text NOT NULL,
  reference_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT coin_transactions_pkey PRIMARY KEY (id),
  CONSTRAINT coin_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Stripe Payments Table
CREATE TABLE public.stripe_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  stripe_session_id text UNIQUE NOT NULL,
  stripe_payment_intent_id text UNIQUE,
  product_id uuid NOT NULL,
  amount integer NOT NULL,
  currency text DEFAULT 'usd'::text,
  coins integer NOT NULL,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'completed'::text, 'failed'::text, 'refunded'::text])),
  payment_method text,
  created_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  CONSTRAINT stripe_payments_pkey PRIMARY KEY (id),
  CONSTRAINT stripe_payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT stripe_payments_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.stripe_products(id)
);

-- Stripe Customers Table
CREATE TABLE public.stripe_customers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  stripe_customer_id text UNIQUE NOT NULL,
  email text NOT NULL,
  name text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT stripe_customers_pkey PRIMARY KEY (id),
  CONSTRAINT stripe_customers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

CREATE INDEX idx_stripe_customers_user_id ON public.stripe_customers(user_id);
CREATE INDEX idx_stripe_customers_stripe_customer_id ON public.stripe_customers(stripe_customer_id);

-- Update courses table to support premium
ALTER TABLE public.courses ADD COLUMN premium_price integer DEFAULT 0;
ALTER TABLE public.courses ADD COLUMN premium_coin_cost integer DEFAULT 0;

-- Update enrollments to track premium access
ALTER TABLE public.enrollments ADD COLUMN premium_access boolean DEFAULT false;
ALTER TABLE public.enrollments ADD COLUMN premium_access_until timestamp with time zone;

-- Create indexes for better query performance
CREATE INDEX idx_user_wallets_user_id ON public.user_wallets(user_id);
CREATE INDEX idx_coin_transactions_user_id ON public.coin_transactions(user_id);
CREATE INDEX idx_coin_transactions_created_at ON public.coin_transactions(created_at);
CREATE INDEX idx_stripe_payments_user_id ON public.stripe_payments(user_id);
CREATE INDEX idx_stripe_payments_status ON public.stripe_payments(status);
CREATE INDEX idx_stripe_products_active ON public.stripe_products(is_active);

-- Premium Subscription Plan
CREATE TABLE public.premium_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price integer NOT NULL,
  currency text DEFAULT 'usd'::text,
  billing_period text NOT NULL CHECK (billing_period IN ('monthly', 'yearly')),
  stripe_price_id text UNIQUE NOT NULL,
  stripe_product_id text UNIQUE NOT NULL,
  features jsonb NOT NULL, -- { avatar_borders: boolean, custom_themes: boolean, etc }
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT premium_plans_pkey PRIMARY KEY (id)
);

-- User Premium Subscriptions
CREATE TABLE public.user_premium_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  premium_plan_id uuid NOT NULL,
  stripe_subscription_id text UNIQUE NOT NULL,
  stripe_customer_id text NOT NULL,
  status text NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'expired')),
  current_period_start timestamp with time zone NOT NULL,
  current_period_end timestamp with time zone NOT NULL,
  canceled_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_premium_subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT user_premium_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT user_premium_subscriptions_premium_plan_id_fkey FOREIGN KEY (premium_plan_id) REFERENCES public.premium_plans(id) ON DELETE RESTRICT
);

-- Create indexes
CREATE INDEX idx_premium_plans_active ON public.premium_plans(is_active);
CREATE INDEX idx_user_premium_subscriptions_user_id ON public.user_premium_subscriptions(user_id);
CREATE INDEX idx_user_premium_subscriptions_status ON public.user_premium_subscriptions(status);
CREATE INDEX idx_user_premium_subscriptions_current_period_end ON public.user_premium_subscriptions(current_period_end);

-- Enable RLS
ALTER TABLE public.premium_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_premium_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies for premium_plans (public read)
CREATE POLICY "Anyone can view active premium plans" ON public.premium_plans
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage premium plans" ON public.premium_plans
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Policies for user_premium_subscriptions
CREATE POLICY "Users can view their own premium subscription" ON public.user_premium_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own premium subscription" ON public.user_premium_subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

-- Function to check if user has premium
CREATE OR REPLACE FUNCTION user_has_premium(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_premium_subscriptions
        WHERE user_id = p_user_id 
        AND status = 'active'
        AND current_period_end > NOW()
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get user premium features
CREATE OR REPLACE FUNCTION get_user_premium_features(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_features JSONB;
BEGIN
    SELECT pp.features INTO v_features
    FROM public.user_premium_subscriptions ups
    JOIN public.premium_plans pp ON ups.premium_plan_id = pp.id
    WHERE ups.user_id = p_user_id 
    AND ups.status = 'active'
    AND ups.current_period_end > NOW()
    LIMIT 1;
    
    RETURN COALESCE(v_features, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION user_has_premium(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_premium_features(UUID) TO authenticated;

CREATE TABLE public.stripe_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id text NOT NULL UNIQUE,
  user_id uuid NOT NULL,
  plan_id uuid NOT NULL,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'completed'::text, 'failed'::text])),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT stripe_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT stripe_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT stripe_sessions_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.premium_plans(id)
);