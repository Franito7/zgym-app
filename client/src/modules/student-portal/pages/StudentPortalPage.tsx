import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../shared/hooks/useAuth';
import { routinesAPI, releasesAPI, calendarAPI } from '../../../shared/services/api';
import {
  Dumbbell,
  Video,
  FileText,
  Calendar,
  ExternalLink,
  LogOut,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { formatDate } from '../../../shared/utils/formatters';
import { useNavigate } from 'react-router-dom';

export const StudentPortalPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [routines, setRoutines] = useState<any[]>([]);
  const [content, setContent] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStudentData = async () => {
      try {
        const [rRes, cRes, eRes] = await Promise.all([
          routinesAPI.getMyRoutines().catch(() => ({ data: { routines: [] } })),
          releasesAPI.getMyContent().catch(() => ({ data: { content: [] } })),
          calendarAPI.getMyEvents().catch(() => ({ data: { events: [] } })),
        ]);
        setRoutines(rRes?.data?.routines || []);
        setContent(cRes?.data?.content || []);
        setEvents(eRes?.data?.events || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadStudentData();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const upcomingMeet = events.find((e) => e.status !== 'CANCELADO');

  return (
    <div className="min-h-screen bg-[#07090e] p-4 max-w-lg mx-auto pb-12 safe-top safe-bottom space-y-5">
      {/* Header Alumno */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center font-bold text-white shadow-md">
            {(user?.first_name?.[0] || 'A').toUpperCase()}
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">
              HOLA, {user?.first_name?.toUpperCase() || 'ALUMNO'}
            </h1>
            <p className="text-[11px] text-cyan-400 font-semibold">Tu Espacio de Entrenamiento ZGym</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          title="Salir"
          className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Próxima Sesión Online */}
      {upcomingMeet && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/40 to-slate-900 border border-blue-800/40 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Próxima Cita / Meet
            </span>
            <span className="text-[11px] text-slate-400">{formatDate(upcomingMeet.event_date)}</span>
          </div>

          <h3 className="text-sm font-bold text-white">{upcomingMeet.title}</h3>

          {upcomingMeet.meet_url && (
            <a
              href={upcomingMeet.meet_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Ingresar a la Meet</span>
            </a>
          )}
        </div>
      )}

      {/* Tu Rutina de Entrenamiento */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Dumbbell className="w-4 h-4 text-cyan-400" />
          <span>Mi Plan de Entrenamiento</span>
        </h2>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">Cargando rutina...</div>
        ) : routines.length > 0 ? (
          routines.map((r) => (
            <div key={r.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div>
                <h3 className="text-base font-bold text-white">{r.title}</h3>
                <p className="text-xs text-slate-400 mt-1">{r.description || 'Seguí las indicaciones del entrenador'}</p>
              </div>

              {r.exercises && r.exercises.length > 0 ? (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  {r.exercises.map((ex: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-xs font-bold text-white">{ex.title}</p>
                        <p className="text-[11px] text-slate-400">
                          {ex.sets} series x {ex.reps} • {ex.day_of_week}
                        </p>
                      </div>
                      {ex.video_url && (
                        <a
                          href={ex.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg bg-rose-600/20 text-rose-400 hover:bg-rose-600 hover:text-white"
                        >
                          <Video className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">Ejercicios en preparación por tu coach.</p>
              )}
            </div>
          ))
        ) : (
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
            <p className="text-xs text-slate-400">Tu entrenador te asignará una rutina en breve.</p>
          </div>
        )}
      </div>

      {/* Biblioteca de Recursos (Videos & PDFs) */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-indigo-400" />
          <span>Contenidos & Auditorías</span>
        </h2>

        {content.length > 0 ? (
          <div className="space-y-2">
            {content.map((c) => (
              <div
                key={c.id}
                className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                    {c.media_type === 'VIDEO' ? <Video className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">{c.media_title}</p>
                    <p className="text-[10px] text-slate-400">{formatDate(c.release_date)}</p>
                  </div>
                </div>

                {c.media_url && (
                  <a
                    href={c.media_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 text-xs font-semibold hover:text-white flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Abrir</span>
                  </a>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
            <p className="text-xs text-slate-400">No hay documentos liberados todavía.</p>
          </div>
        )}
      </div>
    </div>
  );
};
