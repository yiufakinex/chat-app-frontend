import axios from 'axios';
import { toast } from 'sonner';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL; 

interface ApiError {
    message: string;
    reason?: string;
    code?: string;
}

export const clearAuthState = () => {
    localStorage.clear();
    sessionStorage.clear();
    
    
    document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
};

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true
});


apiClient.interceptors.response.use(
    response => {
        
        if (response.status === 302 || response.request.responseURL?.endsWith("/login")) {
            clearAuthState();
            window.location.href = "/login?error=Session expired, please log back in.";
            return Promise.reject(new Error('Session expired'));
        }
        return response;
    },
    error => {
        if (error.response) {
            const errorData = error.response.data as ApiError;
            
            switch (error.response.status) {
                case 401:
                    clearAuthState();
                    window.location.href = '/login?error=Session expired, please log back in.';
                    break;
                case 403:
                    toast.error('Access denied');
                    break;
                case 404:
                    console.error('Resource not found:', error.config.url);
                    toast.error('Resource not found');
                    break;
                case 405:
                    console.error('Method not allowed:', error.config.method, 'for URL:', error.config.url);
                    toast.error('Operation not supported');
                    break;
                case 406:
                    toast.error(`Invalid input: ${errorData.reason || 'Please check your input'}`);
                    break;
                case 429:
                    toast.error(`Rate limit exceeded: ${errorData.reason || 'Please try again later'}`);
                    break;
                default:
                    toast.error(errorData.message || 'An unexpected error occurred');
            }
        } else if (error.request) {
            toast.error('Network error - please check your connection');
        } else {
            toast.error('An unexpected error occurred');
        }
        return Promise.reject(error);
    }
);

export default apiClient;