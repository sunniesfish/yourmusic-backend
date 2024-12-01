import { PlaylistJSON } from '../dto/playlist-json.input';
import { scraper } from './scraper';

export const readSpotifyPlaylist = async (
  link: string,
): Promise<PlaylistJSON[]> => {
  return scraper(link, 'div.contentSpacing', async () => {
    const trackRows = document.querySelectorAll(
      '[data-testid="tracklist-row"]',
    );
    return Array.from(trackRows).map((row) => {
      const thumbnail = row.querySelector('img')?.getAttribute('src') || '';

      // 트랙명 추출
      const title =
        row.querySelector('.encore-text-body-medium[dir="auto"]')
          ?.textContent || '';

      // 아티스트명 추출
      const artistElement = row.querySelector(
        '.encore-text-body-small a[href*="/artist/"]',
      );
      const artist = artistElement?.textContent || '';

      // 앨범명 추출
      const albumElement = row.querySelector('a[href*="/album/"]');
      const album = albumElement?.textContent || '';

      return {
        title,
        artist,
        album,
        thumbnail,
      };
    });
  });
};

export const isSpotifyUrl = (url: string): boolean => {
  return url.includes('spotify.com');
};
