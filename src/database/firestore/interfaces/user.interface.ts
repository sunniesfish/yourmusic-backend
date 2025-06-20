import { RankType } from '../../../statistic/dto/rank.type';

export interface UserDocument {
  userId: string;
  name: string;
  profileImg?: string;
  password: string;
  refreshToken?: {
    id: string;
    refreshToken: string;
  };
  spotifyToken?: {
    refreshToken: string;
    createdAt: Date;
    updatedAt: Date;
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
