import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Sparkles, Shield, Trophy, Users, Zap, CheckCircle2 } from 'lucide-react';
import { Navbar } from '../components/Navbar';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 max-w-5xl mx-auto w-full">
        {/* Hero Section */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-wider mb-6 shadow-sm">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>ARENA MULTIJUGADOR EN TIEMPO REAL</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white uppercase leading-none mb-4">
            FRUTAS Y ANIMALES
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 mt-2">
              DESAFÍO EN INGLÉS
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 font-medium max-w-xl mx-auto mb-8">
            ¡Pon a prueba tu vocabulario en inglés en una batalla multijugador en vivo! 40 preguntas, 3 opciones, sin demoras. ¡La respuesta correcta más rápida vale más puntos!
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md mx-auto">
            <Link
              to="/join"
              className="w-full sm:w-auto flex-1 min-h-[56px] px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-lg tracking-wide uppercase shadow-lg shadow-emerald-500/25 transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>UNIRSE</span>
            </Link>

            <Link
              to="/host"
              className="w-full sm:w-auto flex-1 min-h-[56px] px-8 py-4 rounded-2xl bg-slate-900 border-2 border-slate-700/80 hover:border-amber-400/80 text-white font-black text-lg tracking-wide uppercase transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 shadow-md hover:bg-slate-850"
            >
              <Shield className="w-5 h-5 text-amber-400" />
              <span>CREAR SALA</span>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mt-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col items-start shadow-lg">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white mb-2">Puntuación por Velocidad</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              El 1.º recibe <span className="text-amber-400 font-bold">+100 pts</span>, el 2.º <span className="text-slate-300 font-bold">+80 pts</span>, el 3.º <span className="text-amber-600 font-bold">+60 pts</span>. ¡La velocidad y la precisión ganan!
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col items-start shadow-lg">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white mb-2">Sin Cuentas Necesarias</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              No necesitas registrarte ni contraseñas. Solo escribe tu apodo y el código de 6 dígitos para entrar directo a la competición.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col items-start shadow-lg">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-4">
              <Trophy className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white mb-2">40 Preguntas Oficiales</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              20 frutas y 20 animales intercalados. Preguntas en español, opciones en inglés, progresión sincronizada para todos los jugadores en tiempo real.
            </p>
          </div>
        </div>

        {/* Scoring Table */}
        <div className="w-full mt-10 p-6 rounded-3xl bg-slate-900/40 border border-slate-800/80 max-w-2xl">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 text-center">
            Tabla de Puntuación Oficial
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
              <span className="text-slate-400 block font-medium">1.º Correcto</span>
              <span className="text-amber-400 font-black text-sm">+100 pts</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
              <span className="text-slate-400 block font-medium">2.º Correcto</span>
              <span className="text-slate-300 font-black text-sm">+80 pts</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
              <span className="text-slate-400 block font-medium">3.º Correcto</span>
              <span className="text-amber-600 font-black text-sm">+60 pts</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
              <span className="text-slate-400 block font-medium">4.º Correcto</span>
              <span className="text-emerald-400 font-black text-sm">+40 pts</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
              <span className="text-slate-400 block font-medium">5.º+ Correcto</span>
              <span className="text-teal-400 font-black text-sm">+20 pts</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
              <span className="text-slate-400 block font-medium">Incorrecto</span>
              <span className="text-rose-400 font-black text-sm">0 pts</span>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-6 border-t border-slate-900 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-center gap-3">
        <span>Frutas y Animales — Desafío en Inglés &copy; {new Date().getFullYear()} • Multijugador en Tiempo Real</span>
        <span className="hidden sm:inline">•</span>
        <Link to="/admin" className="text-slate-400 hover:text-emerald-400 transition-colors font-medium">
          Administrador de Preguntas
        </Link>
      </footer>
    </div>
  );
};
