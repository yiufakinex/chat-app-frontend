import React, { ChangeEvent, useState } from 'react';
import "../css/global.css";
import { DefaultPicture, User } from '../types/User';
import apiClient from '../api/axios'

interface ProfileProp {
    user: User,
    setUser: (user: User) => void,
}

const Profile: React.FC<ProfileProp> = ({ user, setUser }) => {
    const [displayNameInput, setDisplayNameInput] = useState<string>('');
    const [success, setSuccess] = useState<boolean | null>(null);

    const displayNameInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        setDisplayNameInput(e.target.value);
    }

    const updateDisplayName = () => {
        apiClient
            .patch("/api/users/update/display_name", null, {
                params: { displayName: displayNameInput }
            })
            .then((res) => {
                const newUser: User = res.data.user;
                setUser(newUser);
                setSuccess(true);
            })
            .catch((error) => {
                console.error('Error updating display name:', error);
                setSuccess(false);
            });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateDisplayName();
    }

    return (
        <>
            <div className="p-5 overflow-auto h-100">
                <div className="fw-bold fs-3">
                    Profile
                </div>
                <br />
                <div>
                    <img
                        src={user.avatarURL || DefaultPicture}
                        alt={`${user.username}`}
                        title={`@${user.username}`}
                        height="50"
                        width="50"
                        className="rounded"
                    />
                </div>
                <br />
                <div className="fs-5">
                    Username: <span className="fw-bold">{user.username}</span>
                </div>
                <br />
                {success === true && <div className="bg-success p-3 m-2">Success</div>}
                {success === false && <div className="bg-danger p-3 m-2">Error</div>}
                <div className="fs-5 bw-bold my-1">
                    Display Name
                </div>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        className="form-control my-2"
                        name="displayName"
                        placeholder={user.displayName}
                        value={displayNameInput}
                        onChange={displayNameInputChange}
                        autoComplete='off'
                    />
                    <button type="submit" className="btn btn-lg btn-success my-4">Update</button>
                </form>
                <br />
                <br />
                <div className="fs-5">
                    Role: <span className="fw-bold">{user.role}</span>
                </div>
                <br />
                <div className="fs-5">
                    Account Created: <span className="fw-bold">{new Date(user.createdAt * 1000).toLocaleDateString("en-US")}</span>
                </div>
            </div>
        </>
    )
}

export default Profile;
