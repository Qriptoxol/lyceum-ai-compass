import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, BookOpen, Award, Bell } from "lucide-react";

const Student = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
            Панель ученика
          </h1>
          <p className="text-muted-foreground text-lg">10А класс</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="bg-gradient-card border-border/50 animate-in fade-in slide-in-from-left-4 duration-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Расписание на завтра
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { time: "08:30", subject: "Математика" },
                { time: "09:25", subject: "Русский язык" },
                { time: "10:20", subject: "Физика" },
                { time: "11:25", subject: "История" },
              ].map((lesson, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors duration-200"
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
                <BookOpen className="w-5 h-5 text-primary" />
                Мои спецкурсы
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { name: "Программирование на Python", teacher: "Иванов И.И.", color: "from-blue-500 to-cyan-400" },
                { name: "Углубленная математика", teacher: "Петрова А.С.", color: "from-purple-500 to-pink-400" },
              ].map((course, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors duration-200"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${course.color} shadow-soft`} />
                    <div className="font-semibold text-foreground">{course.name}</div>
                  </div>
                  <div className="text-sm text-muted-foreground ml-13">
                    Преподаватель: {course.teacher}
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full">
                Записаться на новый спецкурс
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Student;
