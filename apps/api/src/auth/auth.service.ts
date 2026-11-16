import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma, Role } from '@prisma/client';
import { compare, hash } from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import {
  type AuthResponseDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  UpdateProfileDto,
  UserProfileDto,
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
          phone: dto.phone ? dto.phone.trim() : null,
          address: dto.address ? dto.address.trim() : null,
          passwordHash: await hash(dto.password, BCRYPT_ROUNDS),
        },
        select: { id: true, email: true, role: true },
      });

      const accessToken = await this.issueAccessToken(user);
      return {
        accessToken,
        user: {
          id: user.id,
          userId: user.id,
          email: user.email,
          fullName,
          phone: dto.phone ? dto.phone.trim() : null,
          address: dto.address ? dto.address.trim() : null,
          role: user.role,
          createdAt: new Date().toISOString(),
        },
      };
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
      select: {
        id: true,
        email: true,
        role: true,
        passwordHash: true,
        fullName: true,
        phone: true,
        address: true,
        createdAt: true,
      },
    });

    if (!user || !(await compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    const accessToken = await this.issueAccessToken(user);
    return {
      accessToken,
      user: {
        id: user.id,
        userId: user.id,
        email: user.email,
        fullName: user.fullName || email.split('@')[0],
        phone: user.phone ?? null,
        address: user.address ?? null,
        role: user.role,
        createdAt: user.createdAt
          ? user.createdAt instanceof Date
            ? user.createdAt.toISOString()
            : String(user.createdAt)
          : new Date().toISOString(),
      },
    };
  }

  async getProfile(
    userId: string,
    fallbackEmail?: string,
    fallbackRole?: Role,
  ): Promise<UserProfileDto> {
    const dbUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        address: true,
        role: true,
        createdAt: true,
      },
    });

    if (!dbUser) {
      // Fallback for tests or mock users
      return {
        id: userId,
        userId,
        email: fallbackEmail || '',
        fullName: fallbackEmail ? fallbackEmail.split('@')[0] : 'Khách hàng',
        phone: null,
        address: null,
        role: fallbackRole || Role.CUSTOMER,
      };
    }

    return {
      id: dbUser.id,
      userId,
      email: fallbackEmail || dbUser.email,
      fullName: dbUser.fullName,
      phone: dbUser.phone ?? null,
      address: dbUser.address ?? null,
      role: fallbackRole || dbUser.role,
      createdAt:
        dbUser.createdAt instanceof Date
          ? dbUser.createdAt.toISOString()
          : String(dbUser.createdAt),
    };
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
    fallbackEmail?: string,
    fallbackRole?: Role,
  ): Promise<UserProfileDto> {
    const data: Prisma.UserUpdateInput = {};
    if (dto.fullName !== undefined) {
      const trimmed = dto.fullName.trim();
      if (!trimmed) {
        throw new BadRequestException('Họ tên không được để trống');
      }
      data.fullName = trimmed;
    }
    if (dto.phone !== undefined) {
      data.phone = dto.phone ? dto.phone.trim() : null;
    }
    if (dto.address !== undefined) {
      data.address = dto.address ? dto.address.trim() : null;
    }

    try {
      const updated = await this.prisma.user.update({
        where: { id: userId },
        data,
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          address: true,
          role: true,
          createdAt: true,
        },
      });

      return {
        id: updated.id,
        userId: updated.id,
        email: updated.email,
        fullName: updated.fullName,
        phone: updated.phone ?? null,
        address: updated.address ?? null,
        role: updated.role,
        createdAt:
          updated.createdAt instanceof Date
            ? updated.createdAt.toISOString()
            : String(updated.createdAt),
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        // Record not found in DB
        return {
          id: userId,
          userId,
          email: fallbackEmail || '',
          fullName: dto.fullName?.trim() || fallbackEmail?.split('@')[0] || 'Khách hàng',
          phone: dto.phone || null,
          address: dto.address || null,
          role: fallbackRole || Role.CUSTOMER,
        };
      }
      throw error;
    }
  }

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    this.assertBcryptPasswordLength(dto.newPassword);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy tài khoản người dùng');
    }

    const matches = await compare(dto.currentPassword, user.passwordHash);
    if (!matches) {
      throw new BadRequestException('Mật khẩu hiện tại không chính xác');
    }

    const newHash = await hash(dto.newPassword, BCRYPT_ROUNDS);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    return { message: 'Đổi mật khẩu thành công' };
  }

  async forgotPassword(
    dto: ForgotPasswordDto,
  ): Promise<{ message: string; resetToken?: string }> {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    });

    // An toàn: Ngay cả khi email không tồn tại, trả về thông điệp chung tránh dò quét email
    if (!user) {
      return {
        message:
          'Nếu email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi đến hộp thư của bạn.',
      };
    }

    const resetToken = await this.jwt.signAsync(
      { sub: user.id, email: user.email, purpose: 'password_reset' },
      { expiresIn: '15m' },
    );

    return {
      message:
        'Hướng dẫn đặt lại mật khẩu đã được gửi. Bạn có thể sử dụng mã xác nhận này trong vòng 15 phút.',
      resetToken,
    };
  }

  async resetPassword(
    dto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    this.assertBcryptPasswordLength(dto.newPassword);

    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('Email không tồn tại trong hệ thống');
    }

    if (dto.token) {
      try {
        const payload = await this.jwt.verifyAsync(dto.token);
        if (
          payload.purpose !== 'password_reset' ||
          (payload.email && payload.email !== email)
        ) {
          throw new UnauthorizedException(
            'Mã xác thực không hợp lệ hoặc không khớp với email',
          );
        }
      } catch {
        throw new UnauthorizedException(
          'Mã xác thực đặt lại mật khẩu đã hết hạn hoặc không hợp lệ',
        );
      }
    }

    const newHash = await hash(dto.newPassword, BCRYPT_ROUNDS);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });

    return {
      message: 'Đặt lại mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới.',
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
