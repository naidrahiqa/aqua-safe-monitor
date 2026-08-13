import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SensorDataProvider } from './contexts/SensorDataContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import SkeletonCard from './components/SkeletonCard';

const AuthPage = lazy(() => import('./pages/AuthPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));

function PageFallback() {
    return (
        <div className="min-h-screen bg-surface flex items-center justify-center p-8">
            <SkeletonCard height="h-48" />
        </div>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <ErrorBoundary>
                <AuthProvider>
                    <SensorDataProvider>
                        <Suspense fallback={<PageFallback />}>
                            <Routes>
                                <Route path="/login" element={<AuthPage />} />
                                <Route
                                    path="/*"
                                    element={
                                        <ProtectedRoute>
                                            <Dashboard />
                                        </ProtectedRoute>
                                    }
                                />
                            </Routes>
                        </Suspense>
                    </SensorDataProvider>
                </AuthProvider>
            </ErrorBoundary>
        </BrowserRouter>
    );
}
