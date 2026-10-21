import React, { useEffect, useState } from 'react';
import { User } from '../../../shared/types';
import { clientsAPI, paymentsAPI } from '../../../shared/services/api';
import {
  Search,
  UserPlus,
  Users,
  Phone,
  Mail,
  Dumbbell,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MessageCircle,
  Filter,
  X
} from 'lucide-react';
import { formatCurrency, formatDate, calculateDaysRemaining } from '../../../shared/utils/formatters';
import { buildWhatsAppUrl, getPaymentReminderMessage } from '../../../shared/utils/whatsapp';
import { ClientDetailSheet } from '../components/ClientDetailSheet';
import { ClientFormSheet } from '../components/ClientFormSheet';
import { PaymentSheet } from '../../payments/components/PaymentSheet';
import { useLocation } from 'react-router-dom';

export const ClientsDirectoryPage: React.FC = () => {
  const location = useLocation();
  const [clients, setClients] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'presencial' | 'online' | 'hybrid'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ACTIVO' | 'VENCIDO'>('all');

  // Modales
  const [selectedClient, setSelectedClient] = useState<User | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<User | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentClient, setPaymentClient] = useState<User | null>(null);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const res = await clientsAPI.getAll({ role: 'ALUMNO' });
      if (res?.data?.users) {
        setClients(res.data.users);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Si la URL viene con ?status=VENCIDO
    const params = new URLSearchParams(location.search);
    const st = params.get('status');
    if (st === 'VENCIDO') {
      setStatusFilter('VENCIDO');
    }
    fetchClients();
  }, [location.search]);

  const handleSelectClient = async (client: User) => {
    try {
      const res = await clientsAPI.getById(client.id);
      setSelectedClient(res?.data?.user || client);
      setIsDetailOpen(true);
    } catch {
      setSelectedClient(client);
      setIsDetailOpen(true);
    }
  };

  const handleWhatsApp = (client: User, e: React.MouseEvent) => {
    e.stopPropagation();
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

  const handleSaveClient = async (data: any) => {
    if (clientToEdit) {
      await clientsAPI.update(clientToEdit.id, data);
    } else {
      await clientsAPI.create(data);
    }
    await fetchClients();
    if (selectedClient && clientToEdit && selectedClient.id === clientToEdit.id) {
      const updated = await clientsAPI.getById(clientToEdit.id);
      setSelectedClient(updated?.data?.user || null);
    }
  };

  const handleSavePayment = async (data: any) => {
    await paymentsAPI.create(data);
    await fetchClients();
    if (selectedClient && selectedClient.id === data.userId) {
      const updated = await clientsAPI.getById(data.userId);
      setSelectedClient(updated?.data?.user || null);
    }
  };

  // Filtrado reactivo en memoria
  const filteredClients = clients.filter((c) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const match =
        c.first_name.toLowerCase().includes(q) ||
        (c.last_name && c.last_name.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q));
      if (!match) return false;
    }

    if (typeFilter === 'presencial' && (!c.is_presencial || c.is_online)) return false;
    if (typeFilter === 'online' && (!c.is_online || c.is_presencial)) return false;
    if (typeFilter === 'hybrid' && (!c.is_presencial || !c.is_online)) return false;

    if (statusFilter !== 'all' && c.account_status !== statusFilter) return false;

    return true;
  });

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto pb-28">
      {/* Top Header & New Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Directorio de Alumnos</h2>
          <p className="text-xs text-slate-400">
            {filteredClients.length} de {clients.length} registrados
          </p>
        </div>

        <button
          onClick={() => {
            setClientToEdit(null);
            setIsFormOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-500/20 flex items-center gap-1.5 active:scale-95 transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>Nuevo Alumno</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, teléfono o email..."
          className="w-full pl-10 pr-9 py-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-white placeholder:text-slate-500 focus:border-blue-500 outline-none transition-colors"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Chips Scrollable */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar text-xs">
        <button
          onClick={() => {
            setTypeFilter('all');
            setStatusFilter('all');
          }}
          className={`px-3 py-1.5 rounded-xl font-semibold shrink-0 transition-colors ${
            typeFilter === 'all' && statusFilter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-900 text-slate-400 border border-slate-800'
          }`}
        >
          Todos
        </button>
        <button
          onClick={() => setTypeFilter('presencial')}
          className={`px-3 py-1.5 rounded-xl font-semibold shrink-0 transition-colors ${
            typeFilter === 'presencial'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-900 text-slate-400 border border-slate-800'
          }`}
        >
          Presencial
        </button>
        <button
          onClick={() => setTypeFilter('online')}
          className={`px-3 py-1.5 rounded-xl font-semibold shrink-0 transition-colors ${
            typeFilter === 'online'
              ? 'bg-cyan-600 text-white'
              : 'bg-slate-900 text-slate-400 border border-slate-800'
          }`}
        >
          Online
        </button>
        <button
          onClick={() => setTypeFilter('hybrid')}
          className={`px-3 py-1.5 rounded-xl font-semibold shrink-0 transition-colors ${
            typeFilter === 'hybrid'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-900 text-slate-400 border border-slate-800'
          }`}
        >
          Híbrido
        </button>
        <button
          onClick={() => setStatusFilter(statusFilter === 'VENCIDO' ? 'all' : 'VENCIDO')}
          className={`px-3 py-1.5 rounded-xl font-semibold shrink-0 transition-colors flex items-center gap-1 ${
            statusFilter === 'VENCIDO'
              ? 'bg-rose-600 text-white'
              : 'bg-slate-900 text-rose-400 border border-rose-900/40'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Vencidos</span>
        </button>
      </div>

      {/* Lista de Tarjetas de Alumnos */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Cargando alumnos...
        </div>
      ) : filteredClients.length > 0 ? (
        <div className="space-y-2">
          {filteredClients.map((client) => {
            const daysRemaining = calculateDaysRemaining(client.due_date);
            const isOverdue = daysRemaining < 0;
            const isExpiringSoon = daysRemaining >= 0 && daysRemaining <= 7;

            return (
              <div
                key={client.id}
                onClick={() => handleSelectClient(client)}
                className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 flex items-center justify-between active:scale-[0.985] transition-all cursor-pointer shadow-md"
              >
                {/* Left: Avatar & Info */}
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-700 border border-slate-700 flex items-center justify-center font-bold text-sm text-white shrink-0 shadow-inner">
                    {client.first_name[0]?.toUpperCase() || 'C'}
                    {client.last_name ? client.last_name[0]?.toUpperCase() : ''}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center space-x-1.5">
                      <p className="text-sm font-bold text-white truncate">
                        {client.first_name} {client.last_name}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-slate-400 truncate">
                        {client.plan_name || 'Pase Libre'}
                      </span>
                      {Boolean(client.is_presencial) && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-400">
                          Presencial
                        </span>
                      )}
                      {Boolean(client.is_online) && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400">
                          Online
                        </span>
                      )}
                    </div>

                    {/* Vencimiento / Días */}
                    {client.is_presencial ? (
                      <p
                        className={`text-[11px] font-semibold mt-1 flex items-center gap-1 ${
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
                            Venció ({Math.abs(daysRemaining)}d)
                          </>
                        ) : isExpiringSoon ? (
                          <>
                            <Clock className="w-3 h-3" />
                            Vence en {daysRemaining}d
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            Al día ({daysRemaining}d)
                          </>
                        )}
                      </p>
                    ) : (
                      <p className="text-[11px] text-cyan-400 mt-1">Asesoría Online</p>
                    )}
                  </div>
                </div>

                {/* Right: WhatsApp Button */}
                {client.phone && (
                  <button
                    onClick={(e) => handleWhatsApp(client, e)}
                    title="Enviar WhatsApp"
                    className="p-3 rounded-xl bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/20 transition-all active:scale-90 shrink-0 ml-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
          <Users className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-xs text-slate-400">
            {clients.length === 0
              ? 'Aún no tenés alumnos registrados.'
              : 'No se encontraron alumnos con esos filtros.'}
          </p>
          {clients.length === 0 && (
            <button
              onClick={() => {
                setClientToEdit(null);
                setIsFormOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all active:scale-95"
            >
              Dar de alta primer alumno
            </button>
          )}
        </div>
      )}

      {/* Sheets */}
      <ClientDetailSheet
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        client={selectedClient}
        onEdit={(c) => {
          setClientToEdit(c);
          setIsDetailOpen(false);
          setIsFormOpen(true);
        }}
        onDelete={async (id) => {
          await clientsAPI.delete(id);
          setIsDetailOpen(false);
          await fetchClients();
        }}
        onPay={(c) => {
          setPaymentClient(c);
          setIsPaymentOpen(true);
        }}
      />

      <ClientFormSheet
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveClient}
        clientToEdit={clientToEdit}
      />

      <PaymentSheet
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        onSavePayment={handleSavePayment}
        preselectedClient={paymentClient}
        clientsList={clients}
      />
    </div>
  );
};
