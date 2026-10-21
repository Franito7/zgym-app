import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { authService } from '../services/supabaseApi';
import { supabase, isSupabaseConfigured } from '../services/supabase';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('zgym_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Carga o sincroniza el perfil del usuario desde la tabla 'users' de Supabase
  const loadProfileFromEmail = useCallback(async (email: string): Promise<User | null> => {
    const cleanEmail = email.toLowerCase().trim();
    try {
      if (isSupabaseConfigured()) {
        const { data: profile, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', cleanEmail)
          .maybeSingle();

        if (profile && !error) {
          setUser(profile);
          localStorage.setItem('zgym_user', JSON.stringify(profile));
          return profile;
        }

        // Si el usuario está autenticado en Supabase Auth pero aún no existe en la tabla users, lo registramos
        const isAugusto = cleanEmail === 'augusto@zgym.com';
        const newProfile: Partial<User> = {
          first_name: isAugusto ? 'Augusto' : cleanEmail.split('@')[0],
          last_name: '',
          email: cleanEmail,
          role: isAugusto ? 'ADMIN' : 'ALUMNO',
          account_status: 'ACTIVO',
          is_active: 1,
          is_presencial: isAugusto ? 0 : 1,
          is_online: 1,
          plan_name: isAugusto ? 'Administrador' : 'Pase Libre',
          monthly_price: 0,
          schedule_time: '12:00',
          schedule_days: [1, 2, 3, 4, 5],
          notes: isAugusto ? 'Usuario Administrador Oficial ZGym' : '',
        };

        const { data: created, error: insertErr } = await supabase
          .from('users')
          .insert([newProfile])
          .select('*')
          .single();

        if (created && !insertErr) {
          setUser(created);
          localStorage.setItem('zgym_user', JSON.stringify(created));
          return created;
        }
      }
    } catch (err) {
      console.error('Error al sincronizar perfil de usuario:', err);
    }
    return null;
  }, []);

  const refreshUser = useCallback(async () => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured()) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email) {
          await loadProfileFromEmail(session.user.email);
        } else {
          // No hay sesión activa en Supabase
          setUser(null);
          localStorage.removeItem('zgym_user');
          localStorage.removeItem('zgym_token');
        }
      } else {
        // Modo local sin Supabase configurado
        const localUser = await authService.getMe();
        if (localUser) {
          setUser(localUser);
          localStorage.setItem('zgym_user', JSON.stringify(localUser));
        } else {
          setUser(null);
        }
      }
    } catch (err) {
      console.error('Error al refrescar usuario:', err);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [loadProfileFromEmail]);

  useEffect(() => {
    refreshUser();

    if (isSupabaseConfigured()) {
      // Escuchar eventos de autenticación de Supabase en tiempo real (login, logout, token refresh)
      const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          if (session?.user?.email) {
            await loadProfileFromEmail(session.user.email);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          localStorage.removeItem('zgym_user');
          localStorage.removeItem('zgym_token');
        }
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    }
  }, [refreshUser, loadProfileFromEmail]);

  const login = async (email: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      const { user: loggedUser, token } = await authService.login(email, password);
      setUser(loggedUser);
      localStorage.setItem('zgym_user', JSON.stringify(loggedUser));
      if (token) {
        localStorage.setItem('zgym_token', token);
      }
      return loggedUser;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } catch (err) {
      console.error('Error en logout:', err);
    } finally {
      setUser(null);
      localStorage.removeItem('zgym_user');
      localStorage.removeItem('zgym_token');
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe utilizarse dentro de un AuthProvider');
  }
  return context;
};
