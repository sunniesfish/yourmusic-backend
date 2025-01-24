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
}

const scraperConfig: ScraperConfig = {
  maxWorkers: Number(process.env.MAX_WORKERS),
  maxBrowsersPerWorker: Number(process.env.MAX_BROWSERS_PER_WORKER),
  maxConcurrentPages: Number(process.env.MAX_CONCURRENT_PAGES),
  browserOptions: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1920, height: 1080 },
  },
};

export const scraperConfigService = {
  getConfig: () => scraperConfig,
};
