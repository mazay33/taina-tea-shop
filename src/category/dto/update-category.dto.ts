import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCategoryDto {
  @ApiProperty({
    description: 'The name of the category',
    example: 'Electronics',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'A description of the category',
    example: 'Devices, gadgets, and other electronics',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}
