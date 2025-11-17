import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LogOut, Menu } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ClassManager } from "@/components/teacher/ClassManager";
import { ScheduleManager } from "@/components/teacher/ScheduleManager";
import { CourseManager } from "@/components/teacher/CourseManager";

const Teacher = () => {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'classes' | 'schedule' | 'courses'>('classes');

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
              Панель учителя
            </h1>
            <p className="text-muted-foreground text-lg">
              {user?.first_name} {user?.last_name}
            </p>
          </div>
          <Button variant="outline" onClick={signOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Выйти
          </Button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-4 mb-8 flex-wrap">
          <Button
            variant={activeTab === 'classes' ? 'default' : 'outline'}
            onClick={() => setActiveTab('classes')}
            className={activeTab === 'classes' ? 'bg-gradient-primary' : ''}
          >
            Классы
          </Button>
          <Button
            variant={activeTab === 'schedule' ? 'default' : 'outline'}
            onClick={() => setActiveTab('schedule')}
            className={activeTab === 'schedule' ? 'bg-gradient-primary' : ''}
          >
            Расписание
          </Button>
          <Button
            variant={activeTab === 'courses' ? 'default' : 'outline'}
            onClick={() => setActiveTab('courses')}
            className={activeTab === 'courses' ? 'bg-gradient-primary' : ''}
          >
            Спецкурсы
          </Button>
        </div>

        {/* Content */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {activeTab === 'classes' && <ClassManager />}
          {activeTab === 'schedule' && <ScheduleManager />}
          {activeTab === 'courses' && <CourseManager />}
        </div>
      </div>
    </div>
  );
};

export default Teacher;
