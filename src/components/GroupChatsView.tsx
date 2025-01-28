import React, { useState, useEffect, useCallback } from 'react';
import { Bell, MessageCircle } from 'lucide-react';
import { webSocketApi } from '../api/WebSocketApi';
import { GroupChat } from '../types/GroupChat';
import { Message } from '../types/Message';
import { User } from '../types/User';

interface GroupChatsViewProps {
    groupChats: GroupChat[];
    tab: string;
    setTab: (tab: string) => void;
    fetchGroupChats: () => void;
    groupChatId: number | undefined;
    setGroupChatId: (id: number) => void;
    user: User;
}

interface Notification {
    type: 'message' | 'room';
    title: string;
    message: string;
    chatId: number;
}

interface AlertProps {
    title: string;
    children: React.ReactNode;
    icon?: React.ReactNode;
    onClick?: () => void;
}

const Alert: React.FC<AlertProps> = ({ title, children, icon, onClick }) => (
    <div
        onClick={onClick}
        className="bg-white border-l-4 border-blue-500 shadow-lg w-80 p-4 cursor-pointer"
        role={onClick ? "button" : "alert"}
    >
        <div className="flex items-start">
            {icon && <div className="mt-0.5 mr-3">{icon}</div>}
            <div>
                <h5 className="text-sm font-medium mb-1">{title}</h5>
                <div className="text-sm text-gray-600 line-clamp-2">{children}</div>
            </div>
        </div>
    </div>
);

export const createNotification = (type: 'message' | 'room', title: string, message: string, chatId: number): Notification => ({
    type,
    title,
    message,
    chatId
});

const GroupChatsView: React.FC<GroupChatsViewProps> = ({
    groupChats,
    tab,
    setTab,
    fetchGroupChats,
    groupChatId,
    setGroupChatId,
    user
}) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const addNotification = useCallback((notification: Notification) => {
        setNotifications(prev => [...prev, notification]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n !== notification));
        }, 5000);
    }, []);

    useEffect(() => {

        groupChats.forEach(chat => {
            webSocketApi.subscribeToChat(chat.id, (newMessage: Message) => {
                if (tab !== 'chat' || groupChatId !== chat.id) {
                    addNotification(createNotification(
                        'message',
                        `New Message in ${chat.name}`,
                        `${newMessage.sender.username}: ${newMessage.content}`,
                        chat.id
                    ));
                }
            });
        });


        webSocketApi.subscribeToNewChats(user.id, (notification) => {
            addNotification(createNotification(
                'room',
                'New Chat Added',
                notification.content,
                notification.chatId
            ));
            fetchGroupChats();
        });

        return () => {

            groupChats.forEach(chat => {
                webSocketApi.unsubscribeFromChat(chat.id);
            });
            webSocketApi.unsubscribeFromNewChats(user.id);
        };
    }, [groupChats, tab, groupChatId, user.id, fetchGroupChats, addNotification]);

    const setChat = (groupChat: GroupChat) => {
        setTab("chat");
        setGroupChatId(groupChat.id);
    };

    const refreshChats = () => {
        fetchGroupChats();
        if (tab === "chat") {
            setTab("");
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="fixed top-4 right-4 z-50 space-y-2">
                {notifications.map((notification, index) => (
                    <Alert
                        key={index}
                        title={notification.title}
                        icon={notification.type === 'message' ?
                            <MessageCircle className="h-4 w-4 text-blue-500" /> :
                            <Bell className="h-4 w-4 text-blue-500" />
                        }
                        onClick={() => setChat(groupChats.find(chat => chat.id === notification.chatId)!)}
                    >
                        {notification.message}
                    </Alert>
                ))}
            </div>

            <div className="p-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Chats</h2>
                    <button
                        onClick={refreshChats}
                        className="p-2 hover:bg-gray-100 rounded-full"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-arrow-clockwise" viewBox="0 0 16 16">
                            <path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z" />
                            <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z" />
                        </svg>
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {groupChats.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                        No chats to load. Create a new chat or get invited to one!
                    </div>
                ) : (
                    groupChats.map(chat => (
                        <div
                            key={chat.id}
                            onClick={() => setChat(chat)}
                            className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${chat.id === groupChatId && tab === 'chat' ? 'bg-gray-100' : ''
                                }`}
                        >
                            <div className="flex justify-between">
                                <h3 className="font-medium truncate">{chat.name}</h3>
                                <span className="text-sm text-gray-500">
                                    {new Date(chat.lastMessageAt * 1000).toLocaleDateString()}
                                </span>
                            </div>
                            <div className="mt-1 text-sm text-gray-500">
                                {chat.users.map(user => (
                                    <span key={user.username} className="mr-2">@{user.username}</span>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default GroupChatsView;