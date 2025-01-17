import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import Profile from './components/Profile';
import ChatPage from './pages/ChatPage';
import LoginPage from './pages/LoginPage';
import { useGetUser } from './api/UserApi';
import { toast } from 'sonner';
import { User } from './types/User';
import NewUserPage from './pages/NewUserPage';

const AppContent: React.FC = () => {
    const { data, error } = useGetUser();
    const [user, setUser] = useState<User | null>(null);
    const [loggedIn, setLoggedIn] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (data) {
            if (data.newUser) {
                navigate('/register');
            } else if (data.loggedIn) {
                setUser(data.user);
                setLoggedIn(true);
                navigate('/chat-app');
            }
        }
    }, [data, navigate]);

    useEffect(() => {
        if (error) {
            toast.error("Error in login, refresh.");
        }
    }, [error]);

    return (
        <>
            <Navbar loggedIn={loggedIn} />
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<NewUserPage />} />
                <Route path="/user-profile" element={user ? <Profile user={user} setUser={setUser} /> : <Navigate to="/login" />} />
                <Route path="/chat-app" element={user ? <ChatPage user={user} loggedIn={loggedIn} setUser={setUser} /> : <Navigate to="/login" />} />
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