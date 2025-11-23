import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, User } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface News {
  id: string;
  title: string;
  content: string;
  summary: string | null;
  image_url: string | null;
  published_at: string;
  news_categories: {
    name: string;
    icon: string | null;
  } | null;
}

const News = () => {
  const { user } = useAuth();
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNews, setSelectedNews] = useState<News | null>(null);

  useEffect(() => {
    loadNews();
  }, [user]);

  const loadNews = async () => {
    try {
      // Get user preferences
      const { data: preferences } = await supabase
        .from('user_preferences')
        .select('category_id')
        .eq('user_id', user?.id || '');

      const categoryIds = preferences?.map(p => p.category_id) || [];

      // Get news
      let query = supabase
        .from('news')
        .select('*, news_categories(*)')
        .eq('is_published', true)
        .order('published_at', { ascending: false });

      // Filter by role and preferences
      if (user?.roles && user.roles.length > 0) {
        query = query.or(`target_role.is.null,target_role.eq.${user.roles[0]}`);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Filter by user preferences if they have any
      const filtered = categoryIds.length > 0
        ? data?.filter(n => n.news_categories && categoryIds.includes(n.news_categories.id))
        : data;

      setNews(filtered || []);
    } catch (error) {
      console.error('Error loading news:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (selectedNews) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background p-4">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => setSelectedNews(null)}
            className="mb-4 text-primary hover:underline"
          >
            ← Назад к новостям
          </button>
          
          <Card className="bg-gradient-card border-border/50">
            {selectedNews.image_url && (
              <img
                src={selectedNews.image_url}
                alt={selectedNews.title}
                className="w-full h-64 object-cover rounded-t-lg"
              />
            )}
            
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                {selectedNews.news_categories && (
                  <Badge variant="secondary">
                    {selectedNews.news_categories.icon} {selectedNews.news_categories.name}
                  </Badge>
                )}
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(selectedNews.published_at), 'd MMMM yyyy', { locale: ru })}
                </span>
              </div>
              <CardTitle className="text-3xl">{selectedNews.title}</CardTitle>
            </CardHeader>
            
            <CardContent>
              <div className="prose prose-lg max-w-none">
                {selectedNews.content}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
            Новости
          </h1>
          <p className="text-muted-foreground">
            Актуальные новости и события лицея
          </p>
        </div>

        {news.length === 0 ? (
          <Card className="bg-gradient-card border-border/50">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                Нет доступных новостей. Настройте подписки в боте.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {news.map((item) => (
              <Card
                key={item.id}
                className="bg-gradient-card border-border/50 hover:shadow-glow transition-all cursor-pointer"
                onClick={() => setSelectedNews(item)}
              >
                {item.image_url && (
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                )}
                
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    {item.news_categories && (
                      <Badge variant="secondary" className="text-xs">
                        {item.news_categories.icon} {item.news_categories.name}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="line-clamp-2">{item.title}</CardTitle>
                  <CardDescription className="line-clamp-3">
                    {item.summary || item.content.substring(0, 150) + '...'}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4 mr-1" />
                    {format(new Date(item.published_at), 'd MMM yyyy', { locale: ru })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default News;