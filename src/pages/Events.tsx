import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Calendar, Users, Trophy, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

interface Event {
  id: string;
  title: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  current_participants: number;
  max_participants: number | null;
  channel_url: string | null;
  event_templates: {
    name: string;
    icon: string | null;
    color: string | null;
    required_participants: number | null;
    required_channel_subscribers: number | null;
    reward_description: string | null;
  } | null;
  event_participants: { user_id: string }[];
}

const Events = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*, event_templates(*), event_participants(user_id)')
        .eq('is_active', true)
        .order('start_date', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinEvent = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from('event_participants')
        .insert({
          event_id: eventId,
          user_id: user?.id || '',
        });

      if (error) throw error;

      toast({
        title: "Успешно!",
        description: "Вы записались на мероприятие",
      });

      loadEvents();
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleLeaveEvent = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from('event_participants')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', user?.id || '');

      if (error) throw error;

      toast({
        title: "Успешно!",
        description: "Вы отписались от мероприятия",
      });

      loadEvents();
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
            Мероприятия
          </h1>
          <p className="text-muted-foreground">
            Участвуйте в мероприятиях и получайте награды
          </p>
        </div>

        {events.length === 0 ? (
          <Card className="bg-gradient-card border-border/50">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                Нет активных мероприятий
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {events.map((event) => {
              const isParticipating = event.event_participants.some(
                p => p.user_id === user?.id
              );
              const progress = event.max_participants
                ? (event.current_participants / event.max_participants) * 100
                : 0;

              return (
                <Card
                  key={event.id}
                  className="bg-gradient-card border-border/50 hover:shadow-glow transition-all"
                  style={{
                    borderColor: event.event_templates?.color || undefined,
                  }}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {event.event_templates && (
                          <Badge
                            variant="secondary"
                            className="mb-2"
                            style={{
                              backgroundColor: event.event_templates.color + '20' || undefined,
                            }}
                          >
                            {event.event_templates.icon} {event.event_templates.name}
                          </Badge>
                        )}
                        <CardTitle className="text-2xl mb-2">{event.title}</CardTitle>
                        <CardDescription>{event.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {event.start_date && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4 mr-2" />
                        {format(new Date(event.start_date), 'd MMMM', { locale: ru })}
                        {event.end_date && ` - ${format(new Date(event.end_date), 'd MMMM', { locale: ru })}`}
                      </div>
                    )}

                    {event.max_participants && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center text-muted-foreground">
                            <Users className="w-4 h-4 mr-2" />
                            Участников
                          </span>
                          <span className="font-medium">
                            {event.current_participants} / {event.max_participants}
                          </span>
                        </div>
                        <Progress value={progress} />
                      </div>
                    )}

                    {event.event_templates?.reward_description && (
                      <div className="flex items-start gap-2 p-3 bg-primary/10 rounded-lg">
                        <Trophy className="w-5 h-5 text-primary mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Награда</p>
                          <p className="text-sm text-muted-foreground">
                            {event.event_templates.reward_description}
                          </p>
                        </div>
                      </div>
                    )}

                    {event.channel_url && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => window.open(event.channel_url!, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Перейти в канал
                      </Button>
                    )}

                    {isParticipating ? (
                      <Button
                        variant="destructive"
                        className="w-full"
                        onClick={() => handleLeaveEvent(event.id)}
                      >
                        Отменить участие
                      </Button>
                    ) : (
                      <Button
                        className="w-full bg-gradient-primary"
                        onClick={() => handleJoinEvent(event.id)}
                        disabled={event.max_participants !== null && event.current_participants >= event.max_participants}
                      >
                        {event.max_participants !== null && event.current_participants >= event.max_participants
                          ? 'Мест нет'
                          : 'Участвовать'}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Events;