import React, { useEffect, useState } from 'react';
import { DashboardStats, User } from '../../../shared/types';
import { dashboardAPI, clientsAPI, paymentsAPI } from '../../../shared/services/api';
import {
  Users,
  AlertTriangle,
  Clock,
  TrendingUp,
  CreditCard,
  MessageCircle,
  Dumbbell,
  CheckCircle2,
  Calendar,
  Sparkles,
  ChevronRight,
  Video
} from 'lucide-react';
import { formatCurrency, formatDate, calculateDaysRemaining } from '../../../shared/utils/formatters';
import { buildWhatsAppUrl, getPaymentReminderMessage } from '../../../shared/utils/whatsapp';
import { ClientDetailSheet } from '../../clients/components/ClientDetailSheet';
import { PaymentSheet } from '../../payments/components/PaymentSheet';
import { ClientFormSheet } from '../../clients/components/ClientFormSheet';
import { QuickActionFab } from '../../../shared/components/QuickActionFab';
import { useNavigate } from 'react-router-dom';

const getEmptyStats = (): DashboardStats => {
  const todayStr = new Date().toISOString().split('T')[0];
  const jsDay = new Date().getDay();
  return {
    todayStr,
    dayOfWeek: jsDay === 0 ? 7 : jsDay,
    activeStudents: 0,
    totalStudents: 0,
    expiringStudentsCount: 0,
    expiringStudents: [],
    overdueStudentsCount: 0,
    overdueStudents: [],
    todayStudentsCount: 0,
    todayStudents: [],
    monthRevenue: 0,
    recentPayments: [],
    todayEventsCount: 0,
    todayEvents: [],
  };
};

