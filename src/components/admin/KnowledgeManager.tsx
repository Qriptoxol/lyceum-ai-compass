import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";

export const KnowledgeManager = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    const { data } = await supabase.from('knowledge_base').select('*').order('created_at', { ascending: false });
    setItems(data || []);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    const itemData = {
      title: formData.get('title') as string,
      content: formData.get('content') as string,
      category: formData.get('category') as string,
      tags: (formData.get('tags') as string)?.split(',').map(t => t.trim()).filter(Boolean) || [],
      is_active: editing?.is_active ?? true,
    };

    if (editing?.id) {
      await supabase.from('knowledge_base').update(itemData).eq('id', editing.id);
    } else {
      await supabase.from('knowledge_base').insert(itemData);
    }

    toast({ title: "Сохранено!" });
    setEditing(null);
    loadItems();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from('knowledge_base').update({ is_active: !current }).eq('id', id);
    loadItems();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Удалить запись?')) {
      await supabase.from('knowledge_base').delete().eq('id', id);
      loadItems();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">База знаний для RAG</h2>
        <Button onClick={() => setEditing({})}>
          <Plus className="w-4 h-4 mr-2" />
          Добавить запись
        </Button>
      </div>

      {editing && (
        <Card>
          <CardHeader>
            <CardTitle>{editing.id ? 'Редактировать' : 'Новая'} запись</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <Label htmlFor="title">Заголовок</Label>
                <Input id="title" name="title" defaultValue={editing.title} required />
              </div>
              <div>
                <Label htmlFor="content">Содержание</Label>
                <Textarea id="content" name="content" defaultValue={editing.content} rows={8} required />
              </div>
              <div>
                <Label htmlFor="category">Категория</Label>
                <Input id="category" name="category" defaultValue={editing.category} placeholder="Расписание, Правила, и т.д." />
              </div>
              <div>
                <Label htmlFor="tags">Теги (через запятую)</Label>
                <Input id="tags" name="tags" defaultValue={editing.tags?.join(', ')} placeholder="лицей, уроки, экзамены" />
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
        {items.map(item => (
          <Card key={item.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex-1">
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.category}</p>
                {item.tags && item.tags.length > 0 && (
                  <div className="flex gap-1 mt-1">
                    {item.tags.map((tag: string, i: number) => (
                      <span key={i} className="text-xs px-2 py-0.5 bg-secondary rounded">{tag}</span>
                    ))}
                  </div>
                )}
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