import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { getJwtSecret } from './jwt.config';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: Role;
}

interface AccessTokenPayload {
  sub?: unknown;
  email?: unknown;
  role?: unknown;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: getJwtSecret(),
      algorithms: ['HS256'],
    });
  }

  validate(payload: AccessTokenPayload): AuthenticatedUser {
    if (
      typeof payload?.sub !== 'string' ||
      !payload.sub ||
      typeof payload.email !== 'string' ||
      !Object.values(Role).includes(payload.role as Role)
    ) {
      throw new UnauthorizedException('JWT không hợp lệ');
    }

    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role as Role,
    };
  }
}
