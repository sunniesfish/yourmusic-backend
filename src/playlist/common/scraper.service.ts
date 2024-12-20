import puppeteer, { Browser } from 'puppeteer';
import { PlaylistJSON } from '../dto/playlist-json.input';
import {
  Injectable,
  InternalServerErrorException,
  OnModuleDestroy,
} from '@nestjs/common';

export type ExtractDataFn = () => Promise<PlaylistJSON[]>;

@Injectable()
export class ScraperService implements OnModuleDestroy {
  private browser: Browser | null = null;

  async getBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: { width: 1920, height: 1080 },
      });
    }
    return this.browser;
  }
  async scrape(link: string, selector: string, extractDataFn: ExtractDataFn) {
    const browser = await this.getBrowser();
    const page = await browser.newPage();
    try {
      await page.goto(link, { waitUntil: 'networkidle0' });
      await page.waitForSelector(selector);
      const data = await page.evaluate(extractDataFn);
      return data;
    } catch (error) {
      throw new InternalServerErrorException(
        error,
        'Failed to scrape playlist',
      );
    } finally {
      await page.close();
    }
  }

  async onModuleDestroy() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}
