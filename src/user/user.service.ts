import { convertToSecondsUtil } from '@common/utils';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from '@prisma/client';
import { genSaltSync, hashSync } from 'bcrypt';
import { Cache } from 'cache-manager';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(
    private readonly prismaService: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Retrieve all users.
   * @returns Array of User objects
   */
  public async findMany(): Promise<User[]> {
    return this.prismaService.user.findMany();
  }

  /**
   * Save or update a user in the database and cache.
   * @param user Partial user object
   * @returns Saved user object
   */
  public async save(user: Partial<User>): Promise<User> {
    if (!user.email) {
      throw new BadRequestException('Email is required to save the user');
    }

    const hashedPassword = user.password ? this.hashPassword(user.password) : undefined;

    const savedUser = await this.prismaService.user.upsert({
      where: { email: user.email },
      update: {
        password: hashedPassword,
        provider: user.provider,
        roles: user.roles,
      },
      create: {
        email: user.email,
        password: hashedPassword,
        provider: user.provider,
        roles: user.roles || ['USER'],
      },
    });

    await this.updateCache(savedUser);

    return savedUser;
  }

  /**
   * Find a user by ID or email. Uses cache for optimization.
   * @param idOrEmail User ID or email
   * @param isReset Force cache reset
   * @returns User object or null if not found
   */
  public async findOne(idOrEmail: string, isReset = false): Promise<User | null> {
    if (!idOrEmail) {
      throw new BadRequestException('User ID or email is required');
    }

    if (isReset) {
      await this.cacheManager.del(idOrEmail);
    }

    let user = await this.cacheManager.get<User>(idOrEmail);

    if (!user) {
      user = await this.prismaService.user.findFirst({
        where: {
          OR: [{ id: idOrEmail }, { email: idOrEmail }],
        },
      });

      if (!user) {
        return null;
      }

      await this.updateCache(user);
    }

    return user;
  }

  /**
   * Delete a user by ID.
   * @param id User ID
   * @returns Deleted user ID
   */
  public async delete(id: string): Promise<{ id: string }> {
    if (!id) {
      throw new BadRequestException('User ID is required for deletion');
    }

    const user = await this.findOne(id);
    if (!user) {
      throw new NotFoundException(`User with id - "${id}" not found`);
    }

    await this.cacheManager.del(id);
    await this.cacheManager.del(user.email);

    return this.prismaService.user.delete({
      where: { id },
      select: { id: true },
    });
  }

  /**
   * Hash a password using bcrypt.
   * @param password Plain text password
   * @returns Hashed password
   */
  private hashPassword(password: string): string {
    return hashSync(password, genSaltSync(10));
  }

  /**
   * Update cache with user data.
   * @param user User object
   */
  private async updateCache(user: User): Promise<void> {
    const cacheTTL = convertToSecondsUtil(this.configService.get<string>('JWT_EXP'));
    await this.cacheManager.set(user.id, user, cacheTTL);
    await this.cacheManager.set(user.email, user, cacheTTL);
  }
}
