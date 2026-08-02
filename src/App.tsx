import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SensorDataProvider } from './contexts/SensorDataContext';
import ProtectedRoute from './components/ProtectedRoute';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard.tsx';

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <SensorDataProvider>
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
                </SensorDataProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}
