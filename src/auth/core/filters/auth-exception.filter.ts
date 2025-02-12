import { Catch } from '@nestjs/common';
import { GqlExceptionFilter } from '@nestjs/graphql';
import { AuthError } from 'src/auth/common/errors/auth.errors';
import { ApolloError } from 'apollo-server-express';

@Catch(AuthError)
export class AuthExceptionFilter implements GqlExceptionFilter {
  catch(exception: AuthError) {
    return new ApolloError(exception.message, exception.code, {
      statusCode: 401,
    });
  }
}
