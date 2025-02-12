import { Catch } from '@nestjs/common';
import { GqlExceptionFilter } from '@nestjs/graphql';
import { PlatformError } from '../../common/errors/platform.errors';
import { ApolloError } from 'apollo-server-express';

@Catch(PlatformError)
export class PlaylistExceptionFilter implements GqlExceptionFilter {
  catch(exception: PlatformError) {
    return new ApolloError(
      exception.message,
      exception.code || 'PLAYLIST_ERROR',
      {
        statusCode: exception.status || 400,
      },
    );
  }
}
