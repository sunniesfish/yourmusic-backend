import { PlaylistJSON } from '../dto/playlist-json.input';
import { scraper } from './scraper';

export const readYoutubePlaylist = async (
  link: string,
): Promise<PlaylistJSON[]> => {
  return scraper(link, 'ytd-playlist-video-renderer', async () => {
    const trackRows = document.querySelectorAll('ytd-playlist-video-renderer');
    return Array.from(trackRows).map((row) => {
      // 비디오 제목 추출
      const titleElement = row.querySelector('#video-title');
      const title = titleElement?.textContent?.trim() || '';

      // 채널명 추출
      const channelElement = row.querySelector(
        'ytd-channel-name yt-formatted-string a',
      );
      const artist = channelElement?.textContent?.trim() || '';

      return {
        title,
        artist,
      };
    });
  });
};

export const isYoutubeUrl = (url: string): boolean => {
  return url.includes('youtube.com') || url.includes('youtu.be');
};
