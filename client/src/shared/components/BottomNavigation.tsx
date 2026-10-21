import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, CreditCard, Dumbbell, MoreHorizontal } from 'lucide-react';

export const BottomNavigation: React.FC = () => {
  const navItems = [
    { to: '/', label: 'Inicio', icon: LayoutDashboard },
    { to: '/alumnos', label: 'Alumnos', icon: Users },
    { to: '/pagos', label: 'Pagos', icon: CreditCard },
    { to: '/online', label: 'Online', icon: Dumbbell },
    { to: '/mas', label: 'Más', icon: MoreHorizontal },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0d121f]/95 backdrop-blur-xl border-t border-slate-800/80 px-2 py-1 safe-bottom shadow-2xl">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all duration-150 ${
                isActive
                  ? 'text-blue-400 font-semibold scale-105'
                  : 'text-slate-400 hover:text-slate-200'
              }`
            }
          >
            {({ isActive }) => {
              const Icon = item.icon;
              return (
                <>
                  <div
                    className={`p-1 rounded-xl transition-all ${
                      isActive ? 'bg-blue-600/20 text-blue-400 ring-1 ring-blue-500/30' : ''
                    }`}
                  >
                    <Icon className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
                </>
              );
            }}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
