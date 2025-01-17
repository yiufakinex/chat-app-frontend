import { User } from "./User";
import { GroupChat } from "./GroupChat";

export type Message = {
    id: number,
    content: string,
    createdAt: number,
    modifiedAt: number,
    messageType: MessageType,
    sender: User
    groupChat?: GroupChat;
}

export type MessageType = 'USER_JOIN' | 'USER_LEAVE' | 'USER_CHAT' | 'USER_RENAME';