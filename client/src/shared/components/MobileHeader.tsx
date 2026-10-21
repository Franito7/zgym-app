import React from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Logo } from './Logo';

interface MobileHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  title,
  subtitle,
  rightAction,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 bg-[#07090e]/95 backdrop-blur-md border-b border-slate-800/80 px-4 py-2.5 safe-top">
      <div className="max-w-lg mx-auto flex items-center justify-between">
        {/* Brand / Logo Estiloso Z-Gym */}
        <div className="flex flex-col">
          <Logo size="sm" />
          <span className="text-[11px] text-slate-400 font-medium pl-0.5 mt-0.5">
            {title || `Hola, ${user?.first_name || 'Augusto'}`}
          </span>
        </div>

        {/* Right Action or Profile */}
        <div className="flex items-center space-x-2">
          {rightAction || (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-blue-400">
                {(user?.first_name?.[0] || 'A').toUpperCase()}
              </div>
              <button
                onClick={handleLogout}
                title="Cerrar sesión"
                className="w-8 h-8 rounded-full bg-slate-800/60 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 flex items-center justify-center transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
