import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const req = ctx.switchToHttp().getRequest();
    const user = req.user;
    if (user) {
      return user.id || user.sub;
    }

    const headerUserId = req.headers['x-user-id'];
    if (headerUserId && typeof headerUserId === 'string') {
      return headerUserId;
    }

    throw new UnauthorizedException(
      'Yêu cầu xác thực người dùng để thực hiện thao tác',
    );
  },
);
