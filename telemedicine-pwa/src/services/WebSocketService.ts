export class WebSocketService {
    private ws: WebSocket | null = null;
    private maxRetries: number;
    private retryCount: number;
    private reconnectDelay: number;
    private url: string;

    constructor(url: string, maxRetries = 5) {
        this.url = url;
        this.maxRetries = maxRetries;
        this.retryCount = 0;
        this.reconnectDelay = 1000;
    }

    connect() {
        try {
            this.ws = new WebSocket(this.url);
            this.setupEventListeners();
        } catch (error) {
            this.handleConnectionError(error);
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