console.log(
  '////////////////////////////////////////////scraper worker////////////////////////////////////////////',
);

import { parentPort } from 'worker_threads';
import puppeteer, { Browser } from 'puppeteer';
import { scraperConfigService } from '../playlist/providers/scraper/scraper.config';

// Add debug logging
const isDebug = process.env.NODE_ENV !== 'production';
if (isDebug) {
  console.log('Worker started at:', new Date().toISOString());
  console.log('Worker file location:', __filename);
}

/**
 * BrowserPool Class
 * manage browser instances and find available browsers
 *  - reuse browser instances
 *  - limit the number of browsers
 *  - limit the number of pages per browser
 */
class BrowserPool {
  private browsers: Browser[] = [];
  private inUse = new Set<Browser>();
  private config = scraperConfigService.getConfig();

  /**
   * getBrowser
   *  - find available browser
   *  - if no available browser, create a new one
   *  - if the number of browsers is less than the limit, create a new one
   * @returns Browser
   */
  async getBrowser(): Promise<Browser> {
    // Find available browser
    const availableBrowser = this.browsers.find(
      (browser) => !this.inUse.has(browser),
    );

    if (availableBrowser) {
      this.inUse.add(availableBrowser);
      return availableBrowser;
    }

    // If no available browser, and the number of browsers is less than the limit, create a new one
    if (this.browsers.length < this.config.maxBrowsersPerWorker) {
      const newBrowser = await puppeteer.launch(this.config.browserOptions);
      this.browsers.push(newBrowser);
      this.inUse.add(newBrowser);
      return newBrowser;
    }

    // If no available browser, wait for an available browser
    return new Promise((resolve) => {
      const checkInterval = setInterval(async () => {
        const browser = this.browsers.find((b) => !this.inUse.has(b));
        if (browser) {
          clearInterval(checkInterval);
          this.inUse.add(browser);
          resolve(browser);
        }
      }, 100);
    });
  }

  /**
   * releaseBrowser
   *  - release browser
   * @param browser Browser
   */
  releaseBrowser(browser: Browser) {
    if (this.inUse.has(browser)) {
      this.inUse.delete(browser);
    }
  }

  /**
   * closeAll
   *  - close all browsers
   */
  async closeAll() {
    try {
      await Promise.all(this.browsers.map((browser) => browser.close()));
    } catch (error) {
      console.error('Error closing browsers', error);
    } finally {
      this.browsers = [];
      this.inUse.clear();
    }
  }
}

const browserPool = new BrowserPool();

/**
 * scrape
 *  - scrape data from the given link
 * @param link string
 * @param selector string
 * @param extractDataFn string
 * @returns Promise<{ data: any; error?: string }>
 */
async function scrape({ link, selector, extractDataFn }) {
  console.log('start scraping:', { link, selector });
  let browser: Browser | null = null;
  let page = null;

  try {
    browser = await browserPool.getBrowser();

    // Create a new page
    page = await browser.newPage();
    // Set page options - block unnecessary resources
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      if (['image', 'stylesheet', 'font'].includes(request.resourceType())) {
        request.abort();
      } else {
        request.continue();
      }
    });
    // Log request and response
    page.on('request', (request) => {
      console.log('Request:', request.url());
    });
    page.on('response', (response) => {
      console.log('Response:', response.url(), response.status());
    });
    // Load page and extract data
    await page.goto(link, {
      waitUntil: ['networkidle0', 'domcontentloaded', 'load'],
    });
    await page.waitForSelector(selector);

    const fnToExecute = new Function(`return ${extractDataFn}`)();

    const data = await page.evaluate(fnToExecute);

    // Log performance metrics
    const metrics = await page.metrics();
    console.log('Performance Metrics:', metrics);

    return { data };
  } catch (error) {
    console.log('scraping error:', error);
    return {
      error: error.message,
      stack: error.stack,
    };
  } finally {
    // Clean up resources
    if (page) {
      await page.close().catch(console.error);
    }
    if (browser) {
      browserPool.releaseBrowser(browser);
    }
  }
}

/**
 * Listen for messages from the main thread
 */
parentPort?.on('message', async (job) => {
  try {
    console.log('Worker received job:', job);
    const result = await scrape(job);
    console.log('Worker completed job:', result);
    parentPort?.postMessage({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('Worker error:', error);
    parentPort?.postMessage({
      success: false,
      error: {
        message: error.message,
      },
    });
  }
});

/**
 * Handle unexpected errors
 * - Prevent worker crash
 * - Log errors
 */
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
