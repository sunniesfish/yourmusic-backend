import Deque from 'double-ended-queue';

// Define Request type
type ApiRequest = () => Promise<void>;

// Add configuration options interface
interface ApiRateLimiterOptions {
  maxPerSecond: number;
  maxPerMinute: number;
  maxQueueSize: number;
}

class ApiRateLimiter {
  private isProcessing: boolean = false;
  private lastSecondRequests: Deque<number> = new Deque();
  private lastMinuteRequests: Deque<number> = new Deque();
  private queue: Deque<ApiRequest> = new Deque();
  private maxPerSecond: number;
  private maxPerMinute: number;
  private maxQueueSize: number;
  private static readonly SECOND_IN_MS = 1000;
  private static readonly MINUTE_IN_MS = 60000;
  private static readonly PROCESS_INTERVAL = 1000;

  constructor(options: ApiRateLimiterOptions) {
    this.maxPerSecond = options.maxPerSecond;
    this.maxPerMinute = options.maxPerMinute;
    this.maxQueueSize = options.maxQueueSize;
    // Execute requests every second
    setInterval(() => {
      if (!this.isProcessing) this.processQueue();
    }, ApiRateLimiter.PROCESS_INTERVAL);
  }

  private processQueue() {
    this.isProcessing = true;
    try {
      // Current time
      const now = Date.now();

      // Update request history for second and minute intervals
      // Update request history (Deque allows O(1) deletion from front)
      while (
        this.lastSecondRequests.peekFront() &&
        now - this.lastSecondRequests.peekFront() >= ApiRateLimiter.SECOND_IN_MS
      ) {
        this.lastSecondRequests.shift();
      }
      while (
        this.lastMinuteRequests.peekFront() &&
        now - this.lastMinuteRequests.peekFront() >= ApiRateLimiter.MINUTE_IN_MS
      ) {
        this.lastMinuteRequests.shift();
      }

      // Calculate available request slots
      const availableInSecond =
        this.maxPerSecond - this.lastSecondRequests.length;
      const availableInMinute =
        this.maxPerMinute - this.lastMinuteRequests.length;
      const availableRequests = Math.min(availableInSecond, availableInMinute);

      // Execute requests
      for (let i = 0; i < availableRequests && this.queue.length > 0; i++) {
        const request = this.queue.shift(); // Remove request from queue
        if (request) {
          this.lastSecondRequests.push(now); // Record for second interval
          this.lastMinuteRequests.push(now); // Record for minute interval
          try {
            request(); // Execute request
          } catch (error) {
            console.error('Error executing request:', error);
          }
        }
      }
    } finally {
      this.isProcessing = false;
      if (this.queue.length > 0) this.processQueue();
    }
  }

  addRequest(request: ApiRequest) {
    if (this.queue.length >= this.maxQueueSize) {
      throw new Error('Rate limiter queue is full');
    }
    this.queue.push(request); // Add request to queue
    if (!this.isProcessing) this.processQueue();
  }
}

export default ApiRateLimiter;
