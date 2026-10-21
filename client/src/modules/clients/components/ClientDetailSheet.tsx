import React, { useState } from 'react';
import { User, Payment } from '../../../shared/types';
import { BottomSheet } from '../../../shared/components/BottomSheet';
import {
  Phone,
  Mail,
  Calendar,
  CreditCard,
  Dumbbell,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Edit3,
  Trash2,
  Video,
  FileText,
  ExternalLink,
  MessageCircle,
  Plus
} from 'lucide-react';
import { formatCurrency, formatDate, calculateDaysRemaining, formatDaysList } from '../../../shared/utils/formatters';
import { buildWhatsAppUrl, getPaymentReminderMessage } from '../../../shared/utils/whatsapp';

interface ClientDetailSheetProps {
  isOpen: boolean;
  onClose: () => void;
  client: User | null;
  onEdit: (client: User) => void;
  onDelete: (id: number) => void;
  onPay: (client: User) => void;
  onAssignRoutine?: (client: User) => void;
  onAssignMeet?: (client: User) => void;
}

export const ClientDetailSheet: React.FC<ClientDetailSheetProps> = ({
  isOpen,
  onClose,
  client,
  onEdit,
  onDelete,
  onPay,
  onAssignRoutine,
  onAssignMeet,
}) => {
  const [activeTab, setActiveTab] = useState<'presencial' | 'online'>('presencial');

  if (!isOpen || !client) return null;

  const daysRemaining = calculateDaysRemaining(client.due_date);
  const isOverdue = daysRemaining < 0;
  const isExpiringSoon = daysRemaining >= 0 && daysRemaining <= 7;

  // Acción rápida de WhatsApp
  const handleOpenWhatsApp = () => {
    if (!client.phone) return;
    const msg = getPaymentReminderMessage(
      client.first_name,
      daysRemaining,
      client.monthly_price || 0,
      client.plan_name || 'Plan'
    );
    window.open(buildWhatsAppUrl(client.phone, msg), '_blank');
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      maxHeight="max-h-[94vh]"
    >
      <div className="space-y-4">
        {/* Top Profile Card */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-start justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-xl font-bold text-white shadow-lg shadow-blue-500/20">
              {client.first_name[0]?.toUpperCase() || 'C'}
              {client.last_name ? client.last_name[0]?.toUpperCase() : ''}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white">
                  {client.first_name} {client.last_name}
                </h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    client.account_status === 'ACTIVO'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : client.account_status === 'VENCIDO'
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      : 'bg-slate-700/40 text-slate-300 border-slate-600'
                  }`}
                >
                  {client.account_status}
                </span>
              </div>

              {/* Badges de Modalidad */}
              <div className="flex items-center gap-1.5 mt-1.5">
                {Boolean(client.is_presencial) && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    Presencial
                  </span>
                )}
                {Boolean(client.is_online) && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    Online
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Botón WhatsApp directo */}
          {client.phone && (
            <button
              onClick={handleOpenWhatsApp}
              title="Abrir WhatsApp"
              className="p-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 transition-all active:scale-95 flex items-center justify-center shrink-0"
            >
              <MessageCircle className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Contact Strip */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-2 text-slate-300">
            <Phone className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate">{client.phone || 'Sin teléfono'}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-2 text-slate-300">
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate">{client.email || 'Sin email'}</span>
          </div>
        </div>

        {/* Switch de Pestañas Presencial / Online */}
        <div className="flex p-1 rounded-xl bg-slate-900 border border-slate-800">
          <button
            onClick={() => setActiveTab('presencial')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'presencial'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Dumbbell className="w-3.5 h-3.5" />
            <span>Gestión Presencial</span>
          </button>
          <button
            onClick={() => setActiveTab('online')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'online'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Asesoría Online</span>
          </button>
        </div>

        {/* PESTAÑA 1: GESTIÓN PRESENCIAL */}
        {activeTab === 'presencial' && (
          <div className="space-y-3">
            {/* Banner de vencimiento & cuota */}
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Plan Contratado
                  </span>
                  <p className="text-sm font-bold text-white mt-0.5">
                    {client.plan_name || 'Pase Libre'} • {formatCurrency(client.monthly_price || 0)}
                  </p>
                </div>

                <button
                  onClick={() => onPay(client)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Cobrar</span>
                </button>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Vencimiento de cuota:</span>
                <span
                  className={`font-semibold flex items-center gap-1 ${
                    isOverdue
                      ? 'text-rose-400'
                      : isExpiringSoon
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {isOverdue ? (
                    <>
                      <AlertTriangle className="w-3 h-3" />
                      Venció hace {Math.abs(daysRemaining)} d ({formatDate(client.due_date)})
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3 h-3" />
                      {daysRemaining} días restantes ({formatDate(client.due_date)})
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Días y Horarios habituales */}
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400">Días de entrenamiento:</span>
                <p className="font-semibold text-white mt-0.5">{formatDaysList(client.schedule_days)}</p>
              </div>
              <div className="text-right">
                <span className="text-slate-400">Turno:</span>
                <p className="font-semibold text-blue-400 mt-0.5">{client.schedule_time || '09:00'} hs</p>
              </div>
            </div>

            {/* Historial de Pagos del Alumno */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Últimos Pagos Registrados
              </span>
              {client.payments && client.payments.length > 0 ? (
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {client.payments.map((p) => (
                    <div
                      key={p.id}
                      className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-white">{p.period}</span>
                        <span className="text-slate-400 ml-2">({p.payment_method})</span>
                        <p className="text-[10px] text-slate-500">{formatDate(p.payment_date)}</p>
                      </div>
                      <span className="font-bold text-emerald-400">{formatCurrency(p.amount)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic p-3 rounded-xl bg-slate-900/40 border border-slate-800/60 text-center">
                  Sin pagos registrados hasta el momento.
                </p>
              )}
            </div>
          </div>
        )}

        {/* PESTAÑA 2: ASESORÍA ONLINE */}
        {activeTab === 'online' && (
          <div className="space-y-3">
            {/* Rutina Asignada */}
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
                  Plan de Entrenamiento
                </span>
                {onAssignRoutine && (
                  <button
                    onClick={() => onAssignRoutine(client)}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Asignar Rutina</span>
                  </button>
                )}
              </div>

              {client.releases && client.releases.some((r) => r.routine_title) ? (
                <div className="space-y-1.5">
                  {client.releases
                    .filter((r) => r.routine_title)
                    .map((r) => (
                      <div
                        key={r.id}
                        className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"
                      >
                        <div>
                          <p className="text-xs font-bold text-white">{r.routine_title}</p>
                          <p className="text-[10px] text-slate-400">
                            Liberado el {formatDate(r.release_date)}
                          </p>
                        </div>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Activa
                        </span>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic p-2 rounded-xl bg-slate-950/60 text-center">
                  Sin rutina online asignada actualmente.
                </p>
              )}
            </div>

            {/* Próximas Citas Online / Meets */}
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
                  Citas & Meets
                </span>
                {onAssignMeet && (
                  <button
                    onClick={() => onAssignMeet(client)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Agendar Meet</span>
                  </button>
                )}
              </div>

              {client.events && client.events.length > 0 ? (
                <div className="space-y-1.5">
                  {client.events.map((e) => (
                    <div
                      key={e.id}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-xs font-bold text-white">{e.title}</p>
                        <p className="text-[10px] text-slate-400">{formatDate(e.event_date)}</p>
                      </div>
                      {e.meet_url && (
                        <a
                          href={e.meet_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-blue-600 text-white text-[11px] font-semibold flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Unirse</span>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic p-2 rounded-xl bg-slate-950/60 text-center">
                  Sin citas agendadas.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={() => onDelete(client.id)}
            className="px-3.5 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Eliminar</span>
          </button>

          <button
            onClick={() => onEdit(client)}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Editar Datos</span>
          </button>
        </div>
      </div>
    </BottomSheet>
  );
};
