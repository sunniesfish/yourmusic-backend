import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { UserInput } from 'src/user/dto/user.input';

//get user from request
export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext): UserInput => {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req.user;
  },
);
