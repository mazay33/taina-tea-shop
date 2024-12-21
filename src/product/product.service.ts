import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException
} from '@nestjs/common';
import { Product } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateProductDto } from './dto';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  async getProducts(): Promise<Product[]> {
    try {
      const products = await this.prisma.product.findMany();

      if (products.length === 0) {
        throw new NotFoundException('No products found');
      }

      return products;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Error retrieving products');
    }
  }

  async getProductById(id: string): Promise<Product> {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id }
      });

      if (!product) {
        throw new NotFoundException(`Product with ID ${id} not found`);
      }

      return product;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Error retrieving product');
    }
  }

  async createProduct(productData: CreateProductDto): Promise<Product> {
    try {
      // Validate input data before creating
      if (!productData) {
        throw new BadRequestException('Product data is required');
      }

      return await this.prisma.product.create({
        data: productData
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Handle specific Prisma errors
        if (error.code === 'P2002') {
          throw new BadRequestException('Unique constraint violation');
        }
      }
      throw new InternalServerErrorException('Error creating product');
    }
  }

  async updateProduct(id: string, productData: Partial<Product>): Promise<Product> {
    try {
      // Validate input data
      if (!id) {
        throw new BadRequestException('Product ID is required');
      }

      if (!productData || Object.keys(productData).length === 0) {
        throw new BadRequestException('No update data provided');
      }

      // First, check if product exists
      await this.getProductById(id);

      return await this.prisma.product.update({
        where: { id },
        data: productData
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Product with ID ${id} not found`);
        }
      }
      throw new InternalServerErrorException('Error updating product');
    }
  }

  async deleteProduct(id: string): Promise<Product> {
    try {
      // Validate input
      if (!id) {
        throw new BadRequestException('Product ID is required');
      }

      // First, check if product exists
      await this.getProductById(id);

      return await this.prisma.product.delete({
        where: { id }
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Product with ID ${id} not found`);
        }
      }
      throw new InternalServerErrorException('Error deleting product');
    }
  }
}
