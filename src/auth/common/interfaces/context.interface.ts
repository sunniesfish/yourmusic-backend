import { Request, Response } from 'express';
import { UserInput } from 'src/user/dto/user.input';

export interface GqlContext {
  req: Request & {
    user?: UserInput;
    api_accessToken?: string;
    needsAuthUrl?: boolean;
  };
  res: Response;
}
