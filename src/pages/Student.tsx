import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ScheduleView } from "@/components/student/ScheduleView";
import { CourseEnrollment } from "@/components/student/CourseEnrollment";

const Student = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
              Панель ученика
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

        <div className="grid md:grid-cols-2 gap-6">
          <ScheduleView />
          <CourseEnrollment />
        </div>
      </div>
    </div>
  );
};

export default Student;
