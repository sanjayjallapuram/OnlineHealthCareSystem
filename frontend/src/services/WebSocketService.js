import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';
import { API_BASE_URL } from '../config';

class WebSocketService {
    constructor() {
        this.stompClient = null;
        this.messageHandlers = new Map();
    }

    connect(onConnected) {
        // Use SockJS which handles the protocol switching automatically
        const socket = new SockJS(`${API_BASE_URL}/ws`);
        this.stompClient = Stomp.over(socket);
        
        // Disable debug logs in production
        if (process.env.NODE_ENV === 'production') {
            this.stompClient.debug = null;
        }
        
        this.stompClient.connect({}, () => {
            if (onConnected) {
                onConnected();
            }
        }, (error) => {
        });
    }

    subscribe(roomId, messageHandler) {
        if (!this.stompClient) {
            return;
        }

        const subscription = this.stompClient.subscribe(`/topic/room/${roomId}`, (message) => {
            try {
                const payload = JSON.parse(message.body);
                messageHandler(payload);
            } catch (error) {
            }
        });

        this.messageHandlers.set(roomId, subscription);
    }

    unsubscribe(roomId) {
        const subscription = this.messageHandlers.get(roomId);
        if (subscription) {
            subscription.unsubscribe();
            this.messageHandlers.delete(roomId);
        }
    }

    sendMessage(roomId, message) {
        if (!this.stompClient) {
            return;
        }

        this.stompClient.send(`/app/room/${roomId}`, {}, JSON.stringify(message));
    }

    disconnect() {
        if (this.stompClient) {
            this.stompClient.disconnect();
            this.stompClient = null;
        }
    }
}

const webSocketServiceInstance = new WebSocketService();
export default webSocketServiceInstance;

 