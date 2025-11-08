import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, User, MessageSquare, Award } from "lucide-react";

const Parent = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
            Панель родителя
          </h1>
          <p className="text-muted-foreground text-lg">Ваш ребенок: Иванов Петр, 10А класс</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="bg-gradient-card border-border/50 animate-in fade-in slide-in-from-left-4 duration-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Расписание ребенка
              </CardTitle>
              <CardDescription>Завтра, 15 ноября</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { time: "08:30", subject: "Математика" },
                { time: "09:25", subject: "Русский язык" },
                { time: "10:20", subject: "Физика" },
              ].map((lesson, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-3 rounded-lg bg-secondary/50"
                >
                  <div className="w-16 h-16 rounded-lg bg-gradient-primary flex items-center justify-center shadow-soft">
                    <span className="text-white font-semibold text-sm">{lesson.time}</span>
                  </div>
                  <div className="font-medium text-foreground">{lesson.subject}</div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-border/50 animate-in fade-in slide-in-from-right-4 duration-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                Связь с учителями
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-300">
                Связаться с классным руководителем
              </Button>
              <Button variant="outline" className="w-full">
                Все учителя
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Parent;
