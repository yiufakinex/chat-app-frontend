import React from 'react';
import { User } from '../types/User';

interface NavbarProps {
    user: User | null;
}

const Navbar: React.FC<NavbarProps> = ({ user }) => {
    const isLoggedIn = Boolean(user);

    return (
        <nav className="bg-black shadow">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <div className="flex-shrink-0 flex items-center">
                            <img src="https://cdn.vectorstock.com/i/1000x1000/42/72/cute-funny-yeti-monster-character-with-question-vector-38094272.webp" alt="Logo" height="40" width="40" className="d-inline-block align-text-top rounded-circle" />
                            <span className="text-white text-xl font-bold">Chat App</span>
                        </div>
                    </div>
                    <div className="flex items-center">
                        {isLoggedIn && (
                            <span className="text-white">
                                Welcome, {user?.displayName || user?.username}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
