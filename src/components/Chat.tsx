import React, { useState, useRef, useCallback, useEffect } from 'react';
import "../css/global.css";
import { GroupChat } from '../types/GroupChat';
import { Message } from '../types/Message';
import MessageView from './MessageView';
import InfiniteScroll from 'react-infinite-scroll-component';
import UsersView from './UsersView';
import { User } from '../types/User';
import { Settings, Send } from 'lucide-react';
import apiClient from '../api/axios';
import { webSocketApi } from '../api/WebSocketApi';

const PAGE_SIZE = 30;
const MESSAGE_RATE_LIMIT = 500;

interface ChatProp {
    groupChat: GroupChat;
    refreshChats: (fetch: boolean) => void;
    user: User;
    setTab: (tab: string) => void;
}

interface MessageResponse {
    content: Message[];
    hasNext: boolean;
}

const Chat: React.FC<ChatProp> = ({ groupChat, refreshChats, user, setTab }) => {
    const messageRef = useRef<HTMLInputElement>(null);
    const renameRef = useRef<HTMLInputElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout>();
    const scrollRef = useRef<HTMLDivElement>(null);

    const [chatSettingsMenu, setChatSettingsMenu] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [searchedUser, setSearchedUser] = useState<User | null>(null);
    const [pendingMessages, setPendingMessages] = useState<Set<string>>(new Set());

    const [messages, setMessages] = useState<Message[]>([]);
    const [pageNum, setPageNum] = useState<number>(0);
    const [hasMore, setHasMore] = useState<boolean>(true);
    const [lastMessageSent, setLastMessageSent] = useState<number>(0);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
    const lastFetchTimeRef = useRef<number>(Date.now());

    const scrollToBottom = () => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        webSocketApi.subscribeToChat(groupChat.id, (newMessage: Message) => {
            if (newMessage.sender.id === user.id && pendingMessages.has(newMessage.content)) {
                setPendingMessages(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(newMessage.content);
                    return newSet;
                });

                setMessages(prev => prev.map(m =>
                    (m.id < 0 && m.content === newMessage.content) ? newMessage : m
                ));
            } else {
                setMessages(prev => [newMessage, ...prev]);
            }
            scrollToBottom();
        });

        webSocketApi.subscribeToTyping(groupChat.id, (username, isTyping) => {
            if (username !== user.username) {
                setTypingUsers((prev) => {
                    const newSet = new Set(prev);
                    if (isTyping) {
                        newSet.add(username);
                    } else {
                        newSet.delete(username);
                    }
                    return newSet;
                });
            }
        });

        return () => {
            webSocketApi.unsubscribeFromChat(groupChat.id);
        };
    }, [groupChat.id, user.id, user.username, pendingMessages]);


    const showError = useCallback((message: string, duration: number = 3000) => {
        setErrorMessage(message);
        setTimeout(() => setErrorMessage(''), duration);
    }, []);


    const loadOldMessages = useCallback(async () => {
        if (isLoading) return;

        try {
            setIsLoading(true);
            const response = await apiClient.get<MessageResponse>(`/message/${groupChat.id}/get`, {
                params: {
                    pageSize: PAGE_SIZE,
                    pageNum,
                    before: lastFetchTimeRef.current
                }
            });

            const newMessages = response.data.content;
            if (newMessages.length > 0) {
                setMessages(prevMessages => {
                    const messageIds = new Set(prevMessages.map(m => m.id));
                    const uniqueNewMessages = newMessages.filter(m => !messageIds.has(m.id));
                    return [...prevMessages, ...uniqueNewMessages];
                });
                setPageNum(prev => prev + 1);
            }
            setHasMore(response.data.hasNext);
        } catch (error) {
            console.error('Error loading messages:', error);
        } finally {
            setIsLoading(false);
        }
    }, [groupChat.id, pageNum, isLoading]);



    useEffect(() => {
        let mounted = true;

        const loadInitialMessages = async () => {
            try {
                setIsLoading(true);
                const response = await apiClient.get<MessageResponse>(`/message/${groupChat.id}/get`, {
                    params: {
                        pageSize: PAGE_SIZE,
                        pageNum: 0,
                        before: lastFetchTimeRef.current
                    }
                });


                if (mounted) {
                    setMessages(response.data.content);
                    setPageNum(response.data.content.length > 0 ? 1 : 0);
                    setHasMore(response.data.hasNext);
                }
            } catch (error) {
                console.error('Error loading initial messages:', error);
            } finally {
                if (mounted) {
                    setIsLoading(false);
                }
            }
        };


        setMessages([]);
        setPageNum(0);
        setHasMore(true);
        lastFetchTimeRef.current = Date.now();

        loadInitialMessages();


        return () => {
            mounted = false;
        };
    }, [groupChat.id]);


    const sendMessage = useCallback(async () => {
        const currentTime = Date.now();
        if (currentTime - lastMessageSent < MESSAGE_RATE_LIMIT) {
            showError('Please wait before sending another message.', MESSAGE_RATE_LIMIT);
            return;
        }

        const messageContent = messageRef.current?.value?.trim();
        if (!messageContent) return;


        setPendingMessages(prev => new Set(prev).add(messageContent));

        const optimisticMessage: Message = {
            id: -Date.now(),
            content: messageContent,
            createdAt: Date.now() / 1000,
            modifiedAt: Date.now() / 1000,
            messageType: 'USER_CHAT',
            sender: user
        };

        setMessages(prev => [optimisticMessage, ...prev]);

        try {
            await webSocketApi.sendMessage(groupChat.id, messageContent);
            if (messageRef.current) messageRef.current.value = '';
            setLastMessageSent(currentTime);
        } catch (error) {
            setPendingMessages(prev => {
                const newSet = new Set(prev);
                newSet.delete(messageContent);
                return newSet;
            });
            setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
            showError('Failed to send message');
        }
    }, [groupChat.id, lastMessageSent, showError, user]);


    const searchUser = useCallback(async () => {
        const username = searchRef.current?.value?.trim();
        if (!username) return;

        try {
            const response = await apiClient.get<{ user: User | null }>('/users/search', {
                params: { username }
            });
            setSearchedUser(response.data.user);
        } catch (error) {
            console.error('Error searching user:', error);
        }
    }, [setSearchedUser]);


    const renameChat = useCallback(async () => {
        const newName = renameRef.current?.value?.trim();
        if (!newName) return;

        await apiClient.patch(`/groupchat/${groupChat.id}/rename`, {
            name: newName
        });
        if (renameRef.current) {
            renameRef.current.value = '';
        }
        refreshChats(true);
    }, [groupChat.id, refreshChats]);

    const addUser = useCallback(async () => {
        if (!searchedUser) return;

        await apiClient.post(`/groupchat/${groupChat.id}/users/add`, {
            username: searchedUser.username
        });
        if (searchRef.current) {
            searchRef.current.value = '';
        }
        setSearchedUser(null);
        refreshChats(true);
    }, [groupChat.id, searchedUser, refreshChats]);

    const leaveChat = useCallback(async () => {
        await apiClient.post(`/groupchat/${groupChat.id}/users/remove`);
        setTab('');
        refreshChats(true);
    }, [groupChat.id, refreshChats, setTab]);

    const handleTyping = useCallback(() => {
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        webSocketApi.sendTypingNotification(groupChat.id, true);

        typingTimeoutRef.current = setTimeout(() => {
            webSocketApi.sendTypingNotification(groupChat.id, false);
        }, 2000);
    }, [groupChat.id]);


    return (
        <div className="flex flex-col h-full">
            {/* Chat header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800">
                    {groupChat.name}
                </h2>
                <button
                    onClick={() => setChatSettingsMenu(!chatSettingsMenu)}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
                >
                    <Settings className="w-5 h-5" />
                </button>
            </div>

            {/* Error message display */}
            {errorMessage && (
                <div className="px-4 py-3 bg-red-100 border border-red-400 text-red-700 rounded mx-4 mt-4">
                    {errorMessage}
                </div>
            )}

            {/* Chat content - either settings menu or messages */}
            {chatSettingsMenu ? (
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="space-y-8">
                        {/* Rename Chat Section */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold mb-4">Rename Chat</h3>
                            <input
                                type="text"
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder={groupChat.name}
                                ref={renameRef}
                            />
                            <button
                                onClick={renameChat}
                                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                            >
                                Rename
                            </button>
                        </div>

                        {/* Add Member Section */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold mb-4">Add Member</h3>
                            <div className="space-y-4">
                                <div className="flex space-x-2">
                                    <input
                                        type="text"
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="Search User"
                                        ref={searchRef}
                                    />
                                    <button
                                        onClick={searchUser}
                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                                    >
                                        Search
                                    </button>
                                </div>
                                {searchedUser && (
                                    <div>
                                        <UsersView users={[searchedUser]} />
                                        <button
                                            onClick={addUser}
                                            className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indio-700"
                                        >
                                            Add User
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Members List Section */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold mb-4">Chat Members</h3>
                            <UsersView users={groupChat.users} />
                        </div>

                        {/* Leave Chat Button */}
                        <button
                            onClick={leaveChat}
                            className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                        >
                            Leave Chat
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    {/* Messages Section */}
                    <div
                        className="flex-1 overflow-y-auto bg-gray-50 p-4"
                        id="messagesScroll"
                    >
                        {/* Typing indicator */}
                        {typingUsers.size > 0 && (
                            <div className="text-sm text-gray-500 italic p-2">
                                {Array.from(typingUsers).join(', ')}
                                {typingUsers.size === 1 ? ' is ' : ' are '}
                                typing...
                            </div>
                        )}

                        <InfiniteScroll
                            dataLength={messages.length}
                            next={loadOldMessages}
                            className="flex flex-col-reverse"
                            inverse={true}
                            hasMore={hasMore}
                            loader={
                                <div className="flex justify-center py-4">
                                    <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            }
                            endMessage={
                                <div className="text-center py-4 text-gray-500">
                                    Beginning of conversation
                                </div>
                            }
                            scrollableTarget="messagesScroll"
                        >
                            {messages.map((message, index) => (
                                <MessageView message={message} key={`${message.id}-${index}`} />
                            ))}
                        </InfiniteScroll>
                        <div ref={scrollRef} />
                    </div>

                    {/* Message Input Section */}
                    <div className="px-4 py-3 border-t border-gray-200">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                sendMessage();
                            }}
                            className="flex items-center space-x-2"
                        >
                            <input
                                type="text"
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder={`Message ${groupChat.name}`}
                                ref={messageRef}
                                onKeyPress={handleTyping}
                            />
                            <button
                                type="submit"
                                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center"
                            >
                                <Send className="w-4 h-4 mr-2" />
                                Send
                            </button>
                        </form>
                    </div>
                </>
            )}
        </div>
    );
};

export default Chat;