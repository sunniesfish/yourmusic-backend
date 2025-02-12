import { PlaylistJSON } from 'src/playlist/common/dto/playlists.dto';

interface ScraperResponse {
  success: boolean;
  data?: PlaylistJSON[];
  error?: {
    message: string;
  };
}

interface ScraperJob {
  link: string;
  selector: string;
  extractDataFn: string;
}

export { ScraperResponse, ScraperJob };
