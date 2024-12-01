import puppeteer, { Browser } from 'puppeteer';
import { PlaylistJSON } from '../dto/playlist-json.input';
import { InternalServerErrorException } from '@nestjs/common';

export interface ExtractDataFn {
  (): Promise<PlaylistJSON[]>;
}

export const scraper = async (
  link: string,
  selector: string,
  extractDataFn: ExtractDataFn,
) => {
  let browser: Browser | null = null;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1920, height: 1080 },
      timeout: 10000,
    });
    const page = await browser.newPage();
    await page.goto(link, { waitUntil: 'networkidle0' });
    await page.waitForSelector(selector);

    const data = await page.evaluate(() => extractDataFn());

    return data;
  } catch (error) {
    throw new InternalServerErrorException(error, 'Failed to scrape playlist');
  } finally {
    await browser?.close();
  }
};
