import axios from 'axios';
import { toast } from 'sonner';

let API_BASE_URL = process.env.REACT_APP_API_BASE_URL; 
if (window.location.protocol === 'https:' && API_BASE_URL?.startsWith('http:')) {

    API_BASE_URL = API_BASE_URL.replace('http:', 'https:');
}

interface ApiError {
    message: string;
    reason?: string;
    code?: string;
    retryAfter?: number;
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

const rateLimitState = {
    retryQueue: new Map<string, number>(),
    isRetrying: false
};

const handleRateLimit = async (error: any) => {
    const retryAfter = error.response?.headers?.['retry-after'] 
        ? parseInt(error.response.headers['retry-after']) 
        : 60;
    
    const endpoint = error.config.url;
    const now = Date.now();
    rateLimitState.retryQueue.set(endpoint, now + (retryAfter * 1000));

    toast.error(`Rate limit exceeded. Retrying in ${retryAfter} seconds.`);

    if (!error.config._retry) {
        error.config._retry = true;
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        return apiClient(error.config);
    }
    
    return Promise.reject(error);
};

apiClient.interceptors.request.use(
    async config => {
        const endpoint = config.url || '';
        const retryTime = rateLimitState.retryQueue.get(endpoint);
        
        if (retryTime && Date.now() < retryTime) {
            const waitTime = Math.ceil((retryTime - Date.now()) / 1000);
            throw new Error(`Please wait ${waitTime} seconds before retrying`);
        }
        
        rateLimitState.retryQueue.delete(endpoint);
        return config;
    },
    error => Promise.reject(error)
);

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
                case 429:
                    return handleRateLimit(error);
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