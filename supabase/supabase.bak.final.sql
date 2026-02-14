-- Table order and constraints may not be valid for execution.

CREATE TABLE public.badges (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon text,
  xp_reward integer DEFAULT 0,
  category text,
  created_at timestamp with time zone DEFAULT now(),
  instructor_id uuid,
  level_required integer DEFAULT 0,
  CONSTRAINT badges_pkey PRIMARY KEY (id),
  CONSTRAINT badges_instructor_id_fkey FOREIGN KEY (instructor_id) REFERENCES public.users(id)
);
CREATE TABLE public.conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  participant_1_id uuid NOT NULL,
  participant_2_id uuid NOT NULL,
  last_message_id uuid,
  last_message_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT conversations_pkey PRIMARY KEY (id),
  CONSTRAINT conversations_participant_1_id_fkey FOREIGN KEY (participant_1_id) REFERENCES public.users(id),
  CONSTRAINT conversations_participant_2_id_fkey FOREIGN KEY (participant_2_id) REFERENCES public.users(id),
  CONSTRAINT conversations_last_message_id_fkey FOREIGN KEY (last_message_id) REFERENCES public.messages(id)
);
CREATE TABLE public.countries_levels (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  country_name text NOT NULL UNIQUE,
  min_level integer NOT NULL,
  max_level integer NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  base_country text,
  CONSTRAINT countries_levels_pkey PRIMARY KEY (id)
);
CREATE TABLE public.courses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text,
  image_url text,
  levels integer DEFAULT 10,
  max_xp integer DEFAULT 5000,
  leaderboard_enabled boolean DEFAULT true,
  badges_enabled boolean DEFAULT true,
  quests_enabled boolean DEFAULT true,
  premium_enabled boolean DEFAULT false,
  status text DEFAULT 'draft'::text CHECK (status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text])),
  instructor_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  latitude double precision,
  longitude double precision,
  country_id uuid,
  city_name text,
  CONSTRAINT courses_pkey PRIMARY KEY (id),
  CONSTRAINT courses_instructor_id_fkey FOREIGN KEY (instructor_id) REFERENCES public.users(id),
  CONSTRAINT courses_country_id_fkey FOREIGN KEY (country_id) REFERENCES public.countries_levels(id)
);
CREATE TABLE public.elearning_content (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL,
  topic text NOT NULL,
  title text NOT NULL,
  content jsonb NOT NULL,
  ai_generated boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT elearning_content_pkey PRIMARY KEY (id),
  CONSTRAINT elearning_content_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id)
);
CREATE TABLE public.elearning_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  elearning_content_id uuid NOT NULL,
  completed_sections jsonb DEFAULT '[]'::jsonb,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT elearning_progress_pkey PRIMARY KEY (id),
  CONSTRAINT elearning_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT elearning_progress_elearning_content_id_fkey FOREIGN KEY (elearning_content_id) REFERENCES public.elearning_content(id)
);
CREATE TABLE public.enrollments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course_id uuid NOT NULL,
  enrolled_at timestamp with time zone DEFAULT now(),
  progress_percentage integer DEFAULT 0,
  completed_at timestamp with time zone,
  CONSTRAINT enrollments_pkey PRIMARY KEY (id),
  CONSTRAINT enrollments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT enrollments_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id)
);
CREATE TABLE public.login_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  login_date date NOT NULL,
  stars_earned integer DEFAULT 0,
  streak_bonus_stars integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT login_history_pkey PRIMARY KEY (id),
  CONSTRAINT login_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  recipient_id uuid NOT NULL,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  read_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id),
  CONSTRAINT messages_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.users(id)
);
CREATE TABLE public.resource_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  resource_content_id uuid NOT NULL,
  started_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  time_taken integer,
  score integer DEFAULT 0,
  max_score integer DEFAULT 0,
  answers jsonb,
  status text DEFAULT 'in_progress'::text CHECK (status = ANY (ARRAY['in_progress'::text, 'completed'::text, 'timed_out'::text])),
  xp_earned integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT resource_attempts_pkey PRIMARY KEY (id),
  CONSTRAINT resource_attempts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT resource_attempts_resource_content_id_fkey FOREIGN KEY (resource_content_id) REFERENCES public.resource_content(id)
);
CREATE TABLE public.resource_content (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['quiz'::text, 'challenge'::text])),
  title text NOT NULL,
  description text,
  topic text,
  difficulty text NOT NULL CHECK (difficulty = ANY (ARRAY['beginner'::text, 'intermediate'::text, 'advanced'::text])),
  question_count integer DEFAULT 5,
  content jsonb,
  status text DEFAULT 'draft'::text CHECK (status = ANY (ARRAY['draft'::text, 'published'::text])),
  ai_prompt text,
  generated_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  quests jsonb,
  time_limit integer DEFAULT 10,
  topic_index integer,
  programming_language text,
  code_template text,
  test_cases text,
  max_attempts integer DEFAULT 3,
  CONSTRAINT resource_content_pkey PRIMARY KEY (id),
  CONSTRAINT resource_content_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id)
);
CREATE TABLE public.star_currency (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  total_stars integer DEFAULT 0,
  earned_today integer DEFAULT 0,
  last_login_date date,
  login_streak integer DEFAULT 0,
  last_streak_reset_date date,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT star_currency_pkey PRIMARY KEY (id),
  CONSTRAINT star_currency_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.user_badges (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  badge_id uuid NOT NULL,
  earned_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_badges_pkey PRIMARY KEY (id),
  CONSTRAINT user_badges_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT user_badges_badge_id_fkey FOREIGN KEY (badge_id) REFERENCES public.badges(id)
);
CREATE TABLE public.user_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_token text NOT NULL UNIQUE,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.user_stats (
  user_id uuid NOT NULL,
  total_xp integer DEFAULT 0,
  current_level integer DEFAULT 1,
  badges_count integer DEFAULT 0,
  leaderboard_rank integer,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_stats_pkey PRIMARY KEY (user_id),
  CONSTRAINT user_stats_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL,
  email character varying NOT NULL UNIQUE,
  name character varying,
  username character varying NOT NULL UNIQUE,
  role character varying NOT NULL DEFAULT 'learner'::character varying CHECK (role::text = ANY (ARRAY['instructor'::character varying, 'learner'::character varying, 'admin'::character varying]::text[])),
  is_verified boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  avatar_border character varying DEFAULT NULL::character varying,
  bio text,
  avatar_url character varying DEFAULT NULL::character varying,
  full_name character varying,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);