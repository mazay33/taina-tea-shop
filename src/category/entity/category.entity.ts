import { ApiProperty } from '@nestjs/swagger';
import { Category } from '@prisma/client';

export class CategoryEntity implements Category {
  @ApiProperty({
    description: 'The unique identifier of the category',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  id: string;

  @ApiProperty({
    description: 'The name of the category',
    example: 'Electronics',
  })
  name: string;

  @ApiProperty({
    description: 'A description of the category',
    example: 'Devices, gadgets, and other electronics',
    required: false,
  })
  description: string;

  @ApiProperty({
    description: 'The date and time when the category was created',
    example: '2024-12-20T15:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'The date and time when the category was last updated',
    example: '2024-12-21T18:45:00.000Z',
  })
  updatedAt: Date;
}
