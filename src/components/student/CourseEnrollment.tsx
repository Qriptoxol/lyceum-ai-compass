import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export const CourseEnrollment = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const { toast } = useToast();

  const loadData = async () => {
    const [coursesRes, enrollmentsRes] = await Promise.all([
      supabase.from('special_courses').select('*, course_enrollments(count)').eq('is_published', true),
      supabase.from('course_enrollments').select('course_id').eq('student_id', user?.id)
    ]);

    if (coursesRes.data) setCourses(coursesRes.data);
    if (enrollmentsRes.data) {
      setEnrollments(new Set(enrollmentsRes.data.map(e => e.course_id)));
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEnroll = async (courseId: string) => {
    const { error } = await supabase.from('course_enrollments').insert({
      course_id: courseId,
      student_id: user?.id
    });

    if (error) {
      toast({ title: 'Ошибка записи', variant: 'destructive' });
    } else {
      toast({ title: 'Вы записаны на спецкурс' });
      loadData();
    }
  };

  const handleUnenroll = async (courseId: string) => {
    const { error } = await supabase
      .from('course_enrollments')
      .delete()
      .eq('course_id', courseId)
      .eq('student_id', user?.id);

    if (error) {
      toast({ title: 'Ошибка отмены записи', variant: 'destructive' });
    } else {
      toast({ title: 'Запись отменена' });
      loadData();
    }
  };

  return (
    <Card className="bg-gradient-card border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          Доступные спецкурсы
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {courses.map((course) => {
            const isEnrolled = enrollments.has(course.id);
            const enrolledCount = course.course_enrollments?.[0]?.count || 0;
            const isFull = course.max_students && enrolledCount >= course.max_students;

            return (
              <div key={course.id} className="p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground mb-1">{course.title}</h4>
                    {course.description && (
                      <p className="text-sm text-muted-foreground mb-2">{course.description}</p>
                    )}
                    {course.schedule_info && (
                      <p className="text-sm text-muted-foreground mb-1">📅 {course.schedule_info}</p>
                    )}
                    <div className="text-sm text-muted-foreground">
                      Записано: {enrolledCount}
                      {course.max_students && ` / ${course.max_students}`}
                    </div>
                  </div>
                </div>
                {isEnrolled ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUnenroll(course.id)}
                    className="w-full"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Отменить запись
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleEnroll(course.id)}
                    disabled={isFull}
                    className="w-full bg-gradient-primary"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {isFull ? 'Мест нет' : 'Записаться'}
                  </Button>
                )}
              </div>
            );
          })}
          {courses.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              Спецкурсов пока нет
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
