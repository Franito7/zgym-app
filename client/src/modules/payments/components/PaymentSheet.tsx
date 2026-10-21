import React, { useState, useEffect } from 'react';
import { User } from '../../../shared/types';
import { BottomSheet } from '../../../shared/components/BottomSheet';
import { CreditCard, DollarSign, Calendar, Dumbbell, Laptop } from 'lucide-react';
import { formatCurrency } from '../../../shared/utils/formatters';

interface PaymentSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSavePayment: (paymentData: any) => Promise<void>;
  preselectedClient?: User | null;
  clientsList?: User[];
}

export const PaymentSheet: React.FC<PaymentSheetProps> = ({
  isOpen,
  onClose,
  onSavePayment,
  preselectedClient,
  clientsList = [],
}) => {
  const [selectedClientId, setSelectedClientId] = useState<number | ''>('');
  const [amount, setAmount] = useState<number>(25000);
  const [paymentType, setPaymentType] = useState<'presencial' | 'online'>('presencial');
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [paymentDate, setPaymentDate] = useState('');
  const [nextDueDate, setNextDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const methods = ['Efectivo', 'Transferencia', 'Mercado Pago', 'Tarjeta'];

  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    setPaymentDate(todayStr);

    const d = new Date();
    d.setDate(d.getDate() + 30);
    setNextDueDate(d.toISOString().split('T')[0]);

    if (preselectedClient) {
      setSelectedClientId(preselectedClient.id);
      setAmount(preselectedClient.monthly_price || 25000);
      setPaymentType(preselectedClient.is_online && !preselectedClient.is_presencial ? 'online' : 'presencial');
    } else if (clientsList.length > 0) {
      setSelectedClientId(clientsList[0].id);
      setAmount(clientsList[0].monthly_price || 25000);
      setPaymentType(clientsList[0].is_online && !clientsList[0].is_presencial ? 'online' : 'presencial');
    }
    setError(null);
  }, [preselectedClient, isOpen, clientsList]);

  const handleClientChange = (id: number) => {
    setSelectedClientId(id);
    const found = clientsList.find((c) => c.id === id);
    if (found) {
      if (found.monthly_price) setAmount(found.monthly_price);
      setPaymentType(found.is_online && !found.is_presencial ? 'online' : 'presencial');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) {
      setError('Por favor seleccioná el alumno.');
      return;
    }
    if (!amount || amount <= 0) {
      setError('El monto debe ser mayor a 0.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const conceptPrefix = paymentType === 'online' ? '[Asesoría Online] ' : '[Cuota Presencial] ';
      await onSavePayment({
        userId: Number(selectedClientId),
        amount: Number(amount),
        paymentDate,
        paymentMethod,
        period: paymentDate.substring(0, 7),
        notes: notes ? `${conceptPrefix}${notes}` : conceptPrefix.trim(),
        nextDueDate,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al registrar pago.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar Cobro"
      subtitle="Cobranza general para alumnos presenciales y online"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            {error}
          </div>
        )}

        {/* Tipo de Servicio (Presencial vs Online) */}
        <div>
          <label className="text-xs font-semibold text-slate-400 mb-1.5 block">
            Concepto del Cobro
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPaymentType('presencial')}
              className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                paymentType === 'presencial'
                  ? 'bg-blue-600 text-white border-blue-500 ring-1 ring-blue-400/40'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              <Dumbbell className="w-3.5 h-3.5" />
              <span>Gimnasio Presencial</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentType('online')}
              className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                paymentType === 'online'
                  ? 'bg-cyan-600 text-white border-cyan-500 ring-1 ring-cyan-400/40'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              <Laptop className="w-3.5 h-3.5" />
              <span>Asesoría Online</span>
            </button>
          </div>
        </div>

        {/* Alumno */}
        <div>
          <label className="text-xs font-semibold text-slate-300">Alumno a Cobrar</label>
          {preselectedClient ? (
            <div className="mt-1 p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-white">
                  {preselectedClient.first_name} {preselectedClient.last_name}
                </p>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  {preselectedClient.is_online ? 'Alumno Online' : 'Alumno Presencial'} • {preselectedClient.plan_name || 'Plan'}
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
                {formatCurrency(amount)}
              </span>
            </div>
          ) : (
            <select
              value={selectedClientId}
              onChange={(e) => handleClientChange(Number(e.target.value))}
              className="mt-1 w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:border-blue-500 outline-none"
            >
              <option value="">Seleccionar alumno...</option>
              {clientsList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.first_name} {c.last_name} ({c.is_online ? 'Online' : 'Presencial'})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Monto */}
        <div>
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span>Monto a Cobrar ($)</span>
          </label>
          <input
            type="number"
            required
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="mt-1 w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-2xl font-black text-emerald-400 focus:border-emerald-500 outline-none tracking-tight"
          />
        </div>

        {/* Método de pago */}
        <div>
          <label className="text-xs font-semibold text-slate-400 mb-1.5 block">
            Método de Cobro
          </label>
          <div className="grid grid-cols-2 gap-2">
            {methods.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setPaymentMethod(m)}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                  paymentMethod === m
                    ? 'bg-emerald-600 text-white border-emerald-500 ring-1 ring-emerald-400/40'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                {m} {paymentMethod === m ? '✓' : ''}
              </button>
            ))}
          </div>
        </div>

        {/* Próximo vencimiento automático */}
        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
          <div className="flex items-center space-x-1.5 text-xs text-blue-400 font-semibold">
            <Calendar className="w-4 h-4" />
            <span>Próximo Vencimiento (+30 días)</span>
          </div>
          <input
            type="date"
            required
            value={nextDueDate}
            onChange={(e) => setNextDueDate(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:border-blue-500 outline-none"
          />
          <p className="text-[11px] text-slate-400">
            Al registrar el pago, el alumno queda automáticamente activo y con su período regularizado.
          </p>
        </div>

        {/* Notas */}
        <div>
          <label className="text-xs font-semibold text-slate-300">Detalle / Observaciones (Opcional)</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ej: Mes noviembre, descuento..."
            className="mt-1 w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:border-blue-500 outline-none"
          />
        </div>

        {/* Botón de acción */}
        <button
          type="submit"
          disabled={saving}
          className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base shadow-xl shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center space-x-2"
        >
          <CreditCard className="w-5 h-5" />
          <span>{saving ? 'Registrando...' : 'Confirmar Cobro'}</span>
        </button>
      </form>
    </BottomSheet>
  );
};
