import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { NewsManager } from "@/components/admin/NewsManager";
import { EventsManager } from "@/components/admin/EventsManager";
import { KnowledgeManager } from "@/components/admin/KnowledgeManager";
import { UsersManager } from "@/components/admin/UsersManager";

const Admin = () => {
  const navigate = useNavigate();
  const [admin] = useState(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/admin/login');
      return null;
    }
    try {
      return JSON.parse(atob(token));
    } catch {
      navigate('/admin/login');
      return null;
    }
  });

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate('/admin/login');
  };

  if (!admin) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      <div className="border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Панель администратора
            </h1>
            <p className="text-sm text-muted-foreground">
              {admin.full_name || admin.username}
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Выйти
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        <Tabs defaultValue="news" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="news">Новости</TabsTrigger>
            <TabsTrigger value="events">Мероприятия</TabsTrigger>
            <TabsTrigger value="knowledge">База знаний</TabsTrigger>
            <TabsTrigger value="users">Пользователи</TabsTrigger>
          </TabsList>

          <TabsContent value="news">
            <NewsManager />
          </TabsContent>

          <TabsContent value="events">
            <EventsManager />
          </TabsContent>

          <TabsContent value="knowledge">
            <KnowledgeManager />
          </TabsContent>

          <TabsContent value="users">
            <UsersManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;