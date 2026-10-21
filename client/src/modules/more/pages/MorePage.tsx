import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../shared/hooks/useAuth';
import {
  Download,
  Smartphone,
  Shield,
  KeyRound,
  LogOut,
  Dumbbell,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BottomSheet } from '../../../shared/components/BottomSheet';
import { authAPI, clientsAPI, paymentsAPI } from '../../../shared/services/api';

export const MorePage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [pwdMsg, setPwdMsg] = useState<string | null>(null);

  useEffect(() => {
    // Escuchar evento de instalación PWA
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }
  }, []);

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      alert('Para instalar en Chrome: tocá el menú de 3 puntos (⋮) arriba a la derecha y seleccioná "Instalar aplicación" o "Agregar a la pantalla principal".');
    }
  };

  const handleExportBackup = async () => {
    try {
      const [cRes, pRes] = await Promise.all([
        clientsAPI.getAll(),
        paymentsAPI.getAll()
      ]);
      const data = {
        exportedAt: new Date().toISOString(),
        clients: cRes?.data?.users || [],
        payments: pRes?.data?.payments || []
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `zgym-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error al exportar respaldo:', err);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg(null);
    try {
      await authAPI.changePassword({ currentPassword: currentPwd, newPassword: newPwd });
      setPwdMsg('¡Contraseña actualizada con éxito!');
      setCurrentPwd('');
      setNewPwd('');
      setTimeout(() => setIsPasswordOpen(false), 1500);
    } catch (err: any) {
      setPwdMsg(err.message || 'Error al cambiar contraseña.');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto pb-28">
      {/* Profile Card */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center space-x-3.5">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-xl font-bold text-white shadow-lg shadow-blue-500/20">
          {(user?.first_name?.[0] || 'C').toUpperCase()}
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-bold text-white">
              {user?.first_name} {user?.last_name || ''}
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-cyan-400 border border-blue-500/30">
              {user?.role || 'COACH'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{user?.email || 'Entrenador Administrador'}</p>
        </div>
      </div>

      {/* Acciones del Sistema */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
          Plataforma & Dispositivo
        </span>

        {/* Instalar PWA */}
        <button
          onClick={handleInstallPWA}
          className="w-full p-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 flex items-center justify-between active:scale-[0.98] transition-all text-left"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center font-bold">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Instalar como App (PWA)</p>
              <p className="text-xs text-slate-400">
                {isInstalled ? 'Aplicación ya instalada ✓' : 'Acceso directo en pantalla de inicio'}
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-cyan-400">
            {isInstalled ? 'Lista' : 'Instalar'}
          </span>
        </button>

        {/* Respaldo de Base de Datos */}
        <button
          onClick={handleExportBackup}
          className="w-full p-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 flex items-center justify-between active:scale-[0.98] transition-all text-left"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Descargar Respaldo JSON</p>
              <p className="text-xs text-slate-400">Exportar todos los alumnos y pagos</p>
            </div>
          </div>
          <span className="text-xs font-bold text-blue-400">Descargar</span>
        </button>

        {/* Cambiar Contraseña */}
        <button
          onClick={() => setIsPasswordOpen(true)}
          className="w-full p-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 flex items-center justify-between active:scale-[0.98] transition-all text-left"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center font-bold">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Seguridad y Clave</p>
              <p className="text-xs text-slate-400">Cambiar contraseña de acceso</p>
            </div>
          </div>
          <span className="text-xs font-bold text-amber-400">Modificar</span>
        </button>
      </div>

      {/* Cerrar Sesión */}
      <button
        onClick={handleLogout}
        className="w-full p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold text-sm flex items-center justify-center space-x-2 active:scale-95 transition-all mt-6"
      >
        <LogOut className="w-4 h-4" />
        <span>Cerrar Sesión</span>
      </button>

      {/* Modal Cambiar Clave */}
      <BottomSheet
        isOpen={isPasswordOpen}
        onClose={() => setIsPasswordOpen(false)}
        title="Cambiar Contraseña"
      >
        <form onSubmit={handleChangePassword} className="space-y-4">
          {pwdMsg && (
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold">
              {pwdMsg}
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-300">Contraseña Actual</label>
            <input
              type="password"
              required
              value={currentPwd}
              onChange={(e) => setCurrentPwd(e.target.value)}
              className="mt-1 w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:border-amber-500 outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300">Nueva Contraseña (min. 6 caracteres)</label>
            <input
              type="password"
              required
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              className="mt-1 w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:border-amber-500 outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm shadow-xl shadow-amber-600/20 active:scale-95 transition-all"
          >
            Actualizar Contraseña
          </button>
        </form>
      </BottomSheet>
    </div>
  );
};
