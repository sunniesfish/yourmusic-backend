import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export interface CurrentUserType {
  id: string;
  username: string;
}

export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext): CurrentUserType => {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req.user;
  },
);
