import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Droplets, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';

// ===================================================================
// AuthPage — Combined Login & Register page with animated design.
// ===================================================================

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const { signIn, signUp } = useAuth();
    const navigate = useNavigate();
    const configured = isSupabaseConfigured();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (!configured) {
            setError('Supabase belum dikonfigurasi. Tambahkan VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di file .env');
            return;
        }

        if (!email || !password) {
            setError('Email dan password harus diisi');
            return;
        }

        if (password.length < 6) {
            setError('Password minimal 6 karakter');
            return;
        }

        setLoading(true);
        try {
            if (isLogin) {
                const { error: authError } = await signIn(email, password);
                if (authError) {
                    setError(authError);
                } else {
                    navigate('/');
                }
            } else {
                const { error: authError } = await signUp(email, password);
                if (authError) {
                    setError(authError);
                } else {
                    setSuccess('Registrasi berhasil! Cek email kamu untuk verifikasi.');
                    setIsLogin(true);
                }
            }
        } finally {
            setLoading(false);
        }
    };

    // Demo mode — bypass auth if Supabase not configured
    const handleDemoMode = () => {
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-surface flex">
            {/* Left Panel — Branding */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
                {/* Background gradients */}
                <div className="absolute inset-0 bg-gradient-to-br from-water-900 via-ocean-900 to-surface" />
                <div className="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-water-500/10 blur-3xl animate-float" />
                <div className="absolute bottom-1/4 -right-20 w-80 h-80 rounded-full bg-ocean-500/10 blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-center px-16">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-water-400 to-ocean-500 flex items-center justify-center shadow-lg shadow-water-500/30">
                            <Droplets size={28} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">WaterSafe</h1>
                            <p className="text-xs text-water-400 font-medium tracking-widest uppercase">Monitor</p>
                        </div>
                    </div>

                    <h2 className="text-4xl font-extrabold text-white leading-tight mb-4">
                        Monitoring Kualitas Air{' '}
                        <span className="bg-gradient-to-r from-water-300 to-ocean-300 bg-clip-text text-transparent">
                            Real-Time
                        </span>
                    </h2>
                    <p className="text-slate-400 text-base leading-relaxed max-w-md">
                        Platform IoT untuk memantau pH, TDS, turbidity, dan suhu air secara langsung
                        dari sensor ESP32 kamu. Dapatkan alert instan ketika kualitas air menurun.
                    </p>

                    {/* Feature cards */}
                    <div className="mt-10 space-y-3">
                        {[
                            { emoji: '📊', text: 'Dashboard real-time dengan grafik interaktif' },
                            { emoji: '🔔', text: 'Notifikasi otomatis saat status BAHAYA' },
                            { emoji: '📍', text: 'Peta lokasi sensor dengan Leaflet' },
                            { emoji: '🔐', text: 'Autentikasi aman untuk setiap perangkat' },
                        ].map((f, i) => (
                            <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/5 backdrop-blur-sm">
                                <span className="text-lg">{f.emoji}</span>
                                <span className="text-sm text-slate-300">{f.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Panel — Auth Form */}
            <div className="flex-1 flex items-center justify-center px-6 py-12">
                <div className="w-full max-w-md animate-fade-in">
                    {/* Mobile logo */}
                    <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-water-400 to-ocean-500 flex items-center justify-center shadow-lg shadow-water-500/30">
                            <Droplets size={24} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white">WaterSafe</h1>
                            <p className="text-[10px] text-water-400 font-medium tracking-widest uppercase">Monitor</p>
                        </div>
                    </div>

                    {/* Heading */}
                    <div className="text-center lg:text-left mb-8">
                        <h2 className="text-2xl font-bold text-white">
                            {isLogin ? 'Selamat Datang!' : 'Buat Akun Baru'}
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                            {isLogin
                                ? 'Masuk ke dashboard monitoring kamu'
                                : 'Daftar untuk mulai memantau kualitas air'
                            }
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email field */}
                        <div>
                            <label htmlFor="auth-email" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                                Email
                            </label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    id="auth-email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="email@example.com"
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-panel-light border border-white/5
                                        text-sm text-white placeholder-slate-600
                                        focus:outline-none focus:border-water-500/50 focus:ring-1 focus:ring-water-500/20
                                        transition-all"
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        {/* Password field */}
                        <div>
                            <label htmlFor="auth-password" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                                Password
                            </label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    id="auth-password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Minimal 6 karakter"
                                    className="w-full pl-10 pr-12 py-3 rounded-xl bg-panel-light border border-white/5
                                        text-sm text-white placeholder-slate-600
                                        focus:outline-none focus:border-water-500/50 focus:ring-1 focus:ring-water-500/20
                                        transition-all"
                                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Error / Success messages */}
                        {error && (
                            <div className="px-4 py-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs font-medium animate-fade-in">
                                ⚠️ {error}
                            </div>
                        )}
                        {success && (
                            <div className="px-4 py-3 rounded-xl bg-safe/10 border border-safe/20 text-safe text-xs font-medium animate-fade-in">
                                ✅ {success}
                            </div>
                        )}

                        {/* Submit button */}
                        <button
                            id="auth-submit"
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl
                                bg-gradient-to-r from-water-500 to-ocean-500
                                hover:from-water-400 hover:to-ocean-400
                                text-white text-sm font-bold
                                shadow-lg shadow-water-500/20 hover:shadow-water-500/30
                                disabled:opacity-50 disabled:cursor-not-allowed
                                transition-all duration-200 transform hover:scale-[1.01]"
                        >
                            {loading ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <>
                                    {isLogin ? 'Masuk' : 'Daftar'} <ArrowRight size={16} />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Toggle login/register */}
                    <p className="mt-6 text-center text-sm text-slate-500">
                        {isLogin ? 'Belum punya akun?' : 'Sudah punya akun?'}{' '}
                        <button
                            id="auth-toggle"
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setError(null);
                                setSuccess(null);
                            }}
                            className="text-water-400 hover:text-water-300 font-semibold transition-colors"
                        >
                            {isLogin ? 'Daftar' : 'Masuk'}
                        </button>
                    </p>

                    {/* Demo mode button */}
                    {!configured && (
                        <div className="mt-6 pt-6 border-t border-white/5">
                            <button
                                id="demo-mode-button"
                                onClick={handleDemoMode}
                                className="w-full py-3 rounded-xl border border-white/10
                                    text-slate-400 hover:text-white hover:border-water-500/30
                                    text-sm font-medium transition-all"
                            >
                                🎮 Masuk Mode Demo (tanpa Supabase)
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
