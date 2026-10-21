import React, { useState } from 'react';
import { useAuth } from '../../../shared/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Lock, Mail } from 'lucide-react';
import { Logo } from '../../../shared/components/Logo';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const user = await login(email, password);
      if (user.role === 'ALUMNO') {
        navigate('/app');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Credenciales inválidas.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] flex flex-col justify-center px-4 py-8 safe-top safe-bottom">
      <div className="w-full max-w-sm mx-auto space-y-6">
        {/* Brand & Logo Estiloso */}
        <div className="text-center space-y-3">
          <Logo size="lg" />
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Plataforma Integral de Gestión Presencial & Asesorías Online
          </p>
        </div>

        {/* Login Card */}
        <form
          onSubmit={handleSubmit}
          className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-4"
        >
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-300">Correo Electrónico</label>
            <div className="mt-1 relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-600 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300">Contraseña</label>
            <div className="mt-1 relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-600 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold text-sm shadow-xl shadow-blue-500/25 active:scale-95 transition-all flex items-center justify-center space-x-2 mt-2"
          >
            <span>{loading ? 'Iniciando sesión...' : 'Ingresar a ZGym'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
