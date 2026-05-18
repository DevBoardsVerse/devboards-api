import { ApiProperty } from '@nestjs/swagger';

export class TokensDto {
  @ApiProperty({ description: 'Short-lived JWT — expires in 15 minutes' })
  declare accessToken: string;

  @ApiProperty({ description: 'Long-lived token — expires in 7 days' })
  declare refreshToken: string;
}

export class AuthResponseDto {
  @ApiProperty()
  declare user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };

  @ApiProperty()
  declare tokens: TokensDto;
}