-- Drop old tables (keeping profiles and user_roles)
DROP TABLE IF EXISTS test_results CASCADE;
DROP TABLE IF EXISTS tests CASCADE;
DROP TABLE IF EXISTS course_enrollments CASCADE;
DROP TABLE IF EXISTS special_courses CASCADE;
DROP TABLE IF EXISTS schedules CASCADE;
DROP TABLE IF EXISTS classes CASCADE;

-- News categories
CREATE TABLE public.news_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- News articles
CREATE TABLE public.news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  category_id UUID REFERENCES public.news_categories(id) ON DELETE SET NULL,
  image_url TEXT,
  target_role app_role, -- null means for everyone
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User preferences for news categories
CREATE TABLE public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.news_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, category_id)
);

-- Event templates
CREATE TABLE public.event_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  required_participants INTEGER,
  required_channel_subscribers INTEGER,
  reward_description TEXT,
  icon TEXT,
  color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Events based on templates
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES public.event_templates(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  current_participants INTEGER DEFAULT 0,
  max_participants INTEGER,
  channel_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Event participants
CREATE TABLE public.event_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Admin users (separate from regular auth)
CREATE TABLE public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Knowledge base for RAG
CREATE TABLE public.knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  tags TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Chat history for context
CREATE TABLE public.chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  response TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.news_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for news_categories
CREATE POLICY "Everyone can view categories"
  ON public.news_categories FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage categories"
  ON public.news_categories FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for news
CREATE POLICY "Everyone can view published news"
  ON public.news FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins can manage news"
  ON public.news FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for user_preferences
CREATE POLICY "Users can view own preferences"
  ON public.user_preferences FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own preferences"
  ON public.user_preferences FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own preferences"
  ON public.user_preferences FOR DELETE
  USING (user_id = auth.uid());

-- RLS Policies for event_templates
CREATE POLICY "Everyone can view templates"
  ON public.event_templates FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage templates"
  ON public.event_templates FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for events
CREATE POLICY "Everyone can view active events"
  ON public.events FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage events"
  ON public.events FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for event_participants
CREATE POLICY "Users can view event participants"
  ON public.event_participants FOR SELECT
  USING (true);

CREATE POLICY "Users can join events"
  ON public.event_participants FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can leave events"
  ON public.event_participants FOR DELETE
  USING (user_id = auth.uid());

-- RLS Policies for admin_users (no public access)
CREATE POLICY "No public access to admin_users"
  ON public.admin_users FOR SELECT
  USING (false);

-- RLS Policies for knowledge_base
CREATE POLICY "Admins can manage knowledge base"
  ON public.knowledge_base FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Active knowledge is viewable by all"
  ON public.knowledge_base FOR SELECT
  USING (is_active = true);

-- RLS Policies for chat_history
CREATE POLICY "Users can view own chat history"
  ON public.chat_history FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Chat history can be inserted"
  ON public.chat_history FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Triggers for updated_at
CREATE TRIGGER update_news_updated_at
  BEFORE UPDATE ON public.news
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_knowledge_base_updated_at
  BEFORE UPDATE ON public.knowledge_base
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add registration_completed flag to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS registration_completed BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS selected_role app_role;