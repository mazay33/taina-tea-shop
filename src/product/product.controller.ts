import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ProductService } from './product.service';
import  {  Product } from '@prisma/client';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductEntity } from './entity';
import { Public, Roles } from '@common/decorators';

@ApiTags('Product')
@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get('/list')
  @Public()
  @ApiOperation({ summary: 'Get all products' })
  @ApiResponse({
    status: 200,
    description: 'List of products',
    type: [ProductEntity]
  })
  @ApiResponse({
    status: 404,
    description: 'No products found'
  })
  async getAllProducts() {
    return this.productService.getProducts();
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiParam({
    name: 'id',
    description: 'Product unique identifier'
  })
  @ApiResponse({
    status: 200,
    description: 'Product details',
    type: ProductEntity
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found'
  })
  async getProductById(@Param('id') id: string) {
    return this.productService.getProductById(id);
  }

  @Post()
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({
    status: 201,
    description: 'Product created successfully',
    type: ProductEntity
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid product data'
  })
  async createProduct(@Body() productData: CreateProductDto) {
    return this.productService.createProduct(productData);
  }

  @Put(':id')
  @Roles('ADMIN')
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an existing product' })
  @ApiParam({
    name: 'id',
    description: 'Product unique identifier'
  })
  @ApiResponse({
    status: 200,
    description: 'Product updated successfully',
    type: ProductEntity
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found'
  })
  async updateProduct(
    @Param('id') id: string,
    @Body() productData: UpdateProductDto
  ) {
    return this.productService.updateProduct(id, productData);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a product' })
  @ApiBearerAuth()
  @ApiParam({
    name: 'id',
    description: 'Product unique identifier'
  })
  @ApiResponse({
    status: 204,
    description: 'Product deleted successfully'
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found'
  })
  async deleteProduct(@Param('id') id: string) {
    return this.productService.deleteProduct(id);
  }
}
