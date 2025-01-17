import { useQuery, useMutation } from 'react-query';
import apiClient, { clearAuthState } from './axios';
import { toast } from 'sonner';
import { User } from '../types/User';

interface UserResponse {
    newUser: boolean;
    loggedIn: boolean;
    user: User;
}


export const useGetUser = () => {
    const getUserRequest = async () => {
        const response = await apiClient.get<UserResponse>('/login/user');

        if (response.status !== 200) {
            throw new Error('Failed to fetch user');
        }

        return response.data;
    };

    return useQuery<UserResponse>('user', getUserRequest, {
        onError: (err) => {
            const error = err as Error;
            toast.error(error.message);
        },
    });
};

interface NewUserParams {
    [key: string]: string;
}

export const useCreateNewUser = () => {
    const createNewUserRequest = async (params: NewUserParams) => {
        const formData = new URLSearchParams();
        for (const [key, value] of Object.entries(params)) {
            formData.append(key, value);
        }

        const response = await apiClient.post('/login/new_user', formData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            withCredentials: true,
        });

        return response.data;
    };

    return useMutation(createNewUserRequest, {
        onError: (err) => {
            const error = err as Error;
            toast.error(error.message);
        },
        onSuccess: () => {
            toast.success('New user created successfully');
        },
    });
};

export const useSearchUser = (username: string) => {
    const searchUserRequest = async () => {
        const response = await apiClient.get('/users/search', {
            params: { username },
        });

        if (response.status !== 200) {
            throw new Error('Failed to search user');
        }

        return response.data;
    };

    return useQuery(['searchUser', username], searchUserRequest, {
        onError: (err) => {
            const error = err as Error;
            toast.error(error.message);
        },
    });
};

export const useUpdateDisplayName = () => {
    const updateDisplayNameRequest = async (displayName: string) => {
        const response = await apiClient.patch('/users/update/display_name', null, {
            params: { displayName },
        });

        if (response.status !== 200) {
            throw new Error('Failed to update display name');
        }

        return response.data;
    };

    return useMutation(updateDisplayNameRequest, {
        onError: (err) => {
            const error = err as Error;
            toast.error(error.message);
        },
        onSuccess: () => {
            toast.success('Display name updated successfully');
        },
    });
};

export const useLogout = () => {
    return useMutation(
        async () => {
            const response = await apiClient.post('/logout');
            return response.data;
        },
        {
            onSuccess: () => {
                clearAuthState();
                toast.success('Logged out successfully');
                window.location.href = '/';
            },
            onError: (error) => {
                console.error('Logout error:', error);
                clearAuthState();
                window.location.href = '/';
            },
        }
    );
};
