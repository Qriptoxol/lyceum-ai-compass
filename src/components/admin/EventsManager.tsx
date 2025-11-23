import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";

export const EventsManager = () => {
  const { toast } = useToast();
  const [events, setEvents] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);

  useEffect(() => {
    loadEvents();
    loadTemplates();
  }, []);

  const loadEvents = async () => {
    const { data } = await supabase.from('events').select('*, event_templates(*)').order('created_at', { ascending: false });
    setEvents(data || []);
  };

  const loadTemplates = async () => {
    const { data } = await supabase.from('event_templates').select('*');
    setTemplates(data || []);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    const eventData = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      template_id: (formData.get('template_id') as string) || null,
      start_date: (formData.get('start_date') as string) || null,
      end_date: (formData.get('end_date') as string) || null,
      max_participants: parseInt(formData.get('max_participants') as string) || null,
      channel_url: (formData.get('channel_url') as string) || null,
      is_active: editing?.is_active || true,
    };

    if (editing?.id) {
      await supabase.from('events').update(eventData).eq('id', editing.id);
    } else {
      await supabase.from('events').insert(eventData);
    }

    toast({ title: "Сохранено!" });
    setEditing(null);
    loadEvents();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from('events').update({ is_active: !current }).eq('id', id);
    loadEvents();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Удалить мероприятие?')) {
      await supabase.from('events').delete().eq('id', id);
      loadEvents();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Управление мероприятиями</h2>
        <Button onClick={() => setEditing({})}>
          <Plus className="w-4 h-4 mr-2" />
          Добавить мероприятие
        </Button>
      </div>

      {editing && (
        <Card>
          <CardHeader>
            <CardTitle>{editing.id ? 'Редактировать' : 'Новое'} мероприятие</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <Label htmlFor="title">Название</Label>
                <Input id="title" name="title" defaultValue={editing.title} required />
              </div>
              <div>
                <Label htmlFor="description">Описание</Label>
                <Textarea id="description" name="description" defaultValue={editing.description} rows={4} />
              </div>
              <div>
                <Label htmlFor="template_id">Шаблон</Label>
                <Select name="template_id" defaultValue={editing.template_id}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите шаблон" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map(tpl => (
                      <SelectItem key={tpl.id} value={tpl.id}>{tpl.icon} {tpl.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Начало</Label>
                  <Input id="start_date" name="start_date" type="datetime-local" defaultValue={editing.start_date?.slice(0, 16)} />
                </div>
                <div>
                  <Label htmlFor="end_date">Конец</Label>
                  <Input id="end_date" name="end_date" type="datetime-local" defaultValue={editing.end_date?.slice(0, 16)} />
                </div>
              </div>
              <div>
                <Label htmlFor="max_participants">Макс. участников</Label>
                <Input id="max_participants" name="max_participants" type="number" defaultValue={editing.max_participants} />
              </div>
              <div>
                <Label htmlFor="channel_url">Ссылка на канал</Label>
                <Input id="channel_url" name="channel_url" defaultValue={editing.channel_url} />
              </div>
              <div className="flex gap-2">
                <Button type="submit">Сохранить</Button>
                <Button type="button" variant="outline" onClick={() => setEditing(null)}>Отмена</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {events.map(item => (
          <Card key={item.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex-1">
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.event_templates?.name}</p>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={item.is_active} onCheckedChange={() => toggleActive(item.id, item.is_active)} />
                <Button size="icon" variant="ghost" onClick={() => setEditing(item)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => handleDelete(item.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};