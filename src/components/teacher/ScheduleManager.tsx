import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Calendar, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const DAYS = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];

export const ScheduleManager = () => {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    class_id: '',
    day_of_week: '1',
    time_start: '',
    time_end: '',
    subject: '',
    room: ''
  });
  const { user } = useAuth();
  const { toast } = useToast();

  const loadData = async () => {
    const [schedulesRes, classesRes] = await Promise.all([
      supabase.from('schedules').select('*, classes(grade, name)').eq('teacher_id', user?.id).order('day_of_week').order('time_start'),
      supabase.from('classes').select('*').eq('teacher_id', user?.id)
    ]);

    if (!schedulesRes.error && schedulesRes.data) setSchedules(schedulesRes.data);
    if (!classesRes.error && classesRes.data) setClasses(classesRes.data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async () => {
    if (!formData.class_id || !formData.subject || !formData.time_start || !formData.time_end) {
      toast({ title: 'Заполните все обязательные поля', variant: 'destructive' });
      return;
    }

    const { error } = await supabase.from('schedules').insert({
      ...formData,
      day_of_week: parseInt(formData.day_of_week),
      teacher_id: user?.id
    });

    if (error) {
      toast({ title: 'Ошибка создания расписания', variant: 'destructive' });
    } else {
      toast({ title: 'Урок добавлен в расписание' });
      setOpen(false);
      setFormData({ class_id: '', day_of_week: '1', time_start: '', time_end: '', subject: '', room: '' });
      loadData();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('schedules').delete().eq('id', id);
    if (!error) {
      toast({ title: 'Урок удален' });
      loadData();
    }
  };

  const groupedSchedules = schedules.reduce((acc, schedule) => {
    const day = schedule.day_of_week;
    if (!acc[day]) acc[day] = [];
    acc[day].push(schedule);
    return acc;
  }, {} as Record<number, any[]>);

  return (
    <Card className="bg-gradient-card border-border/50">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Расписание уроков
        </CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-gradient-primary">
              <Plus className="w-4 h-4 mr-2" />
              Добавить
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Добавить урок</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Класс</Label>
                <Select value={formData.class_id} onValueChange={(v) => setFormData({...formData, class_id: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите класс" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.grade}{cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>День недели</Label>
                <Select value={formData.day_of_week} onValueChange={(v) => setFormData({...formData, day_of_week: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS.map((day, idx) => (
                      <SelectItem key={idx} value={String(idx + 1)}>{day}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Время начала</Label>
                  <Input type="time" value={formData.time_start} onChange={(e) => setFormData({...formData, time_start: e.target.value})} />
                </div>
                <div>
                  <Label>Время окончания</Label>
                  <Input type="time" value={formData.time_end} onChange={(e) => setFormData({...formData, time_end: e.target.value})} />
                </div>
              </div>
              <div>
                <Label>Предмет</Label>
                <Input value={formData.subject} onChange={(e) => setFormData({...formData, subject: e.target.value})} placeholder="Математика" />
              </div>
              <div>
                <Label>Кабинет</Label>
                <Input value={formData.room} onChange={(e) => setFormData({...formData, room: e.target.value})} placeholder="205" />
              </div>
              <Button onClick={handleCreate} className="w-full bg-gradient-primary">
                Добавить урок
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(groupedSchedules).map(([day, lessons]: [string, any[]]) => (
            <div key={day}>
              <h3 className="font-semibold text-foreground mb-2">{DAYS[parseInt(day) - 1]}</h3>
              <div className="space-y-2">
                {lessons.map((lesson) => (
                  <div key={lesson.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                    <div className="flex-1">
                      <div className="font-medium text-foreground">
                        {lesson.time_start.slice(0, 5)} - {lesson.time_end.slice(0, 5)} | {lesson.subject}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {lesson.classes?.grade}{lesson.classes?.name} {lesson.room && `• Каб. ${lesson.room}`}
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(lesson.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {schedules.length === 0 && (
            <p className="text-center text-muted-foreground py-8">Расписание пока не добавлено</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
