import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { join } from 'path';
import { Worker } from 'worker_threads';
import { PlaylistJSON } from '../dto/playlists.dto';
import { ScraperResponse, ScraperJob } from './scraper.types';
import { scraperConfigService } from './scraper.config';

@Injectable()
export class ScraperService implements OnModuleInit, OnModuleDestroy {
  private workerPool: Worker[] = [];
  private busyWorkers = new Set<Worker>();
  private readonly config = scraperConfigService.getConfig();

  async onModuleInit() {
    await this.initializeWorkerPool();
  }

  async onModuleDestroy() {
    await this.terminateAllWorkers();
  }

  /**
   * Initialize worker pool with configured number of workers
   */
  private async initializeWorkerPool(): Promise<void> {
    for (let i = 0; i < this.config.maxWorkers; i++) {
      const worker = this.createWorker();
      this.workerPool.push(worker);
    }
  }

  /**
   * Create a new worker instance
   */
  private createWorker(): Worker {
    const worker = new Worker(join(__dirname, 'scraper.worker.js'));

    // Handle unexpected worker termination
    worker.on('exit', (code) => {
      if (code !== 0) {
        this.handleWorkerFailure(worker);
      }
    });

    return worker;
  }

  /**
   * Get an available worker from the pool
   */
  private async getAvailableWorker(): Promise<Worker> {
    const availableWorker = this.workerPool.find(
      (worker) => !this.busyWorkers.has(worker),
    );

    if (availableWorker) {
      this.busyWorkers.add(availableWorker);
      return availableWorker;
    }

    // Wait for an available worker
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        const worker = this.workerPool.find((w) => !this.busyWorkers.has(w));
        if (worker) {
          clearInterval(interval);
          this.busyWorkers.add(worker);
          resolve(worker);
        }
      }, 100);
    });
  }

  /**
   * Release worker back to the pool
   */
  private releaseWorker(worker: Worker): void {
    this.busyWorkers.delete(worker);
  }

  /**
   * Handle worker failure by replacing it
   */
  private handleWorkerFailure(failedWorker: Worker): void {
    const index = this.workerPool.indexOf(failedWorker);
    if (index !== -1) {
      this.workerPool[index] = this.createWorker();
    }
    this.busyWorkers.delete(failedWorker);
  }

  /**
   * Execute scraping job with worker
   */
  private executeWithWorker(
    worker: Worker,
    job: ScraperJob,
  ): Promise<PlaylistJSON[]> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Scraping operation timed out'));
        this.releaseWorker(worker);
      }, 30000); // 30 seconds timeout

      worker.once('message', (response: ScraperResponse) => {
        clearTimeout(timeout);
        this.releaseWorker(worker);

        if (response.success) {
          resolve(response.data);
        } else {
          reject(new Error(response.error.message));
        }
      });

      worker.once('error', (error) => {
        clearTimeout(timeout);
        this.releaseWorker(worker);
        reject(error);
      });

      worker.postMessage(job);
    });
  }

  /**
   * Terminate all workers in the pool
   */
  private async terminateAllWorkers(): Promise<void> {
    await Promise.all(this.workerPool.map((worker) => worker.terminate()));
    this.workerPool = [];
    this.busyWorkers.clear();
  }

  /**
   * Main scraping method
   * @param link - Target URL to scrape
   * @param selector - CSS selector to wait for
   * @param extractDataFn - Function to extract data from page
   * @returns Promise<PlaylistJSON[]>
   */
  async scrape(
    link: string,
    selector: string,
    extractDataFn: () => Promise<PlaylistJSON[]>,
  ): Promise<PlaylistJSON[]> {
    const worker = await this.getAvailableWorker();

    try {
      return await this.executeWithWorker(worker, {
        link,
        selector,
        extractDataFn: extractDataFn.toString(),
      });
    } catch (error) {
      throw new Error(`Scraping failed: ${error.message}`);
    }
  }
}
