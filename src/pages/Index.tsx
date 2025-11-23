import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { GraduationCap, Newspaper, Calendar } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user && user.roles.length > 0) {
      navigate('/news');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-primary rounded-3xl mb-6 shadow-glow">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
          
          <h1 className="text-5xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
            Лицей №1
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8">
            Новости, мероприятия и информация для учеников и родителей
          </p>

          <Button 
            size="lg"
            onClick={() => navigate('/login')}
            className="bg-gradient-primary hover:shadow-glow transition-all duration-300"
          >
            Войти через Telegram
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-12">
          <Card className="bg-gradient-card border-border/50 hover:shadow-glow transition-all">
            <CardHeader>
              <Newspaper className="w-12 h-12 mb-4 text-primary" />
              <CardTitle>Новости лицея</CardTitle>
              <CardDescription>
                Актуальные новости и объявления по вашим интересам
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-gradient-card border-border/50 hover:shadow-glow transition-all">
            <CardHeader>
              <Calendar className="w-12 h-12 mb-4 text-primary" />
              <CardTitle>Мероприятия</CardTitle>
              <CardDescription>
                Участвуйте в соревнованиях и мероприятиях, получайте награды
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
