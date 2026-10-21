import React, { useEffect, useState } from 'react';
import { Payment, User } from '../../../shared/types';
import { paymentsAPI, clientsAPI } from '../../../shared/services/api';
import {
  CreditCard,
  Plus,
  DollarSign,
  TrendingUp,
  Search,
  Calendar,
  Trash2,
  CheckCircle2,
  Users,
  Dumbbell,
  Laptop
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../../shared/utils/formatters';
import { PaymentSheet } from '../components/PaymentSheet';

export const PaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [clients, setClients] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'presencial' | 'online'>('all');
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pRes, cRes] = await Promise.all([
        paymentsAPI.getAll(),
        clientsAPI.getAll({ role: 'ALUMNO' })
      ]);
      setPayments(pRes?.data?.payments || []);
      setClients(cRes?.data?.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSavePayment = async (data: any) => {
    await paymentsAPI.create(data);
    await fetchData();
  };

  const handleDeletePayment = async (id: number) => {
    if (window.confirm('¿Deseás anular este registro de pago?')) {
      await paymentsAPI.delete(id);
      await fetchData();
    }
  };

  const currentMonth = new Date().toISOString().substring(0, 7);
  const monthPayments = payments.filter((p) => p.payment_date && p.payment_date.startsWith(currentMonth));
  const monthTotal = monthPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);

  // Desglose por método
  const methodTotals: Record<string, number> = {};
  monthPayments.forEach((p) => {
    methodTotals[p.payment_method] = (methodTotals[p.payment_method] || 0) + (Number(p.amount) || 0);
  });

  // Filtrado
  const filteredPayments = payments.filter((p) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const match =
        (p.first_name && p.first_name.toLowerCase().includes(q)) ||
        (p.last_name && p.last_name.toLowerCase().includes(q)) ||
        (p.payment_method && p.payment_method.toLowerCase().includes(q)) ||
        (p.period && p.period.toLowerCase().includes(q)) ||
        (p.notes && p.notes.toLowerCase().includes(q));
      if (!match) return false;
    }

    if (filterType === 'presencial') {
      const isOnlineNote = p.notes && p.notes.toLowerCase().includes('online');
      if (isOnlineNote) return false;
    } else if (filterType === 'online') {
      const isOnlineNote = (p.notes && p.notes.toLowerCase().includes('online')) || (p.plan_name && p.plan_name.toLowerCase().includes('online'));
      if (!isOnlineNote) return false;
    }

    return true;
  });

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto pb-28">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Caja & Cobros</h2>
          <p className="text-xs text-slate-400">Cobranzas de gimnasio presencial y asesorías online</p>
        </div>

        <button
          onClick={() => setIsPaymentOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Cobro</span>
        </button>
      </div>

      {/* Tarjeta Resumen Caja Mensual */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/40 to-slate-900 border border-emerald-800/40 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4" />
            Recaudación Total del Mes
          </span>
          <span className="text-xs text-slate-400 font-semibold">{monthPayments.length} cobros</span>
        </div>

        <div>
          <span className="text-3xl font-black text-white tracking-tight">
            {formatCurrency(monthTotal)}
          </span>
        </div>

        {/* Métodos en Chips */}
        {Object.keys(methodTotals).length > 0 && (
          <div className="pt-2 border-t border-slate-800/80 flex flex-wrap gap-2 text-xs">
            {Object.entries(methodTotals).map(([method, total]) => (
              <span
                key={method}
                className="px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-300 font-medium"
              >
                {method}: <strong className="text-white">{formatCurrency(total)}</strong>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Buscador & Filtros de Tipo de Servicio */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por alumno, método o concepto..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-white placeholder:text-slate-500 focus:border-emerald-500 outline-none"
          />
        </div>

        {/* Chips de filtro */}
        <div className="flex items-center space-x-2 text-xs">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-colors ${
              filterType === 'all'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-900 text-slate-400 border border-slate-800'
            }`}
          >
            Todos los Cobros
          </button>
          <button
            onClick={() => setFilterType('presencial')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-colors flex items-center gap-1 ${
              filterType === 'presencial'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-900 text-slate-400 border border-slate-800'
            }`}
          >
            <Dumbbell className="w-3.5 h-3.5" />
            <span>Presencial</span>
          </button>
          <button
            onClick={() => setFilterType('online')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-colors flex items-center gap-1 ${
              filterType === 'online'
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-900 text-slate-400 border border-slate-800'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>Online</span>
          </button>
        </div>
      </div>

      {/* Historial de Pagos */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Historial de Cobros ({filteredPayments.length})
        </h3>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">Cargando pagos...</div>
        ) : filteredPayments.length > 0 ? (
          <div className="space-y-2">
            {filteredPayments.map((p) => {
              const isOnline = (p.notes && p.notes.toLowerCase().includes('online')) || (p.plan_name && p.plan_name.toLowerCase().includes('online'));
              return (
                <div
                  key={p.id}
                  className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between shadow-sm"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 border ${
                        isOnline
                          ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      }`}
                    >
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-bold text-white">
                          {p.first_name} {p.last_name}
                        </p>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                            isOnline
                              ? 'bg-cyan-500/10 text-cyan-400'
                              : 'bg-blue-500/10 text-blue-400'
                          }`}
                        >
                          {isOnline ? 'Online' : 'Presencial'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {p.period} • {p.payment_method} • {formatDate(p.payment_date)}
                      </p>
                      {p.notes && (
                        <p className="text-[10px] text-slate-500 italic mt-0.5">{p.notes}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-base font-black text-emerald-400">
                      {formatCurrency(p.amount)}
                    </span>
                    <button
                      onClick={() => handleDeletePayment(p.id)}
                      title="Anular pago"
                      className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
            <CreditCard className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-xs text-slate-400">
              {payments.length === 0
                ? 'No hay registros de cobros o pagos todavía.'
                : 'No hay pagos registrados con estos filtros.'}
            </p>
            {payments.length === 0 && (
              <button
                onClick={() => setIsPaymentOpen(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all active:scale-95"
              >
                Registrar Primer Cobro
              </button>
            )}
          </div>
        )}
      </div>

      <PaymentSheet
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        onSavePayment={handleSavePayment}
        clientsList={clients}
      />
    </div>
  );
};
