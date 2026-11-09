import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import { compare, hash } from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import {
  type AuthResponseDto,
  LoginDto,
  RegisterDto,
} from './auth.dto';

const BCRYPT_ROUNDS = 12;
const BCRYPT_MAX_BYTES = 72;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    this.assertBcryptPasswordLength(dto.password);

    const email = dto.email.trim().toLowerCase();
    const fullName = dto.fullName.trim();

    if (!fullName) {
      throw new BadRequestException('Họ tên không được để trống');
    }

    try {
      const user = await this.prisma.user.create({
        data: {
          email,
          fullName,
          passwordHash: await hash(dto.password, BCRYPT_ROUNDS),
        },
        select: { id: true, email: true, role: true },
      });

      return { accessToken: await this.issueAccessToken(user) };
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('Email đã được đăng ký');
      }
      throw error;
    }
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    this.assertBcryptPasswordLength(dto.password);

    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, role: true, passwordHash: true },
    });

    if (!user || !(await compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    return {
      accessToken: await this.issueAccessToken(user),
    };
  }

  private issueAccessToken(user: {
    id: string;
    email: string;
    role: Role;
  }): Promise<string> {
    return this.jwt.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
  }

  private assertBcryptPasswordLength(password: string): void {
    if (Buffer.byteLength(password, 'utf8') > BCRYPT_MAX_BYTES) {
      throw new BadRequestException(
        `Mật khẩu không được vượt quá ${BCRYPT_MAX_BYTES} byte`,
      );
    }
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    );
  }
}
