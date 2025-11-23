import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Users, Search } from "lucide-react";

export const UsersManager = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*, user_roles(role)')
      .order('created_at', { ascending: false });
    setUsers(data || []);
  };

  const filtered = users.filter(u => 
    u.first_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.last_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.telegram_id?.toString().includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Пользователи</h2>
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-muted-foreground" />
          <span className="text-lg font-semibold">{users.length}</span>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Поиск по имени или Telegram ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid gap-4">
        {filtered.map(user => (
          <Card key={user.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex-1">
                <h3 className="font-semibold">
                  {user.first_name} {user.last_name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Telegram ID: {user.telegram_id}
                </p>
                {user.selected_role && (
                  <p className="text-sm text-muted-foreground">
                    Роль: {user.selected_role}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                {user.user_roles?.map((r: any, i: number) => (
                  <Badge key={i} variant="secondary">{r.role}</Badge>
                ))}
                {user.registration_completed && (
                  <Badge variant="outline">✓ Регистрация завершена</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};