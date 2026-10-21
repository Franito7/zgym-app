import React from 'react';
import { Outlet } from 'react-router-dom';
import { MobileHeader } from './MobileHeader';
import { BottomNavigation } from './BottomNavigation';

export const CoachLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col">
      <MobileHeader />
      <main className="flex-1 overflow-x-hidden">
        <Outlet />
      </main>
      <BottomNavigation />
    </div>
  );
};
