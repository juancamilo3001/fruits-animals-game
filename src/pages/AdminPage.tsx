import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Plus, Edit2, Save, Trash2, ArrowLeft, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { AnswerOption, QuestionCategory } from '../types/game';

interface AdminQuestion {
  id?: string;
  category: QuestionCategory;
  question_number: number;
  question_text: string;
  image_url: string;
  option_a: string;
  option_b: string;
  option_c: string;
  correct_answer: AnswerOption;
}

export const AdminPage: React.FC = () => {
  const [questions, setQuestions] = useState<AdminQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const [editingQuestion, setEditingQuestion] = useState<AdminQuestion | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchQuestions = async () => {
    if (!isSupabaseConfigured()) {
      setError('Credenciales de Supabase no configuradas en .env');
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error: rpcErr } = await supabase.rpc('admin_get_all_questions');
      if (rpcErr) throw new Error(rpcErr.message);
      if (data) {
        setQuestions(data as AdminQuestion[]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar las preguntas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const handleEdit = (q: AdminQuestion) => {
    setEditingQuestion({ ...q });
    setSaveSuccess(null);
  };

  const handleAddNew = () => {
    const nextNum = questions.length > 0 ? Math.max(...questions.map((q) => q.question_number)) + 1 : 1;
    setEditingQuestion({
      category: 'fruits',
      question_number: nextNum,
      question_text: '¿Cómo se dice "_____" en inglés?',
      image_url: '',
      option_a: 'OPCIÓN A',
      option_b: 'OPCIÓN B',
      option_c: 'OPCIÓN C',
      correct_answer: 'A',
    });
    setSaveSuccess(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion) return;

    setIsSaving(true);
    setError(null);
    try {
      const { error: rpcErr } = await supabase.rpc('admin_upsert_question', {
        p_category: editingQuestion.category,
        p_question_number: editingQuestion.question_number,
        p_question_text: editingQuestion.question_text.trim(),
        p_image_url: '', // Sin imagen — campo requerido por la BD pero no se muestra
        p_option_a: editingQuestion.option_a.trim().toUpperCase(),
        p_option_b: editingQuestion.option_b.trim().toUpperCase(),
        p_option_c: editingQuestion.option_c.trim().toUpperCase(),
        p_correct_answer: editingQuestion.correct_answer,
      });

      if (rpcErr) throw new Error(rpcErr.message);

      setSaveSuccess(`¡Pregunta #${editingQuestion.question_number} guardada correctamente!`);
      setEditingQuestion(null);
      await fetchQuestions();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar la pregunta');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 flex flex-col">
        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Link to="/" className="text-slate-400 hover:text-white transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-2xl sm:text-3xl font-black uppercase text-white flex items-center gap-2">
                <Shield className="w-7 h-7 text-amber-400" />
                <span>Panel de Administración de Preguntas</span>
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Agregar, editar o personalizar preguntas y opciones de vocabulario en inglés.
            </p>
          </div>

          <button
            onClick={handleAddNew}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-colors shadow flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar Pregunta</span>
          </button>
        </div>

        {/* Notificaciones */}
        {saveSuccess && (
          <div className="my-4 p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{saveSuccess}</span>
          </div>
        )}

        {error && (
          <div className="my-4 p-3.5 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Modal de edición */}
        {editingQuestion && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl my-8">
              <h2 className="text-xl font-black text-white uppercase mb-4 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-amber-400" />
                <span>Editar Pregunta #{editingQuestion.question_number}</span>
              </h2>

              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                      Nro. de Pregunta
                    </label>
                    <input
                      type="number"
                      value={editingQuestion.question_number}
                      onChange={(e) =>
                        setEditingQuestion({ ...editingQuestion, question_number: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                      Categoría
                    </label>
                    <select
                      value={editingQuestion.category}
                      onChange={(e) =>
                        setEditingQuestion({
                          ...editingQuestion,
                          category: e.target.value as QuestionCategory,
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="fruits">Frutas</option>
                      <option value="animals">Animales</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                    Texto de la Pregunta (en español)
                  </label>
                  <input
                    type="text"
                    value={editingQuestion.question_text}
                    onChange={(e) =>
                      setEditingQuestion({ ...editingQuestion, question_text: e.target.value })
                    }
                    placeholder='ej. ¿Cómo se dice "manzana" en inglés?'
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                      Opción A
                    </label>
                    <input
                      type="text"
                      value={editingQuestion.option_a}
                      onChange={(e) =>
                        setEditingQuestion({ ...editingQuestion, option_a: e.target.value })
                      }
                      placeholder="APPLE"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs font-bold text-white uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                      Opción B
                    </label>
                    <input
                      type="text"
                      value={editingQuestion.option_b}
                      onChange={(e) =>
                        setEditingQuestion({ ...editingQuestion, option_b: e.target.value })
                      }
                      placeholder="BANANA"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs font-bold text-white uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                      Opción C
                    </label>
                    <input
                      type="text"
                      value={editingQuestion.option_c}
                      onChange={(e) =>
                        setEditingQuestion({ ...editingQuestion, option_c: e.target.value })
                      }
                      placeholder="ORANGE"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs font-bold text-white uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                    Respuesta Correcta
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['A', 'B', 'C'] as AnswerOption[]).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() =>
                          setEditingQuestion({ ...editingQuestion, correct_answer: opt })
                        }
                        className={`py-2 rounded-xl border text-xs font-black uppercase transition-all ${
                          editingQuestion.correct_answer === opt
                            ? 'bg-emerald-500 text-slate-950 border-emerald-400 ring-2 ring-emerald-500/50'
                            : 'bg-slate-950 text-slate-400 border-slate-700 hover:bg-slate-800'
                        }`}
                      >
                        Opción {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditingQuestion(null)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase flex items-center justify-center gap-1.5 shadow"
                  >
                    {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>Guardar Pregunta</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Grid de preguntas */}
        {loading ? (
          <div className="py-20 text-center">
            <RefreshCw className="w-10 h-10 animate-spin text-emerald-400 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-400">Cargando Base de Datos de Preguntas...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 my-6">
            {questions.map((q) => (
              <div
                key={q.question_number}
                className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-lg hover:border-slate-700 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs font-black text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30">
                      P#{String(q.question_number).padStart(2, '0')}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                      {q.category === 'fruits' ? 'Fruta' : 'Animal'}
                    </span>
                  </div>

                  <p className="text-sm font-bold text-white mb-3">{q.question_text}</p>

                  <div className="space-y-1 mb-3 text-xs">
                    <div
                      className={`px-2.5 py-1 rounded-lg border font-semibold flex items-center justify-between ${
                        q.correct_answer === 'A'
                          ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/50'
                          : 'bg-slate-950 text-slate-400 border-slate-800'
                      }`}
                    >
                      <span>A. {q.option_a}</span>
                      {q.correct_answer === 'A' && <span className="font-black">✓</span>}
                    </div>
                    <div
                      className={`px-2.5 py-1 rounded-lg border font-semibold flex items-center justify-between ${
                        q.correct_answer === 'B'
                          ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/50'
                          : 'bg-slate-950 text-slate-400 border-slate-800'
                      }`}
                    >
                      <span>B. {q.option_b}</span>
                      {q.correct_answer === 'B' && <span className="font-black">✓</span>}
                    </div>
                    <div
                      className={`px-2.5 py-1 rounded-lg border font-semibold flex items-center justify-between ${
                        q.correct_answer === 'C'
                          ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/50'
                          : 'bg-slate-950 text-slate-400 border-slate-800'
                      }`}
                    >
                      <span>C. {q.option_c}</span>
                      {q.correct_answer === 'C' && <span className="font-black">✓</span>}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleEdit(q)}
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Editar Pregunta</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
