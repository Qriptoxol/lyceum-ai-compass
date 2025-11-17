import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Users, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export const ClassManager = () => {
  const [classes, setClasses] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [grade, setGrade] = useState('');
  const [name, setName] = useState('');
  const [profileType, setProfileType] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();

  const loadClasses = async () => {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .eq('teacher_id', user?.id)
      .order('grade', { ascending: true });

    if (!error && data) {
      setClasses(data);
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  const handleCreate = async () => {
    if (!grade || !name) {
      toast({ title: 'Заполните все поля', variant: 'destructive' });
      return;
    }

    const { error } = await supabase.from('classes').insert({
      grade: parseInt(grade),
      name,
      profile_type: profileType || null,
      teacher_id: user?.id
    });

    if (error) {
      toast({ title: 'Ошибка создания класса', variant: 'destructive' });
    } else {
      toast({ title: 'Класс создан' });
      setOpen(false);
      setGrade('');
      setName('');
      setProfileType('');
      loadClasses();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('classes').delete().eq('id', id);
    if (!error) {
      toast({ title: 'Класс удален' });
      loadClasses();
    }
  };

  return (
    <Card className="bg-gradient-card border-border/50">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Мои классы
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
              <DialogTitle>Создать класс</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Параллель</Label>
                <Input
                  type="number"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  placeholder="10"
                />
              </div>
              <div>
                <Label>Буква класса</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="А"
                />
              </div>
              <div>
                <Label>Профиль (опционально)</Label>
                <Input
                  value={profileType}
                  onChange={(e) => setProfileType(e.target.value)}
                  placeholder="Физико-математический"
                />
              </div>
              <Button onClick={handleCreate} className="w-full bg-gradient-primary">
                Создать класс
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {classes.map((cls) => (
            <div
              key={cls.id}
              className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
            >
              <div>
                <div className="font-semibold text-foreground">
                  {cls.grade}{cls.name}
                </div>
                {cls.profile_type && (
                  <div className="text-sm text-muted-foreground">{cls.profile_type}</div>
                )}
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDelete(cls.id)}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          ))}
          {classes.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              У вас пока нет классов
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
