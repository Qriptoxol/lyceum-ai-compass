-- Create app_role enum type
CREATE TYPE public.app_role AS ENUM ('admin', 'teacher', 'student', 'parent');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  telegram_id BIGINT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create classes table
CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  grade INTEGER NOT NULL CHECK (grade >= 1 AND grade <= 11),
  profile_type TEXT,
  teacher_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- Create schedules table
CREATE TABLE public.schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 1 AND day_of_week <= 7),
  time_start TIME NOT NULL,
  time_end TIME NOT NULL,
  subject TEXT NOT NULL,
  teacher_id UUID REFERENCES public.profiles(id),
  room TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

-- Create special_courses table
CREATE TABLE public.special_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  teacher_id UUID REFERENCES public.profiles(id) NOT NULL,
  max_students INTEGER,
  start_date DATE,
  end_date DATE,
  schedule_info TEXT,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.special_courses ENABLE ROW LEVEL SECURITY;

-- Create course_enrollments table
CREATE TABLE public.course_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.special_courses(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE (course_id, student_id)
);

ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;

-- Create tests table
CREATE TABLE public.tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  target_grade INTEGER NOT NULL CHECK (target_grade IN (7, 10)),
  profile_type TEXT NOT NULL,
  questions JSONB NOT NULL,
  passing_score INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;

-- Create test_results table
CREATE TABLE public.test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID REFERENCES public.tests(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  answers JSONB NOT NULL,
  score INTEGER NOT NULL,
  passed BOOLEAN NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE (test_id, student_id)
);

ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for classes
CREATE POLICY "Everyone can view classes"
  ON public.classes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and teachers can manage classes"
  ON public.classes FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'teacher')
  );

-- RLS Policies for schedules
CREATE POLICY "Everyone can view schedules"
  ON public.schedules FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and teachers can manage schedules"
  ON public.schedules FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'teacher')
  );

-- RLS Policies for special_courses
CREATE POLICY "Everyone can view published courses"
  ON public.special_courses FOR SELECT
  TO authenticated
  USING (is_published = true OR teacher_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers can manage own courses"
  ON public.special_courses FOR ALL
  TO authenticated
  USING (teacher_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies for course_enrollments
CREATE POLICY "Users can view relevant enrollments"
  ON public.course_enrollments FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid() OR 
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'teacher')
  );

CREATE POLICY "Students can manage own enrollments"
  ON public.course_enrollments FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can delete own enrollments"
  ON public.course_enrollments FOR DELETE
  TO authenticated
  USING (student_id = auth.uid());

-- RLS Policies for tests
CREATE POLICY "Active tests are viewable"
  ON public.tests FOR SELECT
  TO authenticated
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage tests"
  ON public.tests FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for test_results
CREATE POLICY "Users can view relevant test results"
  ON public.test_results FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid() OR 
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'teacher')
  );

CREATE POLICY "Students can submit test results"
  ON public.test_results FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid());

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Add trigger to profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();