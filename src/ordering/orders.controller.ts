import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Param,
  Patch,
  Post,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { ArrayNotEmpty, IsIn, IsInt, IsString } from 'class-validator';
import { OrdersService } from './orders.service.js';

export class CreateOrderDto {
  @IsInt()
  restaurantId: number;

  @ArrayNotEmpty()
  @IsString({ each: true })
  items: string[];
}

export class UpdateStatusDto {
  @IsIn(['COOKING', 'DELIVERING', 'DELIVERED', 'CANCELLED'])
  status: string;
}

@Controller('v1/orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @HttpCode(201)
  async create(
    @Body() dto: CreateOrderDto,
    @Headers('idempotency-key') key: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.ordersService.placeOrder(
      dto.restaurantId,
      dto.items,
      key,
    );

    if (result.replayed) {
      res.status(200);
    }

    return result.order;
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.ordersService.getOrder(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.ordersService.changeStatus(id, dto.status);
  }
}
