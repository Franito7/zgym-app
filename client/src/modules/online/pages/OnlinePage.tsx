import React, { useEffect, useState } from 'react';
import { Routine, MediaResource, CalendarEvent, User, Exercise, Category } from '../../../shared/types';
import {
  routinesAPI,
  mediaAPI,
  calendarAPI,
  clientsAPI,
  releasesAPI,
  exercisesAPI,
  categoriesAPI,
} from '../../../shared/services/api';
import {
  Dumbbell,
  BookOpen,
  Calendar,
  Video,
  FileText,
  Plus,
  ExternalLink,
  Trash2,
  CheckCircle2,
  Users,
  Play,
  Upload,
  Link as LinkIcon,
  ChevronDown,
  ChevronUp,
  X,
  Layers,
  Sparkles
} from 'lucide-react';
import { formatDate } from '../../../shared/utils/formatters';
import { BottomSheet } from '../../../shared/components/BottomSheet';

export const OnlinePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'rutinas' | 'ejercicios' | 'biblioteca' | 'meets'>('rutinas');
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [mediaList, setMediaList] = useState<MediaResource[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [clients, setClients] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Expansión de rutinas en lista
  const [expandedRoutineId, setExpandedRoutineId] = useState<number | null>(null);

  // Reproductor de video
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);
  const [activeVideoTitle, setActiveVideoTitle] = useState<string>('');

  // -------------------------------------------------------------
  // MODAL 1: CONSTRUCTOR DE RUTINA CON EJERCICIOS
  // -------------------------------------------------------------
  const [isNewRoutineOpen, setIsNewRoutineOpen] = useState(false);
  const [routineTitle, setRoutineTitle] = useState('');
  const [routineDesc, setRoutineDesc] = useState('');
  const [routineExercises, setRoutineExercises] = useState<Array<{
    exerciseId: number;
    title: string;
    dayOfWeek: string;
    sets: number;
    reps: string;
    notes: string;
  }>>([]);
  const [selectedExIdToAdd, setSelectedExIdToAdd] = useState<number | ''>('');
  const [routineSaving, setRoutineSaving] = useState(false);

  // -------------------------------------------------------------
  // MODAL 2: CREAR EJERCICIO
  // -------------------------------------------------------------
  const [isNewExerciseOpen, setIsNewExerciseOpen] = useState(false);
  const [exTitle, setExTitle] = useState('');
  const [exCategory, setExCategory] = useState<number | ''>('');
  const [exDesc, setExDesc] = useState('');
  const [exVideoMode, setExVideoMode] = useState<'BIBLIO' | 'URL' | 'FILE'>('BIBLIO');
  const [exVideoUrl, setExVideoUrl] = useState('');
  const [selectedBiblioId, setSelectedBiblioId] = useState<number | ''>('');
  const [exFile, setExFile] = useState<File | null>(null);
  const [exSaving, setExSaving] = useState(false);

  // -------------------------------------------------------------
  // MODAL 3: SUBIR A BIBLIOTECA
  // -------------------------------------------------------------
  const [isNewMediaOpen, setIsNewMediaOpen] = useState(false);
  const [mediaTitle, setMediaTitle] = useState('');
  const [mediaDesc, setMediaDesc] = useState('');
  const [mediaType, setMediaType] = useState<'VIDEO' | 'PDF'>('VIDEO');
  const [mediaUploadMode, setMediaUploadMode] = useState<'FILE' | 'URL'>('FILE');
  const [mediaUrlInput, setMediaUrlInput] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaSaving, setMediaSaving] = useState(false);

  // -------------------------------------------------------------
  // MODAL 4: AGENDAR MEET / CITA ONLINE
  // -------------------------------------------------------------
  const [isNewMeetOpen, setIsNewMeetOpen] = useState(false);
  const [meetTitle, setMeetTitle] = useState('Auditoría Online de Seguimiento');
  const [meetUserId, setMeetUserId] = useState<number | ''>('');
  const [meetDate, setMeetDate] = useState('');
  const [meetType, setMeetType] = useState<'MEET' | 'AUDITORIA' | 'CONTROL' | 'ENTRENAMIENTO'>('MEET');
  const [meetUrl, setMeetUrl] = useState('https://meet.google.com/new');
  const [meetNotes, setMeetNotes] = useState('');
  const [meetSaving, setMeetSaving] = useState(false);

  // -------------------------------------------------------------
  // MODAL 5: ASIGNAR RUTINA A ALUMNO
  // -------------------------------------------------------------
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedRoutineToAssign, setSelectedRoutineToAssign] = useState<Routine | null>(null);
  const [assignUserId, setAssignUserId] = useState<number | ''>('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rRes, eRes, cRes, mRes, evRes, clRes] = await Promise.all([
        routinesAPI.getAll(),
        exercisesAPI.getAll(),
        categoriesAPI.getAll().catch(() => ({ data: { categories: [] } })),
        mediaAPI.getAll(),
        calendarAPI.getAll(),
        clientsAPI.getAll({ role: 'ALUMNO' }),
      ]);
      setRoutines(rRes?.data?.routines || []);
      setExercises(eRes?.data?.exercises || []);
      setCategories(cRes?.data?.categories || []);
      setMediaList(mRes?.data?.media || []);
      setEvents(evRes?.data?.events || []);
      setClients(clRes?.data?.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Default meet date: tomorrow at 18:00
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(18, 0, 0, 0);
    setMeetDate(d.toISOString().slice(0, 16));
  }, []);

  // Utilidad de embed para Youtube
  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('youtube.com/watch?v=')) {
      const id = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${id}`;
    }
    if (url.includes('youtu.be/')) {
      const id = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${id}`;
    }
    return url;
  };

  // -------------------------------------------------------------
  // ACCIONES RUTINAS
  // -------------------------------------------------------------
  const handleAddExerciseToRoutine = () => {
    if (!selectedExIdToAdd) return;
    const found = exercises.find((e) => e.id === Number(selectedExIdToAdd));
    if (!found) return;

    setRoutineExercises((prev) => [
      ...prev,
      {
        exerciseId: found.id,
        title: found.title,
        dayOfWeek: `Día ${prev.length > 0 ? prev[prev.length - 1].dayOfWeek.replace('Día ', '') : '1'}`,
        sets: 4,
        reps: '10-12',
        notes: '',
      },
    ]);
    setSelectedExIdToAdd('');
  };

  const handleRemoveExerciseFromRoutine = (index: number) => {
    setRoutineExercises((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateExerciseRow = (index: number, field: string, value: any) => {
    setRoutineExercises((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  const handleCreateRoutine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!routineTitle.trim()) return;

    setRoutineSaving(true);
    try {
      await routinesAPI.create({
        title: routineTitle.trim(),
        description: routineDesc.trim(),
        exercises: routineExercises.map((ex, i) => ({
          exerciseId: ex.exerciseId,
          dayOfWeek: ex.dayOfWeek || 'Día 1',
          sets: Number(ex.sets) || 3,
          reps: ex.reps || '10-12',
          notes: ex.notes || '',
          orderIndex: i + 1,
        })),
      });
      setRoutineTitle('');
      setRoutineDesc('');
      setRoutineExercises([]);
      setIsNewRoutineOpen(false);
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Error al guardar rutina.');
    } finally {
      setRoutineSaving(false);
    }
  };

  const handleDeleteRoutine = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('¿Deseás eliminar esta rutina?')) {
      await routinesAPI.delete(id);
      await fetchData();
    }
  };

  const handleAssignRoutineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignUserId || !selectedRoutineToAssign) return;
    try {
      await releasesAPI.assign({
        userId: Number(assignUserId),
        routineId: selectedRoutineToAssign.id,
        releaseDate: new Date().toISOString(),
      });
      setIsAssignOpen(false);
      setSelectedRoutineToAssign(null);
      alert('Rutina asignada exitosamente al alumno online.');
    } catch (err: any) {
      alert(err.message || 'Error al asignar rutina.');
    }
  };

  // -------------------------------------------------------------
  // ACCIONES EJERCICIOS
  // -------------------------------------------------------------
  const handleCreateExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exTitle.trim()) return;

    setExSaving(true);
    try {
      let finalVideoUrl = '';

      if (exVideoMode === 'BIBLIO' && selectedBiblioId) {
        const found = mediaList.find((m) => m.id === Number(selectedBiblioId));
        if (found) finalVideoUrl = found.url;
      } else if (exVideoMode === 'URL') {
        finalVideoUrl = exVideoUrl.trim();
      } else if (exVideoMode === 'FILE' && exFile) {
        const formData = new FormData();
        formData.append('file', exFile);
        const upRes = await mediaAPI.uploadFile(formData);
        finalVideoUrl = upRes?.data?.url || '';
      }

      await exercisesAPI.create({
        title: exTitle.trim(),
        description: exDesc.trim(),
        categoryId: exCategory ? Number(exCategory) : null,
        videoUrl: finalVideoUrl,
      });

      setExTitle('');
      setExDesc('');
      setExCategory('');
      setExVideoUrl('');
      setExFile(null);
      setIsNewExerciseOpen(false);
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Error al crear ejercicio.');
    } finally {
      setExSaving(false);
    }
  };

  // -------------------------------------------------------------
  // ACCIONES BIBLIOTECA
  // -------------------------------------------------------------
  const handleUploadMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaTitle.trim()) return;

    setMediaSaving(true);
    try {
      let fileUrl = '';
      let fileSize = 0;

      if (mediaUploadMode === 'FILE' && mediaFile) {
        const formData = new FormData();
        formData.append('file', mediaFile);
        const upRes = await mediaAPI.uploadFile(formData);
        fileUrl = upRes?.data?.url || '';
        fileSize = upRes?.data?.sizeBytes || 0;
      } else if (mediaUploadMode === 'URL') {
        fileUrl = mediaUrlInput.trim();
      }

      if (!fileUrl) {
        alert('Por favor seleccioná un archivo o ingresá una URL válida.');
        setMediaSaving(false);
        return;
      }

      await mediaAPI.create({
        title: mediaTitle.trim(),
        description: mediaDesc.trim(),
        type: mediaType,
        url: fileUrl,
        fileSizeBytes: fileSize,
      });

      setMediaTitle('');
      setMediaDesc('');
      setMediaUrlInput('');
      setMediaFile(null);
      setIsNewMediaOpen(false);
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Error al registrar recurso en la biblioteca.');
    } finally {
      setMediaSaving(false);
    }
  };

  const handleDeleteMedia = async (id: number) => {
    if (window.confirm('¿Deseás eliminar este recurso de la biblioteca?')) {
      await mediaAPI.delete(id);
      await fetchData();
    }
  };

  // -------------------------------------------------------------
  // ACCIONES MEETS
  // -------------------------------------------------------------
  const handleCreateMeet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetTitle.trim() || !meetUserId || !meetDate) return;

    setMeetSaving(true);
    try {
      await calendarAPI.create({
        userId: Number(meetUserId),
        title: meetTitle.trim(),
        eventDate: meetDate,
        type: meetType,
        meetUrl: meetUrl.trim(),
        notes: meetNotes.trim(),
      });

      setMeetTitle('Auditoría Online de Seguimiento');
      setMeetUserId('');
      setMeetNotes('');
      setIsNewMeetOpen(false);
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Error al agendar cita online.');
    } finally {
      setMeetSaving(false);
    }
  };

  const handleDeleteEvent = async (id: number) => {
    if (window.confirm('¿Deseás cancelar esta cita de Meet?')) {
      await calendarAPI.delete(id);
      await fetchData();
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto pb-28">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Gestión Online</h2>
          <p className="text-xs text-slate-400">Rutinas con ejercicios, biblioteca y videollamadas</p>
        </div>

        {/* Botón dinámico según la pestaña activa */}
        {activeTab === 'rutinas' && (
          <button
            onClick={() => setIsNewRoutineOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md shadow-cyan-600/20 flex items-center gap-1.5 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Rutina</span>
          </button>
        )}
        {activeTab === 'ejercicios' && (
          <button
            onClick={() => setIsNewExerciseOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/20 flex items-center gap-1.5 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Ejercicio</span>
          </button>
        )}
        {activeTab === 'biblioteca' && (
          <button
            onClick={() => setIsNewMediaOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center gap-1.5 active:scale-95 transition-all"
          >
            <Upload className="w-4 h-4" />
            <span>Subir Video/PDF</span>
          </button>
        )}
        {activeTab === 'meets' && (
          <button
            onClick={() => setIsNewMeetOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1.5 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Agendar Meet</span>
          </button>
        )}
      </div>

      {/* Selector de Pestañas Móvil */}
      <div className="grid grid-cols-4 p-1 rounded-2xl bg-slate-900 border border-slate-800 text-[11px]">
        <button
          onClick={() => setActiveTab('rutinas')}
          className={`py-2 rounded-xl font-bold transition-all flex flex-col items-center justify-center ${
            activeTab === 'rutinas' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Dumbbell className="w-4 h-4 mb-0.5" />
          <span>Rutinas</span>
        </button>

        <button
          onClick={() => setActiveTab('ejercicios')}
          className={`py-2 rounded-xl font-bold transition-all flex flex-col items-center justify-center ${
            activeTab === 'ejercicios' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4 mb-0.5" />
          <span>Ejercicios</span>
        </button>

        <button
          onClick={() => setActiveTab('biblioteca')}
          className={`py-2 rounded-xl font-bold transition-all flex flex-col items-center justify-center ${
            activeTab === 'biblioteca' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4 mb-0.5" />
          <span>Biblioteca</span>
        </button>

        <button
          onClick={() => setActiveTab('meets')}
          className={`py-2 rounded-xl font-bold transition-all flex flex-col items-center justify-center ${
            activeTab === 'meets' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4 mb-0.5" />
          <span>Meets</span>
        </button>
      </div>

      {/* =============================================================
          PESTAÑA 1: RUTINAS COMPUESTAS POR EJERCICIOS
      ============================================================= */}
      {activeTab === 'rutinas' && (
        <div className="space-y-3">
          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400">Cargando planes de entrenamiento...</div>
          ) : routines.length > 0 ? (
            routines.map((r) => {
              const isExpanded = expandedRoutineId === r.id;
              const exCount = r.exercises?.length || 0;

              return (
                <div
                  key={r.id}
                  className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white tracking-tight">{r.title}</h3>
                      {r.description && (
                        <p className="text-xs text-slate-400 mt-0.5">{r.description}</p>
                      )}
                      <span className="inline-block text-[11px] font-semibold text-cyan-400 mt-1">
                        {exCount} {exCount === 1 ? 'ejercicio configurado' : 'ejercicios configurados'}
                      </span>
                    </div>

                    <button
                      onClick={(e) => handleDeleteRoutine(r.id, e)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Ejercicios Expandibles */}
                  {exCount > 0 && (
                    <div className="pt-2 border-t border-slate-800/80">
                      <button
                        onClick={() => setExpandedRoutineId(isExpanded ? null : r.id)}
                        className="text-xs text-slate-400 hover:text-white font-semibold flex items-center gap-1"
                      >
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        <span>{isExpanded ? 'Ocultar ejercicios' : 'Ver desglose de ejercicios'}</span>
                      </button>

                      {isExpanded && (
                        <div className="mt-2 space-y-2 pt-2 border-t border-slate-800/40">
                          {r.exercises?.map((ex, i) => (
                            <div
                              key={i}
                              className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                            >
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-white">{ex.title || `Ejercicio #${i + 1}`}</span>
                                  <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                    {ex.day_of_week}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                  {ex.sets} series x {ex.reps} {ex.notes ? `• ${ex.notes}` : ''}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Acciones de Rutina */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-end">
                    <button
                      onClick={() => {
                        setSelectedRoutineToAssign(r);
                        setIsAssignOpen(true);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600 text-cyan-400 hover:text-white border border-cyan-500/30 text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Asignar a Alumno</span>
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
              <Dumbbell className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400">No hay rutinas creadas todavía.</p>
              <button
                onClick={() => setIsNewRoutineOpen(true)}
                className="px-4 py-2 rounded-xl bg-cyan-600 text-white text-xs font-bold"
              >
                Crear Primera Rutina con Ejercicios
              </button>
            </div>
          )}
        </div>
      )}

      {/* =============================================================
          PESTAÑA 2: CATÁLOGO DE EJERCICIOS CON VIDEO
      ============================================================= */}
      {activeTab === 'ejercicios' && (
        <div className="space-y-3">
          {exercises.length > 0 ? (
            exercises.map((ex) => (
              <div
                key={ex.id}
                className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-bold text-white">{ex.title}</h4>
                    {ex.category_name && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                        {ex.category_name}
                      </span>
                    )}
                  </div>
                  {ex.description && <p className="text-xs text-slate-400">{ex.description}</p>}
                </div>

                {ex.video_url && (
                  <button
                    onClick={() => {
                      setActiveVideoUrl(ex.video_url || '');
                      setActiveVideoTitle(ex.title);
                    }}
                    className="p-2.5 rounded-xl bg-rose-600/20 text-rose-400 hover:bg-rose-600 hover:text-white border border-rose-500/30 transition-all flex items-center gap-1 shrink-0 ml-3"
                  >
                    <Play className="w-4 h-4 fill-current" />
                  </button>
                )}
              </div>
            ))
          ) : (
            <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-2">
              <p className="text-xs text-slate-400">Aún no hay ejercicios cargados en el catálogo.</p>
              <button
                onClick={() => setIsNewExerciseOpen(true)}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
              >
                Agregar Ejercicio
              </button>
            </div>
          )}
        </div>
      )}

      {/* =============================================================
          PESTAÑA 3: BIBLIOTECA MULTIMEDIA (VIDEOS & AUDITORÍAS PDF)
      ============================================================= */}
      {activeTab === 'biblioteca' && (
        <div className="space-y-3">
          {mediaList.length > 0 ? (
            mediaList.map((m) => (
              <div
                key={m.id}
                className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-white shrink-0 ${
                      m.type === 'VIDEO' ? 'bg-rose-600/20 text-rose-400 border border-rose-500/30' : 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                    }`}
                  >
                    {m.type === 'VIDEO' ? <Video className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{m.title}</p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {m.type} {m.description ? `• ${m.description}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0 ml-2">
                  {m.type === 'VIDEO' ? (
                    <button
                      onClick={() => {
                        setActiveVideoUrl(m.url);
                        setActiveVideoTitle(m.title);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 text-xs font-bold flex items-center gap-1"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Ver</span>
                    </button>
                  ) : (
                    <a
                      href={m.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Abrir</span>
                    </a>
                  )}

                  <button
                    onClick={() => handleDeleteMedia(m.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-2">
              <Upload className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400">Sin recursos en la biblioteca.</p>
              <button
                onClick={() => setIsNewMediaOpen(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
              >
                Subir Video o PDF
              </button>
            </div>
          )}
        </div>
      )}

      {/* =============================================================
          PESTAÑA 4: MEETS & CITAS ONLINE
      ============================================================= */}
      {activeTab === 'meets' && (
        <div className="space-y-3">
          {events.length > 0 ? (
            events.map((e) => (
              <div
                key={e.id}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5 shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {e.type}
                      </span>
                      <h4 className="text-sm font-bold text-white">{e.title}</h4>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Alumno: <strong className="text-slate-200">{e.first_name} {e.last_name}</strong>
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Fecha: {formatDate(e.event_date)}
                    </p>
                  </div>

                  <button
                    onClick={() => handleDeleteEvent(e.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {e.notes && <p className="text-xs text-slate-400 italic bg-slate-950 p-2 rounded-xl">{e.notes}</p>}

                {e.meet_url && (
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 truncate max-w-[200px]">{e.meet_url}</span>
                    <a
                      href={e.meet_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all shadow-md shadow-emerald-600/20"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Ingresar al Meet</span>
                    </a>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-2">
              <Calendar className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400">No hay citas online agendadas.</p>
              <button
                onClick={() => setIsNewMeetOpen(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
              >
                Agendar Primera Meet
              </button>
            </div>
          )}
        </div>
      )}

      {/* =============================================================
          MODAL 1: CONSTRUCTOR DE RUTINAS CON EJERCICIOS
      ============================================================= */}
      <BottomSheet
        isOpen={isNewRoutineOpen}
        onClose={() => setIsNewRoutineOpen(false)}
        title="Constructor de Rutina"
        subtitle="Armá la rutina agregando ejercicios y series"
        maxHeight="max-h-[95vh]"
      >
        <form onSubmit={handleCreateRoutine} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300">Título de la Rutina *</label>
            <input
              type="text"
              required
              value={routineTitle}
              onChange={(e) => setRoutineTitle(e.target.value)}
              placeholder="Ej: Hipertrofia Fase 1 (Torso / Pierna)"
              className="mt-1 w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:border-cyan-500 outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300">Pautas / Objetivos</label>
            <input
              type="text"
              value={routineDesc}
              onChange={(e) => setRoutineDesc(e.target.value)}
              placeholder="Ej: Frecuencia 4 días, descansos de 90s..."
              className="mt-1 w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:border-cyan-500 outline-none"
            />
          </div>

          {/* Sección de Ejercicios en la Rutina */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                Ejercicios ({routineExercises.length})
              </span>
            </div>

            {/* Selector para añadir ejercicio */}
            <div className="flex gap-2">
              <select
                value={selectedExIdToAdd}
                onChange={(e) => setSelectedExIdToAdd(Number(e.target.value))}
                className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:border-cyan-500 outline-none"
              >
                <option value="">Seleccionar ejercicio del catálogo...</option>
                {exercises.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.title} {ex.category_name ? `(${ex.category_name})` : ''}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleAddExerciseToRoutine}
                disabled={!selectedExIdToAdd}
                className="px-3.5 py-2 rounded-xl bg-cyan-600 disabled:opacity-50 text-white text-xs font-bold shrink-0"
              >
                + Añadir
              </button>
            </div>

            {/* Lista de ejercicios incluidos */}
            {routineExercises.length > 0 ? (
              <div className="space-y-2.5 pt-1">
                {routineExercises.map((row, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">
                        {idx + 1}. {row.title}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveExerciseFromRoutine(idx)}
                        className="text-slate-500 hover:text-rose-400"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400">Día / Bloque</label>
                        <input
                          type="text"
                          value={row.dayOfWeek}
                          onChange={(e) => handleUpdateExerciseRow(idx, 'dayOfWeek', e.target.value)}
                          placeholder="Día 1"
                          className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400">Series</label>
                        <input
                          type="number"
                          value={row.sets}
                          onChange={(e) => handleUpdateExerciseRow(idx, 'sets', Number(e.target.value))}
                          className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400">Reps</label>
                        <input
                          type="text"
                          value={row.reps}
                          onChange={(e) => handleUpdateExerciseRow(idx, 'reps', e.target.value)}
                          placeholder="10-12"
                          className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <input
                        type="text"
                        value={row.notes}
                        onChange={(e) => handleUpdateExerciseRow(idx, 'notes', e.target.value)}
                        placeholder="Pauta técnica (ej: tempo 3-0-1, pausa abajo)"
                        className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-[11px] text-slate-300"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic text-center py-2">
                Añadí ejercicios usando el selector de arriba.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={routineSaving}
            className="w-full py-4 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm shadow-xl shadow-cyan-600/20 active:scale-95 transition-all"
          >
            {routineSaving ? 'Guardando...' : 'Guardar Rutina Completa'}
          </button>
        </form>
      </BottomSheet>

      {/* =============================================================
          MODAL 2: CREAR EJERCICIO CON VIDEO ASOCIADO
      ============================================================= */}
      <BottomSheet
        isOpen={isNewExerciseOpen}
        onClose={() => setIsNewExerciseOpen(false)}
        title="Nuevo Ejercicio"
        subtitle="Agregá un ejercicio al catálogo con su video explicativo"
      >
        <form onSubmit={handleCreateExercise} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300">Nombre del Ejercicio *</label>
            <input
              type="text"
              required
              value={exTitle}
              onChange={(e) => setExTitle(e.target.value)}
              placeholder="Ej: Press Banca Plano con Barra"
              className="mt-1 w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:border-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300">Grupo Muscular / Categoría</label>
            <select
              value={exCategory}
              onChange={(e) => setExCategory(Number(e.target.value))}
              className="mt-1 w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:border-blue-500 outline-none"
            >
              <option value="">Sin categoría específica</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Modo de Video para el Ejercicio */}
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <span className="text-xs font-semibold text-slate-300 block">Video Explicativo</span>

            <div className="grid grid-cols-3 gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => setExVideoMode('BIBLIO')}
                className={`py-2 rounded-xl font-bold transition-all ${
                  exVideoMode === 'BIBLIO' ? 'bg-blue-600 text-white' : 'bg-slate-950 text-slate-400 border border-slate-800'
                }`}
              >
                Biblioteca
              </button>
              <button
                type="button"
                onClick={() => setExVideoMode('URL')}
                className={`py-2 rounded-xl font-bold transition-all ${
                  exVideoMode === 'URL' ? 'bg-blue-600 text-white' : 'bg-slate-950 text-slate-400 border border-slate-800'
                }`}
              >
                Enlace / YT
              </button>
              <button
                type="button"
                onClick={() => setExVideoMode('FILE')}
                className={`py-2 rounded-xl font-bold transition-all ${
                  exVideoMode === 'FILE' ? 'bg-blue-600 text-white' : 'bg-slate-950 text-slate-400 border border-slate-800'
                }`}
              >
                Subir Video
              </button>
            </div>

            {exVideoMode === 'BIBLIO' && (
              <select
                value={selectedBiblioId}
                onChange={(e) => setSelectedBiblioId(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none"
              >
                <option value="">Seleccionar video de tu biblioteca...</option>
                {mediaList
                  .filter((m) => m.type === 'VIDEO')
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title}
                    </option>
                  ))}
              </select>
            )}

            {exVideoMode === 'URL' && (
              <input
                type="url"
                value={exVideoUrl}
                onChange={(e) => setExVideoUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none"
              />
            )}

            {exVideoMode === 'FILE' && (
              <input
                type="file"
                accept="video/*"
                onChange={(e) => setExFile(e.target.files?.[0] || null)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300"
              />
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300">Descripción / Técnica</label>
            <textarea
              rows={2}
              value={exDesc}
              onChange={(e) => setExDesc(e.target.value)}
              placeholder="Consejos de postura, respiración, errores comunes..."
              className="mt-1 w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:border-blue-500 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={exSaving}
            className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-xl shadow-blue-600/20 active:scale-95 transition-all"
          >
            {exSaving ? 'Guardando ejercicio...' : 'Guardar Ejercicio'}
          </button>
        </form>
      </BottomSheet>

      {/* =============================================================
          MODAL 3: SUBIR RECURSO A LA BIBLIOTECA
      ============================================================= */}
      <BottomSheet
        isOpen={isNewMediaOpen}
        onClose={() => setIsNewMediaOpen(false)}
        title="Subir a la Biblioteca"
        subtitle="Videos instructivos y PDFs de auditorías para tus alumnos"
      >
        <form onSubmit={handleUploadMedia} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300">Título del Recurso *</label>
            <input
              type="text"
              required
              value={mediaTitle}
              onChange={(e) => setMediaTitle(e.target.value)}
              placeholder="Ej: Técnica Sentadilla Profunda / Guía Nutricional PDF"
              className="mt-1 w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:border-indigo-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-slate-300">Tipo de Contenido</label>
              <select
                value={mediaType}
                onChange={(e) => setMediaType(e.target.value as 'VIDEO' | 'PDF')}
                className="mt-1 w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white outline-none"
              >
                <option value="VIDEO">Video Instructivo</option>
                <option value="PDF">Documento PDF</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300">Origen</label>
              <select
                value={mediaUploadMode}
                onChange={(e) => setMediaUploadMode(e.target.value as 'FILE' | 'URL')}
                className="mt-1 w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white outline-none"
              >
                <option value="FILE">Subir Archivo</option>
                <option value="URL">Enlace Web / URL</option>
              </select>
            </div>
          </div>

          {mediaUploadMode === 'FILE' ? (
            <div>
              <label className="text-xs font-semibold text-slate-300">
                Seleccionar Archivo {mediaType === 'VIDEO' ? '(MP4, MOV, WebM)' : '(PDF)'}
              </label>
              <input
                type="file"
                required
                accept={mediaType === 'VIDEO' ? 'video/*' : 'application/pdf'}
                onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
                className="mt-1 w-full px-3 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300"
              />
            </div>
          ) : (
            <div>
              <label className="text-xs font-semibold text-slate-300">Enlace / URL</label>
              <input
                type="url"
                required
                value={mediaUrlInput}
                onChange={(e) => setMediaUrlInput(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="mt-1 w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:border-indigo-500 outline-none"
              />
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-300">Descripción (Opcional)</label>
            <input
              type="text"
              value={mediaDesc}
              onChange={(e) => setMediaDesc(e.target.value)}
              placeholder="Instrucciones breves..."
              className="mt-1 w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:border-indigo-500 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={mediaSaving}
            className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <Upload className="w-4 h-4" />
            <span>{mediaSaving ? 'Subiendo archivo...' : 'Guardar en Biblioteca'}</span>
          </button>
        </form>
      </BottomSheet>

      {/* =============================================================
          MODAL 4: AGENDAR MEET / CITA ONLINE
      ============================================================= */}
      <BottomSheet
        isOpen={isNewMeetOpen}
        onClose={() => setIsNewMeetOpen(false)}
        title="Agendar Cita Online"
        subtitle="Programá una videollamada de seguimiento con Google Meet"
      >
        <form onSubmit={handleCreateMeet} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300">Título de la Sesión *</label>
            <input
              type="text"
              required
              value={meetTitle}
              onChange={(e) => setMeetTitle(e.target.value)}
              placeholder="Ej: Auditoría de Progreso Mensual"
              className="mt-1 w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:border-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300">Alumno Online *</label>
            <select
              required
              value={meetUserId}
              onChange={(e) => setMeetUserId(Number(e.target.value))}
              className="mt-1 w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:border-emerald-500 outline-none"
            >
              <option value="">Seleccionar alumno...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.first_name} {c.last_name} {c.is_online ? '(Online ✓)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-slate-300">Fecha y Hora</label>
              <input
                type="datetime-local"
                required
                value={meetDate}
                onChange={(e) => setMeetDate(e.target.value)}
                className="mt-1 w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300">Tipo de Sesión</label>
              <select
                value={meetType}
                onChange={(e) => setMeetType(e.target.value as any)}
                className="mt-1 w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none"
              >
                <option value="MEET">Google Meet</option>
                <option value="AUDITORIA">Auditoría</option>
                <option value="CONTROL">Control de Peso</option>
                <option value="ENTRENAMIENTO">Entrenamiento Vivo</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300">Enlace de Videollamada (Meet / Zoom)</label>
            <input
              type="url"
              required
              value={meetUrl}
              onChange={(e) => setMeetUrl(e.target.value)}
              placeholder="https://meet.google.com/..."
              className="mt-1 w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:border-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300">Objetivo / Temas a tratar</label>
            <textarea
              rows={2}
              value={meetNotes}
              onChange={(e) => setMeetNotes(e.target.value)}
              placeholder="Revisión de fotos de progreso, sensaciones, pesos..."
              className="mt-1 w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:border-emerald-500 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={meetSaving}
            className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-xl shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <Calendar className="w-4 h-4" />
            <span>{meetSaving ? 'Agendando...' : 'Confirmar Cita Online'}</span>
          </button>
        </form>
      </BottomSheet>

      {/* =============================================================
          MODAL 5: ASIGNAR RUTINA A ALUMNO
      ============================================================= */}
      <BottomSheet
        isOpen={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        title="Asignar Rutina"
        subtitle={selectedRoutineToAssign?.title || 'Seleccionar alumno'}
      >
        <form onSubmit={handleAssignRoutineSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300">Seleccionar Alumno</label>
            <select
              required
              value={assignUserId}
              onChange={(e) => setAssignUserId(Number(e.target.value))}
              className="mt-1 w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:border-cyan-500 outline-none"
            >
              <option value="">Seleccionar...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.first_name} {c.last_name} {c.is_online ? '(Online ✓)' : ''}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm shadow-xl shadow-cyan-600/20 active:scale-95 transition-all"
          >
            Confirmar Asignación
          </button>
        </form>
      </BottomSheet>

      {/* =============================================================
          REPRODUCTOR DE VIDEO MODAL
      ============================================================= */}
      {activeVideoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <span className="text-sm font-bold text-white truncate">{activeVideoTitle}</span>
              <button
                onClick={() => setActiveVideoUrl(null)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="aspect-video bg-black flex items-center justify-center">
              {activeVideoUrl.includes('youtube.com') || activeVideoUrl.includes('youtu.be') ? (
                <iframe
                  src={getEmbedUrl(activeVideoUrl)}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video src={activeVideoUrl} controls autoPlay className="w-full h-full" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
