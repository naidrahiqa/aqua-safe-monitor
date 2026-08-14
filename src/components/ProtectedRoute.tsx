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
                    <div className="w-14 h-14 bg-water-500 border-2 border-black flex items-center justify-center hard-shadow-sm">
                        <Loader2 size={24} className="text-black animate-spin" />
                    </div>
                    <p className="text-sm text-slate-400 font-bold">Memuat...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
}
