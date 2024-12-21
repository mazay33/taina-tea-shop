import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  IsUUID
} from 'class-validator';

export class UpdateProductDto {
  @ApiPropertyOptional({
    description: 'Product name',
    example: 'Updated Product Name'
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Product slug',
    example: 'updated-product-slug'
  })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({
    description: 'Product price',
    example: 129.99
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({
    description: 'Product discount',
    example: 15
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @ApiPropertyOptional({
    description: 'Product stock',
    example: 50
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;

  @ApiPropertyOptional({
    description: 'Category ID',
    example: 'uuid-of-category'
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;
}
