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

export const NewsManager = () => {
  const { toast } = useToast();
  const [news, setNews] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);

  useEffect(() => {
    loadNews();
    loadCategories();
  }, []);

  const loadNews = async () => {
    const { data } = await supabase.from('news').select('*, news_categories(*)').order('created_at', { ascending: false });
    setNews(data || []);
  };

  const loadCategories = async () => {
    const { data } = await supabase.from('news_categories').select('*');
    setCategories(data || []);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    const targetRole = formData.get('target_role') as string;
    const newsData: any = {
      title: formData.get('title') as string,
      content: formData.get('content') as string,
      summary: formData.get('summary') as string,
      category_id: formData.get('category_id') as string,
      target_role: targetRole === 'all' ? null : targetRole,
      is_published: editing?.is_published || false,
      published_at: editing?.is_published ? new Date().toISOString() : null,
    };

    if (editing?.id) {
      await supabase.from('news').update(newsData).eq('id', editing.id);
    } else {
      await supabase.from('news').insert(newsData);
    }

    toast({ title: "Сохранено!" });
    setEditing(null);
    loadNews();
  };

  const togglePublish = async (id: string, current: boolean) => {
    await supabase.from('news').update({ 
      is_published: !current,
      published_at: !current ? new Date().toISOString() : null 
    }).eq('id', id);
    loadNews();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Удалить новость?')) {
      await supabase.from('news').delete().eq('id', id);
      loadNews();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Управление новостями</h2>
        <Button onClick={() => setEditing({})}>
          <Plus className="w-4 h-4 mr-2" />
          Добавить новость
        </Button>
      </div>

      {editing && (
        <Card>
          <CardHeader>
            <CardTitle>{editing.id ? 'Редактировать' : 'Новая'} новость</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <Label htmlFor="title">Заголовок</Label>
                <Input id="title" name="title" defaultValue={editing.title} required />
              </div>
              <div>
                <Label htmlFor="summary">Краткое описание</Label>
                <Input id="summary" name="summary" defaultValue={editing.summary} />
              </div>
              <div>
                <Label htmlFor="content">Содержание</Label>
                <Textarea id="content" name="content" defaultValue={editing.content} rows={8} required />
              </div>
              <div>
                <Label htmlFor="category_id">Категория</Label>
                <Select name="category_id" defaultValue={editing.category_id}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите категорию" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.icon} {cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="target_role">Целевая аудитория</Label>
                <Select name="target_role" defaultValue={editing.target_role || 'all'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все</SelectItem>
                    <SelectItem value="student">Ученики</SelectItem>
                    <SelectItem value="parent">Родители</SelectItem>
                  </SelectContent>
                </Select>
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
        {news.map(item => (
          <Card key={item.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex-1">
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.news_categories?.name}</p>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={item.is_published} onCheckedChange={() => togglePublish(item.id, item.is_published)} />
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