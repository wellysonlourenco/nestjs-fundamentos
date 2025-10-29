import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from 'src/decorators/public.decorator';
import { JwtAuthGuard } from 'src/guard/jwt.guard';
import { usePipe } from 'src/common/pipes';
import {
  ChangePasswordInput,
  changePasswordSchema,
  ForgotPasswordInput,
  forgotPasswordSchema,
  LoginInput,
  loginSchema,
  RegisterInput,
  registerSchema,
  ResetPasswordInput,
  resetPasswordSchema,
} from 'src/common';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body(usePipe(registerSchema)) data: RegisterInput) {
    return this.authService.register(data);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body(usePipe(loginSchema)) data: LoginInput) {
    return this.authService.login(data.email, data.password);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@Request() req) {
    return this.authService.validateUser(req.user.userId);
  }

  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  refreshToken(@Request() req) {
    return this.authService.refreshToken(req.user);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  forgotPassword(
    @Body(usePipe(forgotPasswordSchema)) data: ForgotPasswordInput,
  ) {
    return this.authService.forgotPassword(data.email);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body(usePipe(resetPasswordSchema)) data: ResetPasswordInput) {
    return this.authService.resetPassword(data.token, data.newPassword);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  changePassword(
    @Request() req,
    @Body(usePipe(changePasswordSchema)) data: ChangePasswordInput,
  ) {
    return this.authService.changePassword(
      req.user.userId,
      data.oldPassword,
      data.newPassword,
    );
  }
}
