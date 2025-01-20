import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import Profile from './components/Profile';
import ChatPage from './pages/ChatPage';
import LoginPage from './pages/LoginPage';
import { useGetUser } from './api/UserApi';
import { toast } from 'sonner';
import NewUserPage from './pages/NewUserPage';
import { ProtectedRoute } from './components/ProtectedRoute';

const AppContent: React.FC = () => {
    const { data, error } = useGetUser();


    React.useEffect(() => {
        if (error) {
            toast.error("Error in login, refresh.");
        }
    }, [error]);


    if (data?.newUser) {
        return <Navigate to="/register" replace />;
    }

    const user = data?.user || null;

    return (
        <>
            <Navbar user={user} />
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
        </>
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