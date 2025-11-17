import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { user, loading, signInWithTelegram } = useAuth();

  useEffect(() => {
    if (user) {
      // Redirect based on role
      if (user.roles.includes('teacher')) {
        navigate('/teacher');
      } else if (user.roles.includes('student')) {
        navigate('/student');
      } else if (user.roles.includes('parent')) {
        navigate('/parent');
      } else {
        navigate('/');
      }
    } else if (!loading && !window.Telegram?.WebApp) {
      // Auto-initialize Telegram WebApp
      signInWithTelegram();
    }
  }, [user, loading, navigate, signInWithTelegram]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/20 to-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/20 to-background p-4">
      <Card className="w-full max-w-md bg-gradient-card shadow-glow border-border/50">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-medium">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          
          <CardTitle className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Лицей №1
          </CardTitle>
          
          <CardDescription className="text-base">
            Авторизация через Telegram
          </CardDescription>
        </CardHeader>
        
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Откройте приложение через Telegram Mini App
          </p>
          <Button 
            onClick={signInWithTelegram}
            className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-300"
          >
            Войти через Telegram
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
