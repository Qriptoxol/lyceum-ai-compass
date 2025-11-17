import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, BookOpen, Trash2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export const CourseManager = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    schedule_info: '',
    max_students: '',
    start_date: '',
    end_date: '',
    is_published: false
  });
  const { user } = useAuth();
  const { toast } = useToast();

  const loadCourses = async () => {
    const { data, error } = await supabase
      .from('special_courses')
      .select('*, course_enrollments(count)')
      .eq('teacher_id', user?.id)
      .order('created_at', { ascending: false });

    if (!error && data) setCourses(data);
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const handleCreate = async () => {
    if (!formData.title) {
      toast({ title: 'Укажите название курса', variant: 'destructive' });
      return;
    }

    const { error } = await supabase.from('special_courses').insert({
      ...formData,
      max_students: formData.max_students ? parseInt(formData.max_students) : null,
      teacher_id: user?.id
    });

    if (error) {
      toast({ title: 'Ошибка создания курса', variant: 'destructive' });
    } else {
      toast({ title: 'Курс создан' });
      setOpen(false);
      setFormData({ title: '', description: '', schedule_info: '', max_students: '', start_date: '', end_date: '', is_published: false });
      loadCourses();
    }
  };

  const togglePublish = async (id: string, currentState: boolean) => {
    const { error } = await supabase.from('special_courses').update({ is_published: !currentState }).eq('id', id);
    if (!error) {
      toast({ title: currentState ? 'Курс скрыт' : 'Курс опубликован' });
      loadCourses();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('special_courses').delete().eq('id', id);
    if (!error) {
      toast({ title: 'Курс удален' });
      loadCourses();
    }
  };

  return (
    <Card className="bg-gradient-card border-border/50">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          Спецкурсы
        </CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-gradient-primary">
              <Plus className="w-4 h-4 mr-2" />
              Создать
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Создать спецкурс</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Название</Label>
                <Input value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="Программирование на Python" />
              </div>
              <div>
                <Label>Описание</Label>
                <Textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Углубленное изучение Python..." rows={4} />
              </div>
              <div>
                <Label>Расписание занятий</Label>
                <Input value={formData.schedule_info} onChange={(e) => setFormData({...formData, schedule_info: e.target.value})} placeholder="Понедельник 15:00, Среда 15:00" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Дата начала</Label>
                  <Input type="date" value={formData.start_date} onChange={(e) => setFormData({...formData, start_date: e.target.value})} />
                </div>
                <div>
                  <Label>Дата окончания</Label>
                  <Input type="date" value={formData.end_date} onChange={(e) => setFormData({...formData, end_date: e.target.value})} />
                </div>
              </div>
              <div>
                <Label>Максимум студентов</Label>
                <Input type="number" value={formData.max_students} onChange={(e) => setFormData({...formData, max_students: e.target.value})} placeholder="20" />
              </div>
              <div className="flex items-center justify-between">
                <Label>Опубликовать сразу</Label>
                <Switch checked={formData.is_published} onCheckedChange={(checked) => setFormData({...formData, is_published: checked})} />
              </div>
              <Button onClick={handleCreate} className="w-full bg-gradient-primary">
                Создать спецкурс
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {courses.map((course) => (
            <div key={course.id} className="p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground mb-1">{course.title}</h4>
                  {course.description && (
                    <p className="text-sm text-muted-foreground mb-2">{course.description}</p>
                  )}
                  <div className="text-sm text-muted-foreground">
                    Записано: {course.course_enrollments?.[0]?.count || 0}
                    {course.max_students && ` / ${course.max_students}`}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => togglePublish(course.id, course.is_published)}>
                    {course.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(course.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {courses.length === 0 && (
            <p className="text-center text-muted-foreground py-8">У вас пока нет спецкурсов</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
