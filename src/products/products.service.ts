import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaClient } from '@prisma/client';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginationDto } from 'src/common';

@Injectable()
export class ProductsService extends PrismaClient implements OnModuleInit {

  private logger: Logger = new Logger('ProductsService');

  onModuleInit() {
    this.$connect();
    this.logger.log('Connected to the database');
  }
  create(createProductDto: CreateProductDto) {
    return this.product.create({
      data: createProductDto
    });
  }

  async findAll(pagination: PaginationDto) {
    const { page, limit } = pagination;
    const totalProducts = await this.product.count({ where: { available: true } });
    const lastPage = Math.ceil(totalProducts / limit);
    return {
      data: await this.product.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where: { available: true }
      }),
      meta: {
        total: totalProducts,
        page: page,
        lastPage: lastPage
      }
    }
  }

  async findOne(id: number) {
    const product = await this.product.findUnique({
      where: { id, available: true }
    });
    if (!product) {
      throw new RpcException({
        message: `Product with id ${id} not found`,
        statusCode: HttpStatus.NOT_FOUND
      });
    }
    return product;
  }

  async update(updateProductDto: UpdateProductDto) {
    const { id, ...data } = updateProductDto;
    await this.findOne(id);
    return this.product.update({
      where: { id },
      data: data
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    const product = await this.product.update({
      where: { id },
      data: { available: false }
    });
    return product;
  }
}
