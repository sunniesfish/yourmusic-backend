import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Cluster } from 'puppeteer-cluster';
import { PlaylistJSON } from 'src/playlist/common/dto/playlists.dto';
import { ScraperJob } from './scraper.types';
import { scraperConfigService } from './scraper.config';

@Injectable()
export class ScraperService implements OnModuleInit, OnModuleDestroy {
  private cluster: Cluster<ScraperJob, PlaylistJSON[]>;
  private readonly config = scraperConfigService.getConfig();

  async onModuleInit() {
    this.cluster = await Cluster.launch({
      concurrency: Cluster.CONCURRENCY_PAGE,
      maxConcurrency: this.config.maxWorkers,
      puppeteerOptions: this.config.browserOptions,
      timeout: this.config.workerTimeout,
    });

    await this.cluster.task(async ({ page, data: job }) => {
      const { link, selector, extractDataFn } = job;

      await page.setRequestInterception(true);
      page.on('request', (request) => {
        if (['image', 'stylesheet', 'font'].includes(request.resourceType())) {
          request.abort();
        } else {
          request.continue();
        }
      });

      await page.goto(link, {
        waitUntil: ['networkidle0', 'domcontentloaded', 'load'],
      });
      await page.waitForSelector(selector, {
        timeout: this.config.workerTimeout / 2,
      });

      const fnToExecute = new Function(`return ${extractDataFn}`)();
      const extractedData: PlaylistJSON[] = await page.evaluate(fnToExecute);
      return extractedData;
    });

    this.cluster.on('taskerror', (err, data, willRetry) => {
      console.error(
        `Error scraping ${data.link}: ${err.message}. Will retry: ${willRetry}`,
      );
    });
  }

  async onModuleDestroy() {
    if (this.cluster) {
      await this.cluster.idle();
      await this.cluster.close();
    }
  }

  async scrape(
    link: string,
    selector: string,
    extractDataFn: () => Promise<PlaylistJSON[]>,
  ): Promise<PlaylistJSON[]> {
    try {
      const job: ScraperJob = {
        link,
        selector,
        extractDataFn: extractDataFn.toString(),
      };
      const result: PlaylistJSON[] = await this.cluster.execute(job);
      return result;
    } catch (error) {
      console.error(
        `Scraping failed for link ${link}: ${error.message}`,
        error.stack,
      );
      throw new Error(`Playlist not found`);
    }
  }
}
