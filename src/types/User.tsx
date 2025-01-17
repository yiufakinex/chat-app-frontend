export type User = {
    id: number;
    username: string;
    displayName: string;
    avatarURL?: string;
    authenticationProvider: AuthenticationProvider;
    role: Role;
    createdAt: number;
}

export const DefaultPicture = 'https://lh3.googleusercontent.com/-cXXaVVq8nMM/AAAAAAAAAAI/AAAAAAAAAKI/_Y1WfBiSnRI/photo.jpg';

export type Role = 'NEW_USER' | 'USER' | 'ADMIN' | 'BANNED';

export type AuthenticationProvider = 'GITHUB' | 'GOOGLE' | 'DISCORD';