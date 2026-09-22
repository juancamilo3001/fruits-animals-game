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

  // Editing modal / drawer state
  const [editingQuestion, setEditingQuestion] = useState<AdminQuestion | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchQuestions = async () => {
    if (!isSupabaseConfigured()) {
      setError('Supabase credentials not configured in .env');
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
      setError(err instanceof Error ? err.message : 'Failed to fetch questions');
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
      question_text: 'Which fruit is this?',
      image_url: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&auto=format&fit=crop&q=80',
      option_a: 'APPLE',
      option_b: 'BANANA',
      option_c: 'ORANGE',
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
        p_image_url: editingQuestion.image_url.trim(),
        p_option_a: editingQuestion.option_a.trim().toUpperCase(),
        p_option_b: editingQuestion.option_b.trim().toUpperCase(),
        p_option_c: editingQuestion.option_c.trim().toUpperCase(),
        p_correct_answer: editingQuestion.correct_answer,
      });

      if (rpcErr) throw new Error(rpcErr.message);

      setSaveSuccess(`Question #${editingQuestion.question_number} saved successfully!`);
      setEditingQuestion(null);
      await fetchQuestions();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save question');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 flex flex-col">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Link to="/" className="text-slate-400 hover:text-white transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-2xl sm:text-3xl font-black uppercase text-white flex items-center gap-2">
                <Shield className="w-7 h-7 text-amber-400" />
                <span>Question Management Panel</span>
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Add, edit, or customize English questions, vocabulary options, and image URLs.
            </p>
          </div>

          <button
            onClick={handleAddNew}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-colors shadow flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Question</span>
          </button>
        </div>

        {/* Notifications */}
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

        {/* Edit Modal / Drawer */}
        {editingQuestion && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl my-8">
              <h2 className="text-xl font-black text-white uppercase mb-4 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-amber-400" />
                <span>Edit Question #{editingQuestion.question_number}</span>
              </h2>

              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                      Question #
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
                      Category
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
                      <option value="fruits">Fruits</option>
                      <option value="animals">Animals</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                    Question Text
                  </label>
                  <input
                    type="text"
                    value={editingQuestion.question_text}
                    onChange={(e) =>
                      setEditingQuestion({ ...editingQuestion, question_text: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                    Image URL
                  </label>
                  <input
                    type="url"
                    value={editingQuestion.image_url}
                    onChange={(e) =>
                      setEditingQuestion({ ...editingQuestion, image_url: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                    required
                  />
                  {editingQuestion.image_url && (
                    <div className="mt-2 w-full h-32 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
                      <img
                        src={editingQuestion.image_url}
                        alt="Preview"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                      Option A
                    </label>
                    <input
                      type="text"
                      value={editingQuestion.option_a}
                      onChange={(e) =>
                        setEditingQuestion({ ...editingQuestion, option_a: e.target.value })
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs font-bold text-white uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                      Option B
                    </label>
                    <input
                      type="text"
                      value={editingQuestion.option_b}
                      onChange={(e) =>
                        setEditingQuestion({ ...editingQuestion, option_b: e.target.value })
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs font-bold text-white uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                      Option C
                    </label>
                    <input
                      type="text"
                      value={editingQuestion.option_c}
                      onChange={(e) =>
                        setEditingQuestion({ ...editingQuestion, option_c: e.target.value })
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs font-bold text-white uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                    Correct Answer
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
                        Option {opt}
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
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase flex items-center justify-center gap-1.5 shadow"
                  >
                    {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>Save Question</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Questions Grid */}
        {loading ? (
          <div className="py-20 text-center">
            <RefreshCw className="w-10 h-10 animate-spin text-emerald-400 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-400">Loading Questions Database...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 my-6">
            {questions.map((q) => (
              <div
                key={q.question_number}
                className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-lg hover:border-slate-700 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-black text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30">
                      Q#{String(q.question_number).padStart(2, '0')}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                      {q.category}
                    </span>
                  </div>

                  <div className="w-full aspect-[16/10] bg-slate-950 rounded-xl overflow-hidden mb-3 border border-slate-800">
                    <img
                      src={q.image_url}
                      alt={q.question_text}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  <p className="text-sm font-bold text-white mb-2">{q.question_text}</p>

                  <div className="space-y-1 mb-3 text-xs">
                    <div
                      className={`px-2.5 py-1 rounded-lg border font-semibold flex items-center justify-between ${
                        q.correct_answer === 'A'
                          ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/50'
                          : 'bg-slate-950 text-slate-400 border-slate-800'
                      }`}
                    >
                      <span>A. {q.option_a}</span>
                      {q.correct_answer === 'A' && <span className="font-black">✓ CORRECT</span>}
                    </div>
                    <div
                      className={`px-2.5 py-1 rounded-lg border font-semibold flex items-center justify-between ${
                        q.correct_answer === 'B'
                          ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/50'
                          : 'bg-slate-950 text-slate-400 border-slate-800'
                      }`}
                    >
                      <span>B. {q.option_b}</span>
                      {q.correct_answer === 'B' && <span className="font-black">✓ CORRECT</span>}
                    </div>
                    <div
                      className={`px-2.5 py-1 rounded-lg border font-semibold flex items-center justify-between ${
                        q.correct_answer === 'C'
                          ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/50'
                          : 'bg-slate-950 text-slate-400 border-slate-800'
                      }`}
                    >
                      <span>C. {q.option_c}</span>
                      {q.correct_answer === 'C' && <span className="font-black">✓ CORRECT</span>}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleEdit(q)}
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Edit Question</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
