import React, { useState } from 'react';
import { Plus, UserPlus, CreditCard, Dumbbell, MessageCircle, X } from 'lucide-react';
import { BottomSheet } from './BottomSheet';

interface QuickActionFabProps {
  onNewClient: () => void;
  onNewPayment: () => void;
  onNewRoutine: () => void;
  onSearchClients: () => void;
}

export const QuickActionFab: React.FC<QuickActionFabProps> = ({
  onNewClient,
  onNewPayment,
  onNewRoutine,
  onSearchClients,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    {
      title: 'Nuevo Alumno',
      desc: 'Alta de alumno presencial u online',
      icon: UserPlus,
      color: 'bg-blue-600 hover:bg-blue-500 text-white',
      onClick: () => {
        setIsOpen(false);
        onNewClient();
      },
    },
    {
      title: 'Registrar Pago',
      desc: 'Cobro de cuota mensual o abono',
      icon: CreditCard,
      color: 'bg-emerald-600 hover:bg-emerald-500 text-white',
      onClick: () => {
        setIsOpen(false);
        onNewPayment();
      },
    },
    {
      title: 'Crear Rutina',
      desc: 'Nuevo plan de entrenamiento',
      icon: Dumbbell,
      color: 'bg-indigo-600 hover:bg-indigo-500 text-white',
      onClick: () => {
        setIsOpen(false);
        onNewRoutine();
      },
    },
    {
      title: 'Buscar Alumno',
      desc: 'Localizar alumno o ficha rápida',
      icon: MessageCircle,
      color: 'bg-amber-600 hover:bg-amber-500 text-white',
      onClick: () => {
        setIsOpen(false);
        onSearchClients();
      },
    },
  ];

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed right-4 bottom-20 z-40 w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white shadow-xl shadow-blue-600/30 flex items-center justify-center transition-all duration-200 active:scale-90 hover:shadow-cyan-500/40"
        aria-label="Acciones rápidas"
      >
        <Plus className="w-7 h-7 stroke-[2.5]" />
      </button>

      {/* Quick Action Bottom Sheet */}
      <BottomSheet
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Acciones Rápidas"
        subtitle="Todo lo que necesitás al alcance de un pulgar"
      >
        <div className="grid grid-cols-1 gap-3 py-2">
          {actions.map((act) => {
            const Icon = act.icon;
            return (
              <button
                key={act.title}
                onClick={act.onClick}
                className="w-full flex items-center p-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-all text-left group active:scale-[0.98]"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-md ${act.color}`}>
                  <Icon className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div className="ml-3.5 flex-1">
                  <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                    {act.title}
                  </h4>
                  <p className="text-xs text-slate-400">{act.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </BottomSheet>
    </>
  );
};
