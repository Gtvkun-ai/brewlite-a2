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
      return user.userId || user.id || user.sub;
    }

    throw new UnauthorizedException(
      'Yêu cầu xác thực người dùng để thực hiện thao tác',
    );
  },
);
