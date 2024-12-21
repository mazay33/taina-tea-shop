import { Cookie, CurrentUser, Public, UserAgent } from '@common/decorators';
import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserResponse } from 'src/user/responses';
import { Request, Response } from 'express';
import { map, mergeMap } from 'rxjs';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto';
import { Tokens } from './interfaces';

import { Provider } from '@prisma/client';
import { handleTimeoutAndErrors } from '@common/helpers';
import { YandexGuard } from './guards/yandex.guard';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCookieAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UserService } from 'src/user/user.service';

const REFRESH_TOKEN = 'refreshtoken';
@ApiTags('Auth')
@Public()
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly userService: UserService,
  ) {}

  /**
   * Retrieve the current user
   */
  @ApiOperation({ summary: 'Retrieve the current user' })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'The current user',
    type: UserResponse,
  })
  @UseInterceptors(ClassSerializerInterceptor)
  @Get('me')
  async me(@CurrentUser() user: UserResponse) {
    const userData = await this.userService.findOne(user.id);
    return new UserResponse(userData);
  }

  /**
   *  Register new user
   */
  @ApiOperation({ summary: 'Register new user' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User successfully registered',
    type: UserResponse,
  })
  @ApiBadRequestResponse({
    description: 'Unable to register user with provided data',
  })
  @UseInterceptors(ClassSerializerInterceptor)
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const user = await this.authService.register(dto);
    if (!user) {
      throw new BadRequestException(
        `Unable to register user with provided data ${JSON.stringify(dto)}`,
      );
    }
    return new UserResponse(user);
  }

  /**
   *  Login user
   */
  @ApiOperation({ summary: 'Login user' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User successfully logged in',
  })
  @ApiBadRequestResponse({ description: 'Unable to login' })
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res() res: Response,
    @UserAgent() agent: string,
  ) {
    const tokens = await this.authService.login(dto, agent);

    if (!tokens) {
      throw new BadRequestException(
        `Unable to login with provided data ${JSON.stringify(dto)}`,
      );
    }
    this.setRefreshTokenToCookies(tokens, res);
  }

  /**
   *  Logout user
   */
  @ApiOperation({ summary: 'Logout user' })
  @ApiCookieAuth()
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User successfully logged out',
  })
  @ApiBearerAuth()
  @ApiUnauthorizedResponse({ description: 'Unauthorized request' })
  @Get('logout')
  async logout(
    @Cookie(REFRESH_TOKEN) refreshToken: string,
    @Res() res: Response,
  ) {
    if (!refreshToken) {
      res.sendStatus(HttpStatus.OK);
      return;
    }
    await this.authService.deleteRefreshToken(refreshToken);
    res.cookie(REFRESH_TOKEN, '', {
      httpOnly: true,
      secure: true,
      expires: new Date(),
    });
    res.sendStatus(HttpStatus.OK);
  }

    /**
   *  Refresh tokens
   */
  @ApiOperation({ summary: 'Refresh tokens' })
  @ApiCookieAuth()
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tokens successfully refreshed',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized request' })
  @Get('refresh-tokens')
  async refreshTokens(
    @Cookie(REFRESH_TOKEN) refreshToken: string,
    @Req() req: Request,
    @Res() res: Response,
    @UserAgent() agent: string,
  ) {

    if (!refreshToken) {
      throw new UnauthorizedException();
    }
    const tokens = await this.authService.refreshTokens(refreshToken, agent);
    if (!tokens) {
      throw new UnauthorizedException();
    }
    this.setRefreshTokenToCookies(tokens, res);
  }

  /**
   *   Authorization through Yandex
   */
  @ApiOperation({ summary: 'Authorization through Yandex' })
  @UseGuards(YandexGuard)
  @Get('yandex')
  yandexAuth() {}

  /**
   *  Yandex authorization callback
   */
  @ApiOperation({ summary: 'Yandex authorization callback' })
  @UseGuards(YandexGuard)
  @Get('yandex/callback')
  yandexAuthCallback(
    @Req() req: Request extends { user: Tokens } ? Request : any,
    @Res() res: Response,
  ) {
    const token: string = req.user['accessToken'];
    return res.redirect(
      `${this.configService.get('CLIENT_URL')}/auth/success-yandex?token=${token}`,
    );
  }

  /**
   *  Success yandex
   */
  @ApiOperation({ summary: 'Success yandex' })
  @ApiQuery({ name: 'token', required: true })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Success Yandex',
  })
  @Get('success-yandex')
  successYandex(
    @Query('token') token: string,
    @UserAgent() agent: string,
    @Res() res: Response,
  ) {
    return this.httpService
      .get(`https://login.yandex.ru/info?format=json&oauth_token=${token}`)
      .pipe(
        mergeMap(({ data: { default_email } }) =>
          this.authService.providerAuth(default_email, agent, Provider.YANDEX),
        ),
        map((data) => this.setRefreshTokenToCookies(data, res)),
        handleTimeoutAndErrors(),
      );
  }

  /**
   *  Set refresh token to cookies
   */
  private setRefreshTokenToCookies(tokens: Tokens, res: Response) {
    if (!tokens) {
      throw new UnauthorizedException();
    }
    res.cookie(REFRESH_TOKEN, tokens.refreshToken.token, {
      httpOnly:
        this.configService.get('NODE_ENV') === 'production' ? true : false,
      sameSite:
        this.configService.get('NODE_ENV') === 'production' ? 'lax' : 'none',
      expires: new Date(tokens.refreshToken.exp),
      secure: true,
      path: '/',
    });
    res.status(HttpStatus.CREATED).json({ accessToken: tokens.accessToken });
  }
}
