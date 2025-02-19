import React, { ChangeEvent, useState, useCallback } from 'react';
import "../css/global.css";
import { User } from '../types/User';
import UsersView from './UsersView';
import { GroupChat } from '../types/GroupChat';
import apiClient from '../api/axios';

interface NewChatProp {
    user: User;
    groupChats: GroupChat[];
    setGroupChats: (groupChats: GroupChat[]) => void;
    setTab: (newTab: string) => void;
}

const NewChat: React.FC<NewChatProp> = ({ user, groupChats, setGroupChats, setTab }) => {
    const [users, setUsers] = useState<User[]>([user]);
    const [notFoundUsername, setNotFoundUsername] = useState<string>('');
    const [chatNameInput, setChatNameInput] = useState<string>('');
    const [usernameInput, setUsernameInput] = useState<string>('');

    const chatNameInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        setChatNameInput(e.target.value);
    };

    const usernameInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        setUsernameInput(e.target.value);
    };

    const clear = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setUsers([user]);
        setUsernameInput('');
        setNotFoundUsername('');
    }, [user]);

    const searchUser = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        if (!usernameInput.trim()) return;

        apiClient
            .get("/api/users/search", {
                params: { username: usernameInput }
            })
            .then((res) => {
                const user: User = res.data.user;
                if (!user) {
                    setNotFoundUsername(usernameInput);
                } else {
                    setUsers(prev => [...prev.filter(u => u.id !== user.id), user]);
                    setNotFoundUsername('');
                }
            })
            .catch((error) => {
                console.error('Error searching user:', error);
            });
    }, [usernameInput]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
    };

    const createChat = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        if (!chatNameInput.trim() || users.length < 2) return;

        const usernames = users.map(user => user.username);

        apiClient
            .post("/api/groupchat/new", {
                name: chatNameInput,
                usernames: usernames
            })
            .then((res) => {
                const newGroupChat: GroupChat = res.data.groupChat;
                setGroupChats([newGroupChat, ...groupChats]);
                setTab('');
            })
            .catch((error) => {
                console.error('Error creating chat:', error);
            });
    }, [chatNameInput, users, groupChats, setGroupChats, setTab]);

    return (
        <div className="p-5 overflow-auto h-100">
            <div className="fw-bold fs-3">
                New Chat
            </div>
            <br />
            <form onSubmit={handleSubmit}>
                <div>Chat Name</div>
                <input
                    type="text"
                    className="form-control"
                    name="name"
                    placeholder="Name"
                    value={chatNameInput}
                    onChange={chatNameInputChange}
                    autoComplete='off'
                />
                <br />
                <div>Add Users</div>
                {notFoundUsername && (
                    <div className="bg-danger p-3 m-2">
                        User '{notFoundUsername}' does not exist.
                    </div>
                )}
                <input
                    type="text"
                    className="form-control"
                    name="username"
                    placeholder="Search User"
                    value={usernameInput}
                    onChange={usernameInputChange}
                    autoComplete='off'
                />
                <div className="my-2">
                    <button
                        type="button"
                        className="btn-success btn mx-2"
                        onClick={searchUser}
                    >
                        Search
                    </button>
                    <button
                        type="button"
                        className="btn-light btn mx-2"
                        onClick={clear}
                    >
                        Clear
                    </button>
                </div>
                <UsersView users={users} />
                <button
                    type="button"
                    className="btn btn-lg btn-success my-4"
                    onClick={createChat}
                    disabled={!chatNameInput.trim() || users.length < 2}
                >
                    Create
                </button>
            </form>
        </div>
    );
};

export default NewChat;