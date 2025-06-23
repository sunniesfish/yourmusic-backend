import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { GqlArgumentsHost } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';
import { ValidationError } from 'class-validator';

interface OperationInfo {
  operation: string;
  fieldName: string;
}

interface LogContext {
  operation: string;
  field: string;
  userId: string;
  status?: number;
  originalMessage?: string;
}

@Catch()
export class GqlExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GqlExceptionFilter.name);
  private readonly isProduction = process.env.NODE_ENV === 'production';

  private readonly ERROR_MESSAGES = {
    BAD_REQUEST: 'Invalid request',
    UNAUTHORIZED: 'Authentication required',
    FORBIDDEN: 'Access denied',
    NOT_FOUND: 'Requested resource not found',
    CONFLICT: 'Data already exists',
    UNPROCESSABLE: 'Unprocessable data',
    VALIDATION_FAILED: 'Invalid input data',
    INTERNAL_ERROR: 'Internal server error',
  } as const;

  catch(exception: unknown, host: ArgumentsHost): never {
    const gqlHost = GqlArgumentsHost.create(host);
    const info = gqlHost.getInfo();
    const ctx = gqlHost.getContext();
    const req = ctx?.req;

    const operationInfo = this.getOperationInfo(info);
    const userId = req?.user?.id || 'anonymous';

    if (exception instanceof HttpException) {
      return this.handleHttpException(exception, operationInfo, userId);
    }

    if (
      Array.isArray(exception) &&
      exception.every((e) => e instanceof ValidationError)
    ) {
      return this.handleValidationErrors(
        exception as ValidationError[],
        operationInfo,
        userId,
      );
    }

    if (exception instanceof ValidationError) {
      return this.handleValidationErrors([exception], operationInfo, userId);
    }

    return this.handleUnknownError(exception, operationInfo, userId);
  }

  private getOperationInfo(info: any): OperationInfo {
    return {
      operation: info?.operation?.operation || 'unknown',
      fieldName: info?.fieldName || 'unknown',
    };
  }

  private handleHttpException(
    exception: HttpException,
    operationInfo: OperationInfo,
    userId: string,
  ): never {
    const status = exception.getStatus();
    const response = exception.getResponse();

    const { message, details } = this.extractErrorDetails(
      response,
      exception.message,
    );
    const userMessage = this.getUserFriendlyMessage(exception, message);

    this.logHttpException(
      status,
      operationInfo,
      userId,
      message,
      exception.stack,
    );

    throw new GraphQLError(userMessage, {
      extensions: {
        code: this.getGraphQLErrorCode(status),
        status,
        timestamp: new Date().toISOString(),
        operation: operationInfo.operation,
        field: operationInfo.fieldName,
        ...(details && { details }),
      },
    });
  }

  private extractErrorDetails(response: any, fallbackMessage: string) {
    if (typeof response === 'string') {
      return { message: response, details: null };
    }

    if (typeof response === 'object' && response !== null) {
      return {
        message: response.message || fallbackMessage,
        details: response.details || null,
      };
    }

    return { message: fallbackMessage, details: null };
  }

  private handleValidationErrors(
    errors: ValidationError[],
    operationInfo: OperationInfo,
    userId: string,
  ): never {
    const validationDetails = errors.map((error) => ({
      property: error.property,
      constraints: error.constraints || {},
      value: error.value,
    }));

    const logContext: LogContext = {
      operation: operationInfo.operation,
      field: operationInfo.fieldName,
      userId,
    };

    this.logger.warn('GraphQL validation error', {
      ...logContext,
      validationErrors: validationDetails,
    });

    throw new GraphQLError(this.ERROR_MESSAGES.VALIDATION_FAILED, {
      extensions: {
        code: 'BAD_USER_INPUT',
        status: 400,
        timestamp: new Date().toISOString(),
        operation: operationInfo.operation,
        field: operationInfo.fieldName,
        validationErrors: validationDetails,
      },
    });
  }

  private handleUnknownError(
    exception: unknown,
    operationInfo: OperationInfo,
    userId: string,
  ): never {
    const errorMessage =
      exception instanceof Error ? exception.message : String(exception);
    const errorStack = exception instanceof Error ? exception.stack : undefined;

    const logContext: LogContext = {
      operation: operationInfo.operation,
      field: operationInfo.fieldName,
      userId,
    };

    this.logger.error('Unhandled GraphQL error', {
      ...logContext,
      error: errorMessage,
      stack: errorStack,
    });

    throw new GraphQLError(this.ERROR_MESSAGES.INTERNAL_ERROR, {
      extensions: {
        code: 'INTERNAL_SERVER_ERROR',
        status: 500,
        timestamp: new Date().toISOString(),
        operation: operationInfo.operation,
        field: operationInfo.fieldName,
      },
    });
  }

  private logHttpException(
    status: number,
    operationInfo: OperationInfo,
    userId: string,
    message: string,
    stack?: string,
  ): void {
    const logContext: LogContext = {
      operation: operationInfo.operation,
      field: operationInfo.fieldName,
      userId,
      status,
      originalMessage: message,
    };

    if (status >= 500) {
      this.logger.error('GraphQL server error', {
        ...logContext,
        stack,
      });
    } else if (status >= 400) {
      this.logger.warn('GraphQL client error', logContext);
    }
  }

  private getUserFriendlyMessage(
    exception: HttpException,
    originalMessage: string,
  ): string {
    const messageMap = new Map([
      [BadRequestException, this.ERROR_MESSAGES.BAD_REQUEST],
      [UnauthorizedException, this.ERROR_MESSAGES.UNAUTHORIZED],
      [ForbiddenException, this.ERROR_MESSAGES.FORBIDDEN],
      [NotFoundException, this.ERROR_MESSAGES.NOT_FOUND],
      [ConflictException, this.ERROR_MESSAGES.CONFLICT],
      [UnprocessableEntityException, this.ERROR_MESSAGES.UNPROCESSABLE],
    ]);

    for (const [ExceptionClass, message] of messageMap) {
      if (exception instanceof ExceptionClass) {
        return message;
      }
    }

    return this.isProduction
      ? this.ERROR_MESSAGES.INTERNAL_ERROR
      : originalMessage;
  }

  private getGraphQLErrorCode(httpStatus: number): string {
    const statusCodeMap: Record<number, string> = {
      400: 'BAD_USER_INPUT',
      401: 'UNAUTHENTICATED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      429: 'TOO_MANY_REQUESTS',
      500: 'INTERNAL_SERVER_ERROR',
      502: 'BAD_GATEWAY',
      503: 'SERVICE_UNAVAILABLE',
      504: 'GATEWAY_TIMEOUT',
    };

    return statusCodeMap[httpStatus] || 'INTERNAL_SERVER_ERROR';
  }
}
