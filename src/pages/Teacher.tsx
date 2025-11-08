import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Users, BookOpen, MessageSquare, Settings } from "lucide-react";

const Teacher = () => {
  const stats = [
    { label: "Мои классы", value: "3", icon: Users, color: "from-primary to-primary-glow" },
    { label: "Спецкурсы", value: "2", icon: BookOpen, color: "from-accent to-orange-400" },
    { label: "Уроков сегодня", value: "5", icon: Calendar, color: "from-green-500 to-emerald-400" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
            Панель учителя
          </h1>
          <p className="text-muted-foreground text-lg">
            Добро пожаловать в вашу рабочую область
          </p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card
                key={stat.label}
                className="bg-gradient-card border-border/50 hover:shadow-medium transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </CardTitle>
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-soft`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <Card className="mb-8 bg-gradient-card border-border/50 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardHeader>
            <CardTitle className="text-2xl">Быстрые действия</CardTitle>
            <CardDescription>Наиболее часто используемые функции</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button className="h-auto flex-col py-6 bg-gradient-to-br from-primary to-primary-glow hover:shadow-glow transition-all duration-300">
              <Calendar className="w-6 h-6 mb-2" />
              <span>Расписание</span>
            </Button>
            <Button className="h-auto flex-col py-6 bg-gradient-to-br from-accent to-orange-400 hover:shadow-glow transition-all duration-300">
              <Users className="w-6 h-6 mb-2" />
              <span>Мои классы</span>
            </Button>
            <Button className="h-auto flex-col py-6 bg-gradient-to-br from-green-500 to-emerald-400 hover:shadow-glow transition-all duration-300">
              <BookOpen className="w-6 h-6 mb-2" />
              <span>Спецкурсы</span>
            </Button>
            <Button className="h-auto flex-col py-6 bg-gradient-to-br from-purple-500 to-pink-400 hover:shadow-glow transition-all duration-300">
              <MessageSquare className="w-6 h-6 mb-2" />
              <span>Сообщения</span>
            </Button>
          </CardContent>
        </Card>

        {/* Schedule Preview */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="bg-gradient-card border-border/50 animate-in fade-in slide-in-from-left-4 duration-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Расписание на сегодня
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { time: "08:30 - 09:15", subject: "Математика", class: "10А" },
                { time: "09:25 - 10:10", subject: "Физика", class: "10Б" },
                { time: "10:20 - 11:05", subject: "Математика", class: "11А" },
              ].map((lesson, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors duration-200"
                >
                  <div>
                    <div className="font-semibold text-foreground">{lesson.subject}</div>
                    <div className="text-sm text-muted-foreground">Класс {lesson.class}</div>
                  </div>
                  <div className="text-sm font-medium text-primary">{lesson.time}</div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-border/50 animate-in fade-in slide-in-from-right-4 duration-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Мои классы
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { name: "10А", students: 28, color: "from-blue-500 to-cyan-400" },
                { name: "10Б", students: 26, color: "from-purple-500 to-pink-400" },
                { name: "11А", students: 24, color: "from-green-500 to-emerald-400" },
              ].map((classItem, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors duration-200 group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${classItem.color} flex items-center justify-center shadow-soft group-hover:scale-110 transition-transform duration-300`}>
                      <span className="text-white font-bold">{classItem.name}</span>
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">Класс {classItem.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {classItem.students} учеников
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    Открыть
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Teacher;
