import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GraduationCap, Users, BookOpen, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  const roles = [
    {
      title: "Учитель",
      description: "Управление классами, расписанием и спецкурсами",
      icon: GraduationCap,
      color: "from-primary to-primary-glow",
      path: "/teacher",
    },
    {
      title: "Ученик",
      description: "Расписание, спецкурсы и учебные материалы",
      icon: BookOpen,
      color: "from-accent to-orange-400",
      path: "/student",
    },
    {
      title: "Родитель",
      description: "Мониторинг успеваемости и связь с учителями",
      icon: Users,
      color: "from-green-500 to-emerald-400",
      path: "/parent",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32">
        <div className="absolute inset-0 bg-gradient-hero opacity-5" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="inline-flex items-center gap-2 bg-secondary/50 backdrop-blur-sm px-6 py-3 rounded-full mb-6 shadow-soft">
              <Calendar className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-foreground">
                Образовательная платформа
              </span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
              Лицей №1
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-8">
              Современная платформа для учителей, учеников и родителей
            </p>
            
            <Button 
              size="lg" 
              className="bg-gradient-primary hover:shadow-glow transition-all duration-300"
              onClick={() => navigate("/login")}
            >
              Войти в систему
            </Button>
          </div>

          {/* Role Cards */}
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {roles.map((role, index) => {
              const Icon = role.icon;
              return (
                <Card
                  key={role.title}
                  className="group relative overflow-hidden bg-gradient-card border-border/50 hover:shadow-glow transition-all duration-500 cursor-pointer animate-in fade-in slide-in-from-bottom-8"
                  style={{ animationDelay: `${index * 150}ms` }}
                  onClick={() => navigate(role.path)}
                >
                  <div className="p-8">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${role.color} flex items-center justify-center mb-6 shadow-medium group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    
                    <h3 className="text-2xl font-bold mb-3 text-foreground">
                      {role.title}
                    </h3>
                    
                    <p className="text-muted-foreground mb-6">
                      {role.description}
                    </p>
                    
                    <Button 
                      variant="outline" 
                      className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300"
                    >
                      Подробнее
                    </Button>
                  </div>
                  
                  {/* Decorative gradient */}
                  <div className={`absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r ${role.color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300`} />
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12 text-foreground">
            Возможности платформы
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              { icon: Calendar, title: "Расписание", desc: "Персональное расписание уроков" },
              { icon: BookOpen, title: "Спецкурсы", desc: "Дополнительные образовательные курсы" },
              { icon: GraduationCap, title: "Тестирование", desc: "Профильное тестирование" },
              { icon: Users, title: "Коммуникация", desc: "Связь между всеми участниками" },
            ].map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="text-center p-6 rounded-xl bg-card hover:shadow-medium transition-all duration-300 animate-in fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <Icon className="w-12 h-12 mx-auto mb-4 text-primary" />
                  <h3 className="text-lg font-semibold mb-2 text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