export const CoachDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>(getEmptyStats);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<User | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isNewClientOpen, setIsNewClientOpen] = useState(false);
  const [paymentClient, setPaymentClient] = useState<User | null>(null);
  const navigate = useNavigate();

  const loadData = async () => {
    console.log('[CoachDashboardPage] loadData: iniciando carga');
    try {
      setLoading(true);
      const res = await dashboardAPI.getCoachDashboard();
      console.log('[CoachDashboardPage] loadData: respuesta obtenida', res);
      if (res?.data) {
        setStats(res.data);
      } else {
        console.warn('[CoachDashboardPage] loadData: sin datos, usando getEmptyStats()');
        setStats(getEmptyStats());
      }
    } catch (err: any) {
      console.error('[CoachDashboardPage] Error crítico en loadData:', err);
      setStats(getEmptyStats());
    } finally {
      console.log('[CoachDashboardPage] loadData: finalizando con setLoading(false)');
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenClient = async (userId: number) => {
    try {
      const res = await clientsAPI.getById(userId);
      if (res?.data?.user) {
        setSelectedClient(res.data.user);
        setIsDetailOpen(true);
      }
    } catch (err: any) {
      console.error('Error al abrir detalle de cliente:', err?.message || err);
    }
  };

  const handleOpenPay = (client: User) => {
    setPaymentClient(client);
    setIsPaymentOpen(true);
  };

  const handleSavePayment = async (data: any) => {
    await paymentsAPI.create(data);
    await loadData();
    if (selectedClient && selectedClient.id === data.userId) {
      const updated = await clientsAPI.getById(data.userId);
      setSelectedClient(updated?.data?.user || null);
    }
  };

  const handleSaveClient = async (data: any) => {
    await clientsAPI.create(data);
    await loadData();
  };

  const handleWhatsApp = (client: User) => {
    if (!client.phone) return;
    const days = calculateDaysRemaining(client.due_date);
    const msg = getPaymentReminderMessage(
      client.first_name,
      days,
      client.monthly_price || 0,
      client.plan_name || 'Plan'
    );
    window.open(buildWhatsAppUrl(client.phone, msg), '_blank');
  };

  if (loading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
        <p className="text-xs text-slate-400">Sincronizando estado del gimnasio...</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 max-w-lg mx-auto pb-28">
      {/* Saludo y Estado Operativo */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Buenos días, Augusto</h2>
        </div>
        <div className="text-right">
          <span className="text-xs font-semibold text-slate-400 block">
            {formatDate(stats.todayStr)}
          </span>
          <span className="text-[11px] font-bold text-emerald-400">
            {stats.activeStudents} alumnos activos
          </span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Vencidos */}
        <div
          onClick={() => navigate('/alumnos?status=VENCIDO')}
          className="p-3.5 rounded-2xl bg-rose-950/20 border border-rose-800/30 flex flex-col justify-between active:scale-[0.98] transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-400">Vencidos</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-white">{stats.overdueStudentsCount}</span>
            <p className="text-[10px] text-slate-400 mt-0.5">Por regularizar</p>
          </div>
        </div>

        {/* Por vencer (7 días) */}
        <div
          onClick={() => navigate('/alumnos')}
          className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-800/30 flex flex-col justify-between active:scale-[0.98] transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400">Por Vencer</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-white">{stats.expiringStudentsCount}</span>
            <p className="text-[10px] text-slate-400 mt-0.5">En los próximos 7 días</p>
          </div>
        </div>

        {/* Ingresos del Mes */}
        <div
          onClick={() => navigate('/pagos')}
          className="p-3.5 rounded-2xl bg-cyan-950/20 border border-cyan-800/30 flex flex-col justify-between active:scale-[0.98] transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cyan-400">Caja Mes</span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2">
            <span className="text-xl font-black text-white">{formatCurrency(stats.monthRevenue)}</span>
            <p className="text-[10px] text-slate-400 mt-0.5">Cobranza registrada</p>
          </div>
        </div>

        {/* Alumnos de hoy */}
        <div
          onClick={() => navigate('/alumnos')}
          className="p-3.5 rounded-2xl bg-blue-950/20 border border-blue-800/30 flex flex-col justify-between active:scale-[0.98] transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-400">Turnos Hoy</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-white">{stats.todayStudentsCount}</span>
            <p className="text-[10px] text-slate-400 mt-0.5">Asistencia esperada</p>
          </div>
        </div>
      </div>

      {/* Tarjeta de Bienvenida cuando el gimnasio inicia limpio */}
      {stats.activeStudents === 0 && (
        <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-950/40 via-slate-900 to-slate-900 border border-blue-500/20 shadow-xl space-y-3">
          <div className="flex items-center space-x-2 text-cyan-400">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-bold text-white">¡Bienvenido a ZGym!</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Tu plataforma está lista para operar. Podés registrar tu primer alumno presencial u online con el botón inferior (+) o desde la sección de Alumnos.
          </p>
          <button
            onClick={() => setIsNewClientOpen(true)}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-lg shadow-blue-600/20"
          >
            <Users className="w-4 h-4" />
            <span>Registrar Primer Alumno</span>
          </button>
        </div>
      )}

      {/* ACCIÓN INMEDIATA 1: COBROS PENDIENTES & RECORDATORIOS WHATSAPP */}
      {stats.overdueStudents.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              <span>Cobros Atrasados Urgentes ({stats.overdueStudents.length})</span>
            </h3>
            <span className="text-[10px] text-slate-400">1-clic WhatsApp</span>
          </div>

          <div className="space-y-2">
            {stats.overdueStudents.slice(0, 4).map((s) => {
              const days = Math.abs(calculateDaysRemaining(s.due_date));
              return (
                <div
                  key={s.id}
                  className="p-3 rounded-2xl bg-slate-900 border border-rose-900/30 flex items-center justify-between shadow-md"
                >
                  <div
                    onClick={() => handleOpenClient(s.id)}
                    className="flex-1 cursor-pointer"
                  >
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-bold text-white">
                        {s.first_name} {s.last_name}
                      </p>
                      <span className="text-[10px] font-semibold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded-md">
                        -{days}d
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {s.plan_name || 'Presencial'} • {formatCurrency(s.monthly_price || 0)}
                    </p>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    {s.phone && (
                      <button
                        onClick={() => handleWhatsApp(s)}
                        title="Enviar WhatsApp"
                        className="p-2.5 rounded-xl bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white border border-emerald-500/30 transition-all active:scale-90"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleOpenPay(s)}
                      className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 shadow-md shadow-emerald-600/20 active:scale-95"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Cobrar</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ACCIÓN INMEDIATA 2: ALUMNOS DE HOY EN SALA */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
            <Dumbbell className="w-4 h-4" />
            <span>Alumnos de Hoy ({stats.todayStudentsCount})</span>
          </h3>
          <span className="text-[10px] text-slate-400">Por turno horario</span>
        </div>

        {stats.todayStudents.length > 0 ? (
          <div className="space-y-2">
            {stats.todayStudents.slice(0, 5).map((s) => (
              <div
                key={s.id}
                onClick={() => handleOpenClient(s.id)}
                className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between cursor-pointer active:scale-[0.99] transition-all"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center font-bold text-xs text-blue-400">
                    {s.schedule_time || '09:00'}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">
                      {s.first_name} {s.last_name}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{s.plan_name || 'Presencial'}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      s.account_status === 'ACTIVO'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}
                  >
                    {s.account_status}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-center">
            <p className="text-xs text-slate-400">No hay turnos registrados para hoy.</p>
          </div>
        )}
      </div>

      {/* ACCIÓN INMEDIATA 3: CITAS / MEETS ONLINE DEL DÍA */}
      {stats.todayEvents.length > 0 && (
        <div className="space-y-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
            <Video className="w-4 h-4" />
            <span>Meets & Asesorías de Hoy ({stats.todayEventsCount})</span>
          </h3>

          <div className="space-y-2">
            {stats.todayEvents.map((ev) => (
              <div
                key={ev.id}
                className="p-3 rounded-2xl bg-indigo-950/20 border border-indigo-800/30 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-bold text-white">{ev.title}</p>
                  <p className="text-xs text-indigo-300 mt-0.5">
                    {ev.first_name} {ev.last_name} • {formatDate(ev.event_date)}
                  </p>
                </div>
                {ev.meet_url && (
                  <a
                    href={ev.meet_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
                  >
                    Unirse
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <QuickActionFab
        onNewClient={() => setIsNewClientOpen(true)}
        onNewPayment={() => {
          setPaymentClient(null);
          setIsPaymentOpen(true);
        }}
        onNewRoutine={() => navigate('/online')}
        onSearchClients={() => navigate('/alumnos')}
      />

      {/* Sheet Ficha 360° */}
      <ClientDetailSheet
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        client={selectedClient}
        onEdit={(c) => {
          setIsDetailOpen(false);
          // abrir edición
        }}
        onDelete={async (id) => {
          await clientsAPI.delete(id);
          setIsDetailOpen(false);
          await loadData();
        }}
        onPay={(c) => {
          setIsDetailOpen(false);
          handleOpenPay(c);
        }}
      />

      {/* Sheet Cobro */}
      <PaymentSheet
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        onSavePayment={handleSavePayment}
        preselectedClient={paymentClient}
        clientsList={stats.overdueStudents}
      />

      {/* Sheet Nuevo Cliente */}
      <ClientFormSheet
        isOpen={isNewClientOpen}
        onClose={() => setIsNewClientOpen(false)}
        onSave={handleSaveClient}
      />
    </div>
  );
};
