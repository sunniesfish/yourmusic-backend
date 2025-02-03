import { join } from 'path';

export interface ScraperConfig {
  maxWorkers: number;
  maxBrowsersPerWorker: number;
  maxConcurrentPages: number;
  browserOptions: {
    headless: boolean;
    args: string[];
    defaultViewport: {
      width: number;
      height: number;
    };
  };
  workerPath: string;
  execArgv: string[];
  workerTimeout: number;
}

const scraperConfig: ScraperConfig = {
  maxWorkers: parseInt(process.env.MAX_WORKERS || '1'),
  maxBrowsersPerWorker: parseInt(process.env.MAX_BROWSERS_PER_WORKER || '1'),
  maxConcurrentPages: parseInt(process.env.MAX_CONCURRENT_PAGES || '1'),
  browserOptions: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
    ],
    defaultViewport: { width: 1920, height: 1080 },
  },
  workerPath: join(
    process.cwd(),
    process.env.NODE_ENV === 'production'
      ? './dist/worker/scraper.worker.js'
      : './src/worker/scraper.worker.ts',
  ),
  execArgv:
    process.env.NODE_ENV === 'production'
      ? []
      : ['--require', 'ts-node/register'],
  workerTimeout: parseInt(process.env.WORKER_TIMEOUT || '30000'),
};

export const scraperConfigService = {
  getConfig: () => scraperConfig,
};
