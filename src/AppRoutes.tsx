import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useNavigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import Profile from './components/Profile';
import ChatPage from './pages/ChatPage';
import LoginPage from './pages/LoginPage';
import { useGetUser } from './api/UserApi';
import { toast } from 'sonner';
import NewUserPage from './pages/NewUserPage';
import { ProtectedRoute } from './components/ProtectedRoute';

const AppContent: React.FC = () => {
    const { data, error, isLoading } = useGetUser();
    const navigate = useNavigate();

    React.useEffect(() => {
        if (error) {
            toast.error("Error in login: " + (error as Error).message);
            console.error("Login error:", error);
        }
    }, [error]);

    React.useEffect(() => {
        if (data) {
            if (data.newUser) {
                navigate('/register', { replace: true });
            } else if (data.loggedIn) {
                navigate('/chat-app', { replace: true });
            }
        }
    }, [data, navigate]);

    const user = data?.user || null;

    if (isLoading) {
        return <div className="min-h-screen bg-gray-900 flex items-center justify-center">
            <div className="text-white">Loading...</div>
        </div>;
    }

    return (
        <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<NewUserPage />} />
            <Route
                path="/user-profile"
                element={
                    <ProtectedRoute user={user}>
                        <Profile user={user!} setUser={() => { }} />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/chat-app"
                element={
                    <ProtectedRoute user={user}>
                        <ChatPage user={user!} setUser={() => { }} />
                    </ProtectedRoute>
                }
            />
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
};

const AppRoutes: React.FC = () => {
    return (
        <Router>
            <AppContent />
        </Router>
    );
};

export default AppRoutes;