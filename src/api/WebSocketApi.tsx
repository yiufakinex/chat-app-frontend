import { Client, Message as StompMessage } from '@stomp/stompjs';
import { Message } from '../types/Message';
import SockJS from 'sockjs-client';

class WebSocketApi {
    private client: Client | null = null;
    private subscriptions: { [key: string]: () => void } = {};
    private connected: boolean = false;
    private connectPromise: Promise<void> | null = null;

    async ensureConnected() {
        if (this.connected) {
            return;
        }

        if (!this.connectPromise) {
            this.connectPromise = new Promise((resolve, reject) => {
                this.client = new Client({
                    webSocketFactory: () => new SockJS(`${process.env.REACT_APP_AUTH_BASE_URL}/ws`),
                    connectHeaders: {},
                    debug: function (str) {
                        console.log('STOMP: ' + str);
                    },
                    reconnectDelay: 5000,
                    heartbeatIncoming: 4000,
                    heartbeatOutgoing: 4000,
                    onConnect: () => {
                        this.connected = true;
                        resolve();
                    },
                    onStompError: (frame) => {
                        console.error('STOMP error:', frame);
                        reject(new Error('STOMP error'));
                    }
                });

                this.client.activate();
            });
        }

        await this.connectPromise;
    }

    async subscribeToChat(chatId: number, onMessageReceived: (message: Message) => void): Promise<void> {
        try {
            await this.ensureConnected();

            if (!this.client?.connected) {
                throw new Error('WebSocket not connected');
            }

            if (this.subscriptions[`chat_${chatId}`]) {
                this.subscriptions[`chat_${chatId}`]();
                delete this.subscriptions[`chat_${chatId}`];
            }

            const subscription = this.client.subscribe(
                `/topic/chat.${chatId}`,
                (message: StompMessage) => {
                    const receivedMessage = JSON.parse(message.body) as Message;
                    onMessageReceived(receivedMessage);
                }
            );

            this.subscriptions[`chat_${chatId}`] = () => subscription.unsubscribe();
        } catch (error) {
            console.error('Failed to subscribe to chat:', error);
        }
    }

    async subscribeToTyping(chatId: number, onTyping: (username: string, isTyping: boolean) => void): Promise<void> {
        try {
            await this.ensureConnected();

            if (!this.client?.connected) {
                throw new Error('WebSocket not connected');
            }

            const subscription = this.client.subscribe(
                `/topic/chat.${chatId}.typing`,
                (message: StompMessage) => {
                    const notification = JSON.parse(message.body);
                    onTyping(notification.username, notification.typing);
                }
            );

            this.subscriptions[`typing_${chatId}`] = () => subscription.unsubscribe();
        } catch (error) {
            console.error('Failed to subscribe to typing:', error);
        }
    }

    async sendMessage(chatId: number, content: string): Promise<void> {
        try {
            await this.ensureConnected();

            if (!this.client?.connected) {
                throw new Error('WebSocket not connected');
            }

            this.client.publish({
                destination: '/app/chat.send',
                body: JSON.stringify({
                    chatId,
                    content
                })
            });
        } catch (error) {
            console.error('Failed to send message:', error);
            throw error;
        }
    }

    async sendTypingNotification(chatId: number, isTyping: boolean): Promise<void> {
        try {
            await this.ensureConnected();

            if (!this.client?.connected) {
                throw new Error('WebSocket not connected');
            }

            this.client.publish({
                destination: '/app/chat.typing',
                body: JSON.stringify({
                    chatId,
                    typing: isTyping
                })
            });
        } catch (error) {
            console.error('Failed to send typing notification:', error);
        }
    }

    unsubscribeFromChat(chatId: number): void {
        const unsubscribeChat = this.subscriptions[`chat_${chatId}`];
        const unsubscribeTyping = this.subscriptions[`typing_${chatId}`];

        if (unsubscribeChat) {
            unsubscribeChat();
            delete this.subscriptions[`chat_${chatId}`];
        }

        if (unsubscribeTyping) {
            unsubscribeTyping();
            delete this.subscriptions[`typing_${chatId}`];
        }
    }

    disconnect(): void {
        if (this.client?.connected) {
            Object.values(this.subscriptions).forEach(unsubscribe => unsubscribe());
            this.subscriptions = {};
            this.client.deactivate();
            this.connected = false;
            this.connectPromise = null;
        }
    }
}

export const webSocketApi = new WebSocketApi();