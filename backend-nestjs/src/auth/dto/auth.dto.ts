import { IsEmail, IsString, MinLength, IsNotEmpty, IsOptional } from 'class-validator';

export class LoginDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  identifier?: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(3)
  username!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  firstName?: string;

  @IsString()
  lastName?: string;
}

export class RefreshTokenDto {
  @IsString()
  refresh_token!: string;
}

export class GoogleOAuthDto {
  @IsString()
  @IsNotEmpty()
  token!: string;
}
