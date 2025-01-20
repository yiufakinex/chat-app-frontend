import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { User } from '../types/User';

interface ProtectedRouteProps {
    user: User | null;
    children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ user, children }) => {
    const location = useLocation();

    if (!user) {

        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};