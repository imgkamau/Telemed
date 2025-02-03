export class WebSocketService {
    private ws: WebSocket | null = null;
    private maxRetries: number;
    private retryCount: number;
    private reconnectDelay: number;
    private url: string;

    constructor(url: string, maxRetries = 3) {
        this.url = url;
        this.maxRetries = maxRetries;
        this.retryCount = 0;
        this.reconnectDelay = 1000;
    }

    connect() {
        if (typeof window === 'undefined' || window.location.protocol !== 'https:') {
            console.log('WebSocket connection skipped - not in browser or not HTTPS');
            return;
        }

        try {
            this.ws = new WebSocket(this.url);
            this.setupEventListeners();
        } catch (error) {
            console.warn('WebSocket connection failed:', error);
        }
    }

    private setupEventListeners() {
        if (!this.ws) return;

        this.ws.onopen = () => {
            console.log('WebSocket connected successfully');
            this.retryCount = 0;
            this.reconnectDelay = 1000;
        };

        this.ws.onerror = (error) => {
            this.handleConnectionError(error);
        };

        this.ws.onclose = () => {
            this.handleConnectionError(new Error('WebSocket connection closed'));
        };
    }

    private handleConnectionError(error: any) {
        console.error('WebSocket connection error:', error);
        if (this.retryCount < this.maxRetries) {
            setTimeout(() => {
                this.retryCount++;
                this.reconnectDelay *= 2; // Exponential backoff
                this.connect();
            }, this.reconnectDelay);
        }
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
}