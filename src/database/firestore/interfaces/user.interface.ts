import { User } from 'src/user/dto/user.object';
import { RankType } from '../../../statistic/dto/rank.type';

export interface UserDocument extends User {
  password: string;
  refreshToken?: {
    id: string;
    refreshToken: string;
  };
  spotifyToken?: {
    refreshToken: string;
    expiryDate: number;
    tokenType: string;
  };
  youtubeCredentials?: {
    refreshToken: string;
    scope: string;
    tokenType: string;
    expiryDate: number;
  };
  statistic?: {
    artistRankJson: RankType;
    albumRankJson: RankType;
    titleRankJson: RankType;
    updatedAt: Date;
  };
}
