import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsNotEmpty,
  Min,
  IsOptional,
  IsUUID
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({
    description: 'Product name',
    example: 'Awesome Product'
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Product slug',
    example: 'awesome-product'
  })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({
    description: 'Product price',
    example: 99.99
  })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({
    description: 'Product discount',
    example: 10,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number = 0;

  @ApiProperty({
    description: 'Product stock',
    example: 100,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number = 0;

  @ApiProperty({
    description: 'Category ID',
    example: 'uuid-of-category'
  })
  @IsUUID()
  categoryId: string;
}
