import { useQuery, useMutation } from 'react-query';
import apiClient from './axios';
import { toast } from 'sonner';
import { GroupChat } from '../types/GroupChat';

interface NewGroupChatForm {
    name: string;
    users: string[];
}

interface RenameGroupChatForm {
    chatId: number;
    newName: string;
}

interface AddGroupChatUserForm {
    chatId: number;
    userId: number;
}

export const useCreateGroupChat = () => {
    const createGroupChatRequest = async (form: NewGroupChatForm) => {
        const response = await apiClient.post('/api/groupchat/new', form);

        if (response.status !== 200) {
            throw new Error('Failed to create group chat');
        }

        return response.data;
    };

    return useMutation(createGroupChatRequest, {
        onError: (error) => {
            const err = error as Error;
            toast.error(err.message);
        },
        onSuccess: () => {
            toast.success('Group chat created successfully');
        },
    });
};

export const useRenameGroupChat = () => {
    const renameGroupChatRequest = async (form: RenameGroupChatForm) => {
        const response = await apiClient.patch('/api/groupchat/rename', form);

        if (response.status !== 200) {
            throw new Error('Failed to rename group chat');
        }

        return response.data;
    };

    return useMutation(renameGroupChatRequest, {
        onError: (error) => {
            const err = error as Error;
            toast.error(err.message);
        },
        onSuccess: () => {
            toast.success('Group chat renamed successfully');
        },
    });
};

export const useAddGroupChatUser = () => {
    const addGroupChatUserRequest = async (form: AddGroupChatUserForm) => {
        const response = await apiClient.post('/api/groupchat/adduser', form);

        if (response.status !== 200) {
            throw new Error('Failed to add user to group chat');
        }

        return response.data;
    };

    return useMutation(addGroupChatUserRequest, {
        onError: (error) => {
            const err = error as Error;
            toast.error(err.message);
        },
        onSuccess: () => {
            toast.success('User added to group chat successfully');
        },
    });
};

export const useListGroupChats = () => {
    const listGroupChatsRequest = async () => {
        const response = await apiClient.get<GroupChat[]>('/api/groupchat/list');

        if (response.status !== 200) {
            throw new Error('Failed to fetch group chats');
        }

        return response.data;
    };

    return useQuery('groupChats', listGroupChatsRequest, {
        onError: (error) => {
            const err = error as Error;
            toast.error(err.message);
        },
    });
};

export const useGetGroupChatMessages = (id: number, before?: number) => {
    const getGroupChatMessagesRequest = async () => {
        const response = await apiClient.get('/api/groupchat/messages', {
            params: { id, before },
        });

        if (response.status !== 200) {
            throw new Error('Failed to fetch group chat messages');
        }

        return response.data;
    };

    return useQuery(['groupChatMessages', id, before], getGroupChatMessagesRequest, {
        onError: (error) => {
            const err = error as Error;
            toast.error(err.message);
        },
    });
};
