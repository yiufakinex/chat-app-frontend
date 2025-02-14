import { useQuery, useMutation } from 'react-query';
import apiClient from './axios';
import { toast } from 'sonner';
import { Message } from '../types/Message';

interface NewMessageForm {
    content: string;
}

export const useSendMessage = (id: number) => {
    const sendMessageRequest = async (newMessageForm: NewMessageForm) => {
        const response = await apiClient.post(`/api/message/send/${id}`, newMessageForm);

        if (response.status !== 200) {
            throw new Error('Failed to send message');
        }

        return response.data;
    };

    return useMutation(sendMessageRequest, {
        onError: (error: Error) => {
            toast.error(error.message);
        },
        onSuccess: () => {
            toast.success('Message sent successfully');
        },
    });
};

export const useGetMessages = (id: number, before?: number) => {
    const getMessagesRequest = async () => {
        const response = await apiClient.get<Message[]>(`/api/message/${id}/get`, {
            params: { before },
        });

        if (response.status !== 200) {
            throw new Error('Failed to fetch messages');
        }

        return response.data;
    };

    return useQuery(['messages', id, before], getMessagesRequest, {
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });
};
