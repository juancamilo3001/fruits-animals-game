import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { JoinPage } from './pages/JoinPage';
import { PlayerRoomPage } from './pages/PlayerRoomPage';
import { HostCreatePage } from './pages/HostCreatePage';
import { HostDashboardPage } from './pages/HostDashboardPage';
import { ResultsPage } from './pages/ResultsPage';
import { AdminPage } from './pages/AdminPage';
import { isSupabaseConfigured } from './lib/supabase';
import { AlertCircle, ExternalLink, X, Copy, Check } from 'lucide-react';

export const App: React.FC = () => {
  const isConfigured = isSupabaseConfigured();
  const [showConfigBanner, setShowConfigBanner] = useState(!isConfigured);
  const [copiedSql, setCopiedSql] = useState(false);

  return (
    <BrowserRouter>
      {/* Supabase Free-Tier Setup Prompt Banner if credentials not configured */}
      {showConfigBanner && (
        <div className="bg-amber-950/90 border-b border-amber-600/50 px-4 py-3 text-amber-200 text-xs sm:text-sm backdrop-blur-md sticky top-0 z-50 shadow-lg">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <span>
                <strong>Supabase Setup Needed:</strong> Connect your free Supabase database in{' '}
                <code className="bg-slate-900 px-1.5 py-0.5 rounded text-amber-300 font-mono">
                  .env
                </code>{' '}
                and run{' '}
                <code className="bg-slate-900 px-1.5 py-0.5 rounded text-amber-300 font-mono">
                  supabase/schema.sql
                </code>.
              </span>
            </div>
            <button
              onClick={() => setShowConfigBanner(false)}
              className="text-amber-400 hover:text-white p-1 rounded-lg"
              title="Dismiss warning"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/join" element={<JoinPage />} />
        <Route path="/join/:roomCode" element={<JoinPage />} />
        <Route path="/room/:roomCode" element={<PlayerRoomPage />} />
        <Route path="/host" element={<HostCreatePage />} />
        <Route path="/host/:roomCode" element={<HostDashboardPage />} />
        <Route path="/results/:roomCode" element={<ResultsPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
