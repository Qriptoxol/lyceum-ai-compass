import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  telegram_id: number;
  first_name: string;
  last_name: string;
  roles: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithTelegram: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const verifyTelegramInitData = async () => {
    // Check if running in Telegram WebApp
    if (!window.Telegram?.WebApp) {
      console.log('Not running in Telegram WebApp');
      setLoading(false);
      return;
    }

    const initData = window.Telegram.WebApp.initData;
    if (!initData) {
      console.log('No initData available');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('verify-init-data', {
        body: { initData }
      });

      if (error) throw error;

      if (data.success && data.user) {
        // Parse session URL and sign in
        const url = new URL(data.sessionUrl);
        const token = url.searchParams.get('token');
        const type = url.searchParams.get('type');

        if (token && type === 'magiclink') {
          const { error: signInError } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'magiclink',
          });

          if (signInError) throw signInError;

          setUser({
            id: data.user.id,
            telegram_id: data.user.telegram_id,
            first_name: data.user.first_name,
            last_name: data.user.last_name,
            roles: data.roles || []
          });
        }
      }
    } catch (error) {
      console.error('Telegram auth error:', error);
      toast({
        title: 'Ошибка авторизации',
        description: 'Не удалось войти через Telegram',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const signInWithTelegram = async () => {
    await verifyTelegramInitData();
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.close();
    }
  };

  useEffect(() => {
    verifyTelegramInitData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // Fetch user profile and roles
        const { data: profile } = await supabase
          .from('profiles')
          .select('*, user_roles(role)')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          setUser({
            id: profile.id,
            telegram_id: profile.telegram_id,
            first_name: profile.first_name,
            last_name: profile.last_name,
            roles: profile.user_roles?.map((r: any) => r.role) || []
          });
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signInWithTelegram, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

// Extend Window interface for Telegram WebApp
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string;
        close: () => void;
        ready: () => void;
        expand: () => void;
      };
    };
  }
}
