import React, { useState } from 'react';
import { useCreateNewUser } from '../api/UserApi';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const NewUserPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const createUser = useCreateNewUser();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username) {
            toast.error('Username is required');
            return;
        }
        try {
            await createUser.mutateAsync({ username });
            navigate('/chat-app');
        } catch (error) {
            console.error('Error creating user:', error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-md space-y-4">
                <h1 className="text-2xl font-bold text-white text-center">Welcome, New User!</h1>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-white mb-2">
                            Choose your username:
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full p-2 mt-1 rounded-md bg-gray-800 text-white border border-gray-700"
                                required
                                minLength={3}
                                maxLength={30}
                                pattern="^[a-zA-Z0-9]*$"
                            />
                        </label>
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md"
                        disabled={createUser.isLoading}
                    >
                        {createUser.isLoading ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default NewUserPage;