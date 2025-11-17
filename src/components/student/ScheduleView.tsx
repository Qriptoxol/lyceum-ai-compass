import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const DAYS = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];

export const ScheduleView = () => {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [classData, setClassData] = useState<any>(null);
  const { user } = useAuth();

  useEffect(() => {
    const loadSchedule = async () => {
      // In a real app, we'd need to link students to classes
      // For now, we'll show all schedules
      const { data } = await supabase
        .from('schedules')
        .select('*, classes(grade, name)')
        .order('day_of_week')
        .order('time_start');

      if (data) setSchedules(data);
    };

    loadSchedule();
  }, []);

  const groupedSchedules = schedules.reduce((acc, schedule) => {
    const day = schedule.day_of_week;
    if (!acc[day]) acc[day] = [];
    acc[day].push(schedule);
    return acc;
  }, {} as Record<number, any[]>);

  const today = new Date().getDay();
  const todayLessons = groupedSchedules[today] || [];

  return (
    <Card className="bg-gradient-card border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Расписание на сегодня
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {todayLessons.length > 0 ? (
            todayLessons.map((lesson, index) => (
              <div
                key={lesson.id}
                className="flex items-center gap-4 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
              >
                <div className="w-16 h-16 rounded-lg bg-gradient-primary flex items-center justify-center shadow-soft flex-shrink-0">
                  <span className="text-white font-semibold text-sm">
                    {lesson.time_start.slice(0, 5)}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-foreground">{lesson.subject}</div>
                  <div className="text-sm text-muted-foreground">
                    {lesson.room && `Каб. ${lesson.room}`}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Сегодня уроков нет
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
