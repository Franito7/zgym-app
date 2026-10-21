import React, { useState, useEffect } from 'react';
import { User } from '../../../shared/types';
import { BottomSheet } from '../../../shared/components/BottomSheet';
import { UserCheck, ShieldCheck, Dumbbell, Calendar, DollarSign, Clock, Phone, Mail, FileText } from 'lucide-react';

const AVAILABLE_HOURS = [
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00',
  '21:00'
];

const DAYS_LABELS = [
  { num: 1, label: 'L', name: 'Lunes' },
  { num: 2, label: 'M', name: 'Martes' },
  { num: 3, label: 'X', name: 'Miércoles' },
  { num: 4, label: 'J', name: 'Jueves' },
  { num: 5, label: 'V', name: 'Viernes' },
];

interface ClientFormSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (clientData: any) => Promise<void>;
  clientToEdit?: User | null;
}

export const ClientFormSheet: React.FC<ClientFormSheetProps> = ({
  isOpen,
  onClose,
  onSave,
  clientToEdit,
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPresencial, setIsPresencial] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [planName, setPlanName] = useState('Pase Libre');
  const [monthlyPrice, setMonthlyPrice] = useState(25000);
  const [dueDate, setDueDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('12:00');
  const [scheduleDays, setScheduleDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (clientToEdit) {
      setFirstName(clientToEdit.first_name || '');
      setLastName(clientToEdit.last_name || '');
      setPhone(clientToEdit.phone || '');
      setEmail(clientToEdit.email || '');
      setIsPresencial(Boolean(clientToEdit.is_presencial));
      setIsOnline(Boolean(clientToEdit.is_online));
      setPlanName(clientToEdit.plan_name || 'Pase Libre');
      setMonthlyPrice(clientToEdit.monthly_price || 25000);
      setDueDate(clientToEdit.due_date ? clientToEdit.due_date.split('T')[0] : '');
      setScheduleTime(clientToEdit.schedule_time || '12:00');
      try {
        const days = typeof clientToEdit.schedule_days === 'string'
          ? JSON.parse(clientToEdit.schedule_days)
          : clientToEdit.schedule_days || [1, 2, 3, 4, 5];
        setScheduleDays(Array.isArray(days) ? days.filter(d => d >= 1 && d <= 5) : [1, 2, 3, 4, 5]);
      } catch {
        setScheduleDays([1, 2, 3, 4, 5]);
      }
      setNotes(clientToEdit.notes || '');
    } else {
      // Default: nuevo alumno a 30 días, horario desde las 12hs de L a V
      setFirstName('');
      setLastName('');
      setPhone('');
      setEmail('');
      setPassword('');
      setIsPresencial(true);
      setIsOnline(false);
      setPlanName('Pase Libre');
      setMonthlyPrice(25000);
      const d = new Date();
      d.setDate(d.getDate() + 30);
      setDueDate(d.toISOString().split('T')[0]);
      setScheduleTime('12:00');
      setScheduleDays([1, 2, 3, 4, 5]);
      setNotes('');
    }
    setError(null);
  }, [clientToEdit, isOpen]);

  const toggleDay = (day: number) => {
    if (scheduleDays.includes(day)) {
      setScheduleDays(scheduleDays.filter((d) => d !== day));
    } else {
      setScheduleDays([...scheduleDays, day].sort());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) {
      setError('Por favor ingresá al menos el nombre del alumno.');
      return;
    }
    if (isOnline && !email.trim()) {
      setError('Para activar asesoría online se requiere un correo electrónico.');
      return;
    }

    setSaving(true);
    setError(null);

    // Contraseña inicial: si es online y no se especifica, por defecto ZGym1234
    const finalPassword = isOnline
      ? (password.trim() || 'ZGym1234')
      : (password.trim() || undefined);

    try {
      await onSave({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        email: email.trim() || null,
        password: finalPassword,
        isPresencial,
        isOnline,
        planName,
        monthlyPrice: Number(monthlyPrice),
        dueDate: isPresencial ? dueDate : null,
        scheduleTime,
        scheduleDays,
        notes: notes.trim(),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar alumno.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={clientToEdit ? 'Editar Alumno' : 'Nuevo Alumno'}
      subtitle="Ficha unificada presencial / online"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            {error}
          </div>
        )}

        {/* Modalidad Selector (Presencial / Online) */}
        <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Modalidad del Alumno
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setIsPresencial(!isPresencial)}
              className={`p-3 rounded-xl flex items-center justify-center space-x-2 text-xs font-semibold border transition-all ${
                isPresencial
                  ? 'bg-blue-600/20 text-blue-400 border-blue-500/40 ring-1 ring-blue-500/30'
                  : 'bg-slate-800/40 text-slate-400 border-slate-700'
              }`}
            >
              <Dumbbell className="w-4 h-4" />
              <span>Presencial {isPresencial ? '✓' : ''}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsOnline(!isOnline)}
              className={`p-3 rounded-xl flex items-center justify-center space-x-2 text-xs font-semibold border transition-all ${
                isOnline
                  ? 'bg-cyan-600/20 text-cyan-400 border-cyan-500/40 ring-1 ring-cyan-500/30'
                  : 'bg-slate-800/40 text-slate-400 border-slate-700'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Online {isOnline ? '✓' : ''}</span>
            </button>
          </div>
        </div>

        {/* Nombre y Apellido */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-medium text-slate-300">Nombre *</label>
            <input
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Juan"
              className="mt-1 w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-300">Apellido</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Pérez"
              className="mt-1 w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:border-blue-500 outline-none"
            />
          </div>
        </div>

        {/* Teléfono / WhatsApp */}
        <div>
          <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-emerald-400" />
            <span>Teléfono / WhatsApp (Vital para cobros rápidos)</span>
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+54 9 11 2345-6789"
            className="mt-1 w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:border-blue-500 outline-none"
          />
        </div>

        {/* Si es Online o tiene acceso */}
        {isOnline && (
          <div className="p-3.5 rounded-2xl bg-cyan-950/20 border border-cyan-800/30 space-y-3">
            <div className="flex items-center space-x-1.5 text-xs text-cyan-400 font-semibold">
              <Mail className="w-4 h-4" />
              <span>Acceso del Alumno a la Plataforma Online</span>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-300">Correo Electrónico *</label>
              <input
                type="email"
                required={isOnline}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="juan@gmail.com"
                className="mt-1 w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:border-cyan-500 outline-none"
              />
            </div>
            {!clientToEdit && (
              <div>
                <label className="text-xs font-medium text-slate-300">Contraseña inicial</label>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Por defecto: ZGym1234"
                  className="mt-1 w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:border-cyan-500 outline-none"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Si no ingresás una contraseña, se configurará <span className="text-cyan-400 font-bold">ZGym1234</span> automáticamente.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Sección Presencial */}
        {isPresencial && (
          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="flex items-center space-x-1.5 text-xs text-blue-400 font-semibold">
              <Dumbbell className="w-4 h-4" />
              <span>Membresía & Asistencia en Gimnasio</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-slate-300">Plan</label>
                <select
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  className="mt-1 w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:border-blue-500 outline-none"
                >
                  <option value="Pase Libre">Pase Libre</option>
                  <option value="3 Días / Sem">3 Días / Sem</option>
                  <option value="2 Días / Sem">2 Días / Sem</option>
                  <option value="Personalizado">Personalizado</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300">Precio Mensual ($)</label>
                <input
                  type="number"
                  value={monthlyPrice}
                  onChange={(e) => setMonthlyPrice(Number(e.target.value))}
                  className="mt-1 w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-slate-300">Vencimiento</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="mt-1 w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  <span>Horario Habitual</span>
                </label>
                <select
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="mt-1 w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:border-blue-500 outline-none font-medium"
                >
                  {AVAILABLE_HOURS.map((hour) => (
                    <option key={hour} value={hour}>
                      {hour} hs
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Días de asistencia habitual: Lunes a Viernes */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-400">
                  Días de Asistencia (Lunes a Viernes)
                </label>
                <span className="text-[10px] text-blue-400 font-semibold">
                  {scheduleDays.length} días seleccionados
                </span>
              </div>
              <div className="flex gap-1.5">
                {DAYS_LABELS.map((d) => (
                  <button
                    key={d.num}
                    type="button"
                    onClick={() => toggleDay(d.num)}
                    title={d.name}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                      scheduleDays.includes(d.num)
                        ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Notas u observaciones */}
        <div>
          <label className="text-xs font-medium text-slate-300">Notas / Observaciones</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Alergias, objetivos, lesiones..."
            className="mt-1 w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:border-blue-500 outline-none"
          />
        </div>

        {/* Botón de guardado grande para pulgar */}
        <button
          type="submit"
          disabled={saving}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold text-sm shadow-xl shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center space-x-2"
        >
          <span>{saving ? 'Guardando...' : clientToEdit ? 'Actualizar Alumno' : 'Guardar Nuevo Alumno'}</span>
        </button>
      </form>
    </BottomSheet>
  );
};
