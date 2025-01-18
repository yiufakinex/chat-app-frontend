import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGetUser } from '../api/UserApi';
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';

const BE_BASE_URL = process.env.REACT_APP_AUTH_BASE_URL;

const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [error, setError] = useState<string | null>(null);
    const { data, error: userError } = useGetUser();

    useEffect(() => {
        console.log('Current URL:', window.location.href);
        console.log('Search params:', location.search);

        const urlParams = new URLSearchParams(location.search);
        const urlError = urlParams.get('error');

        console.log('URL Error param:', urlError);

        if (urlError) {
            const decodedError = decodeURIComponent(urlError);
            console.log('Decoded error:', decodedError);
            setError(decodedError);


            urlParams.delete('error');
            const newUrl = urlParams.toString()
                ? `${window.location.pathname}?${urlParams.toString()}`
                : window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
        }
    }, [location.search]);

    useEffect(() => {
        if (data) {
            if (data.newUser) {
                navigate('/register');
            } else if (data.loggedIn) {
                navigate('/');
            }
        }
    }, [data, navigate]);

    useEffect(() => {
        if (userError) {
            toast.error('Authentication check failed');
        }
    }, [userError]);

    const handleLogin = (provider: 'google' | 'github' | 'discord') => {
        try {
            window.location.href = `${BE_BASE_URL}/oauth2/authorization/${provider}`;
        } catch (err) {
            setError('Failed to initiate login. Please try again.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col justify-center items-center p-4">
            {error && (
                <div className="flex items-start w-full max-w-md mb-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                    <AlertCircle className="h-5 w-5 mt-0.5 mr-2 flex-shrink-0" />
                    <div className="space-y-1">
                        <p className="text-sm leading-relaxed">{error}</p>
                        <p className="text-xs opacity-90">
                            Each email can only be used with one login provider.
                            Please use the provider mentioned above.
                        </p>
                    </div>
                </div>
            )}

            <div className="space-y-4 w-full max-w-md">
                <button
                    onClick={() => handleLogin('google')}
                    className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-100 text-gray-900 px-4 py-2 rounded-md transition-colors"
                    data-testid="google-login"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-google" viewBox="0 0 16 16">
                        <path d="M15.545 6.558a9.42 9.42 0 0 1 .139 1.626c0 2.434-.87 4.492-2.384 5.885h.002C11.978 15.292 10.158 16 8 16A8 8 0 1 1 8 0a7.689 7.689 0 0 1 5.352 2.082l-2.284 2.284A4.347 4.347 0 0 0 8 3.166c-2.087 0-3.86 1.408-4.492 3.304a4.792 4.792 0 0 0 0 3.063h.003c.635 1.893 2.405 3.301 4.492 3.301 1.078 0 2.004-.276 2.722-.764h-.003a3.702 3.702 0 0 0 1.599-2.431H8v-3.08h7.545z" />
                    </svg>
                    Log In with Google
                </button>

                <button
                    onClick={() => handleLogin('discord')}
                    className="w-full flex items-center justify-center gap-2 bg-[#5865F2] hover:bg-[#4752C4] text-white px-4 py-2 rounded-md transition-colors"
                    data-testid="discord-login"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-discord" viewBox="0 0 16 16">
                        <path d="M13.545 2.907a13.227 13.227 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.19 12.19 0 0 0-3.658 0 8.258 8.258 0 0 0-.412-.833.051.051 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.041.041 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032c.001.014.01.028.021.037a13.276 13.276 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019c.308-.42.582-.863.818-1.329a.05.05 0 0 0-.01-.059.051.051 0 0 0-.018-.011 8.875 8.875 0 0 1-1.248-.595.05.05 0 0 1-.02-.066.051.051 0 0 1 .015-.019c.084-.063.168-.129.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.052.052 0 0 1 .053.007c.08.066.164.132.248.195a.051.051 0 0 1-.004.085 8.254 8.254 0 0 1-1.249.594.05.05 0 0 0-.03.03.052.052 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.235 13.235 0 0 0 4.001-2.02.049.049 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.034.034 0 0 0-.02-.019Z" />
                    </svg>
                    Log In with Discord
                </button>

                <button
                    onClick={() => handleLogin('github')}
                    className="w-full flex items-center justify-center gap-2 bg-[#24292F] hover:bg-[#1B1F23] text-white px-4 py-2 rounded-md transition-colors"
                    data-testid="github-login"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-github" viewBox="0 0 16 16">
                        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
                    </svg>
                    Log In with GitHub
                </button>
            </div>
        </div>
    );
};

export default LoginPage;