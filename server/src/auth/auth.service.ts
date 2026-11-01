import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Response } from 'express';
import { Model } from 'mongoose';
import { User, UserDocument, UserRole } from '../users/schemas/user.schema';
import { LoginDto, RegisterDto } from './dto/auth.dto';

const ACCESS_COOKIE = 'access_token';
const REFRESH_COOKIE = 'refresh_token';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  private cookieOptions(maxAgeMs: number) {
    const isProd = this.config.get('NODE_ENV') === 'production';
    return {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax' as const,
      path: '/',
      maxAge: maxAgeMs,
    };
  }

  private parseDurationMs(value: string, fallbackMs: number): number {
    const match = /^(\d+)([smhd])$/.exec(value);
    if (!match) return fallbackMs;
    const n = Number(match[1]);
    const unit = match[2];
    const mult =
      unit === 's' ? 1000 : unit === 'm' ? 60_000 : unit === 'h' ? 3_600_000 : 86_400_000;
    return n * mult;
  }

  setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    const accessExpires = this.config.get('JWT_ACCESS_EXPIRES', '15m');
    const refreshExpires = this.config.get('JWT_REFRESH_EXPIRES', '7d');
    res.cookie(
      ACCESS_COOKIE,
      accessToken,
      this.cookieOptions(this.parseDurationMs(accessExpires, 15 * 60_000)),
    );
    res.cookie(
      REFRESH_COOKIE,
      refreshToken,
      this.cookieOptions(this.parseDurationMs(refreshExpires, 7 * 86_400_000)),
    );
  }

  clearAuthCookies(res: Response) {
    res.clearCookie(ACCESS_COOKIE, { path: '/' });
    res.clearCookie(REFRESH_COOKIE, { path: '/' });
  }

  private async issueTokens(user: UserDocument) {
    const payload = {
      sub: String(user._id),
      email: user.email,
      role: user.role,
    };
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: this.config.get('JWT_ACCESS_EXPIRES', '15m'),
    });
    const refreshToken = await this.jwtService.signAsync(
      { ...payload, type: 'refresh' },
      { expiresIn: this.config.get('JWT_REFRESH_EXPIRES', '7d') },
    );
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    user.refreshTokenHash = refreshTokenHash;
    await user.save();
    return { accessToken, refreshToken };
  }

  sanitize(user: UserDocument | Record<string, unknown>) {
    const u = 'toObject' in user && typeof user.toObject === 'function'
      ? user.toObject()
      : { ...user };
    const doc = u as Record<string, unknown>;
    delete doc.passwordHash;
    delete doc.refreshTokenHash;
    delete doc.__v;
    return {
      id: String(doc._id),
      email: doc.email,
      name: doc.name,
      phone: doc.phone ?? '',
      role: doc.role,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  async register(dto: RegisterDto, res: Response) {
    const email = dto.email.toLowerCase().trim();
    const existing = await this.userModel.findOne({ email });
    if (existing) {
      throw new ConflictException({
        code: 'EMAIL_IN_USE',
        message: 'An account with this email already exists',
      });
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.userModel.create({
      email,
      passwordHash,
      name: dto.name.trim(),
      phone: dto.phone?.trim() ?? '',
      role: UserRole.CUSTOMER,
    });

    const tokens = await this.issueTokens(user);
    this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    return { user: this.sanitize(user) };
  }

  async login(dto: LoginDto, res: Response) {
    const email = dto.email.toLowerCase().trim();
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
    }
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
    }
    const tokens = await this.issueTokens(user);
    this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    return { user: this.sanitize(user) };
  }

  async logout(userId: string, res: Response) {
    await this.userModel.findByIdAndUpdate(userId, {
      refreshTokenHash: null,
    });
    this.clearAuthCookies(res);
    return { ok: true };
  }

  async refresh(refreshToken: string | undefined, res: Response) {
    if (!refreshToken) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Missing refresh token',
      });
    }
    let payload: { sub: string; type?: string };
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
      });
    } catch {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Invalid refresh token',
      });
    }
    if (payload.type !== 'refresh') {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Invalid refresh token',
      });
    }
    const user = await this.userModel.findById(payload.sub);
    if (!user?.refreshTokenHash) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Session expired',
      });
    }
    const match = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!match) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Session expired',
      });
    }
    const tokens = await this.issueTokens(user);
    this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    return { user: this.sanitize(user) };
  }

  async me(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'User not found',
      });
    }
    return { user: this.sanitize(user) };
  }
}
