import React, { useEffect, useState, useCallback } from 'react';
import { User } from '../types/User';
import Home from '../pages/HomePage';
import LeftPanel from '../components/LeftPanel';
import Chat from '../components/Chat';
import NewChat from '../components/NewChat';
import { GroupChat } from '../types/GroupChat';
import Profile from '../components/Profile';
import UsersView from '../components/UsersView';
import GroupChatsView from '../components/GroupChatsView';
import RightPanel from '../components/RightPanel';
import { useLogout } from '../api/UserApi';
import { toast } from 'sonner';
import { LogOut, MessageSquare, UserCircle } from 'lucide-react';
import apiClient from '../api/axios';

interface ChatPageProp {
    user: User;
    loggedIn: boolean;
    setUser: (user: User) => void;
}

interface GroupChatsResponse {
    groupChats: GroupChat[];
}

const ChatPage: React.FC<ChatPageProp> = ({ user, loggedIn, setUser }) => {
    const logout = useLogout();
    const [tab, setTab] = useState<string>('');
    const [groupChatId, setGroupChatId] = useState<number | undefined>(undefined);
    const [groupChats, setGroupChats] = useState<GroupChat[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchGroupChats = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await apiClient.get<GroupChatsResponse>('/groupchat/get');
            setGroupChats(response.data.groupChats);
        } catch (error) {
            toast.error('Failed to fetch chats');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (loggedIn) {
            fetchGroupChats();
        }
    }, [loggedIn, fetchGroupChats]);

    const handleLogout = async () => {
        try {
            await logout.mutateAsync();

        } catch (error) {
            console.error('Logout error caught in component:', error);
        }
    };

    const refreshChats = useCallback((fetch: boolean) => {
        if (fetch) {
            fetchGroupChats();
        } else {
            setGroupChats(prev => [...prev]);
        }
    }, [fetchGroupChats]);

    const tabButtonClick = useCallback((newTab: string): void => {
        newTab === tab && newTab !== "chat" ? setTab('') : setTab(newTab);
    }, [tab]);

    return (
        <div className="flex h-screen bg-gray-100">
            {loggedIn ? (
                <div className="flex w-full h-full max-w-7xl mx-auto">
                    <LeftPanel>
                        <div className="p-4 border-b border-gray-200">
                            <UsersView users={[user]} />
                        </div>

                        <div className="flex justify-between px-4 py-3 border-b border-gray-200">
                            <button
                                onClick={() => tabButtonClick("newChat")}
                                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center"
                            >
                                <MessageSquare className="w-4 h-4 mr-2" />
                                New Chat
                            </button>
                            <button
                                onClick={() => tabButtonClick("profile")}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center"
                            >
                                <UserCircle className="w-4 h-4 mr-2" />
                                Profile
                            </button>
                        </div>

                        <div className="px-4 py-3 border-b border-gray-200">
                            <button
                                onClick={handleLogout}
                                className="w-full px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 flex items-center justify-center"
                                disabled={logout.isLoading}
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                {logout.isLoading ? 'Logging out...' : 'Logout'}
                            </button>
                        </div>

                        {isLoading ? (
                            <div className="flex justify-center items-center p-4">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                            </div>
                        ) : (
                            <GroupChatsView
                                groupChats={groupChats}
                                tab={tab}
                                setTab={setTab}
                                fetchGroupChats={fetchGroupChats}
                                groupChatId={groupChatId}
                                setGroupChatId={setGroupChatId}
                            />
                        )}
                    </LeftPanel>

                    <RightPanel>
                        {tab === 'newChat' && (
                            <NewChat
                                user={user}
                                groupChats={groupChats}
                                setGroupChats={setGroupChats}
                                setTab={setTab}
                            />
                        )}
                        {tab === 'profile' && (
                            <Profile user={user} setUser={setUser} />
                        )}
                        {tab === 'chat' && groupChats.map((groupChat) =>
                            groupChat.id === groupChatId ? (
                                <Chat
                                    key={groupChat.id}
                                    groupChat={groupChat}
                                    refreshChats={refreshChats}
                                    user={user}
                                    setTab={setTab}
                                />
                            ) : null
                        )}
                        {tab === '' && (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                    <h2 className="text-2xl font-semibold text-gray-800">Welcome to the Chat App!</h2>
                                    <p className="mt-2 text-gray-600">Select a chat or start a new conversation</p>
                                </div>
                            </div>
                        )}
                    </RightPanel>
                </div>
            ) : (
                <Home />
            )}
        </div>
    );
};

export default ChatPage;