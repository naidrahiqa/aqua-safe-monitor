import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';
import { Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';

// ===================================================================
// ProtectedRoute — Wraps dashboard pages to require authentication.
// In demo mode (Supabase not configured), allows access without login.
// ===================================================================

interface ProtectedRouteProps {
    children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { user, loading } = useAuth();
    const configured = isSupabaseConfigured();

    // In demo mode, allow access without authentication
    if (!configured) {
        return <>{children}</>;
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-surface flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 animate-fade-in">
                    <div className="relative">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-water-400 to-ocean-500 flex items-center justify-center shadow-lg shadow-water-500/30">
                            <Loader2 size={24} className="text-white animate-spin" />
                        </div>
                        <div className="absolute inset-0 rounded-2xl bg-water-400/20 animate-pulse-ring" />
                    </div>
                    <p className="text-sm text-slate-400 font-medium">Memuat...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
}
