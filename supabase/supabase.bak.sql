ALTER TABLE users ADD COLUMN avatar_border VARCHAR(50) DEFAULT NULL;
ALTER TABLE users ADD COLUMN bio TEXT DEFAULT NULL;
ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500) DEFAULT NULL;

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
    xp_required INTEGER DEFAULT 0,
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