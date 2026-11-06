import { Body, ConflictException, Controller, Get, Headers, HttpCode, NotFoundException, Param, Patch, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ArrayNotEmpty, IsIn, IsInt, IsString } from 'class-validator';
import { randomUUID } from 'node:crypto';
import { IDEMPOTENCY, ORDERS, RESTAURANTS } from './data.js';

export class CreateOrderDto {
  @IsInt() restaurantId: number;
  @ArrayNotEmpty() @IsString({ each: true }) items: string[];
}

export class UpdateStatusDto {
  @IsIn(['COOKING', 'DELIVERING', 'DELIVERED', 'CANCELLED']) status: string;
}

const ALLOWED: Record<string, string[]> = {
  PLACED: ['COOKING', 'CANCELLED'],
  COOKING: ['DELIVERING'],
  DELIVERING: ['DELIVERED'],
};

@Controller('v1/orders')
export class OrdersController {
  @Post()
  @HttpCode(201)
  create(@Body() dto: CreateOrderDto,
         @Headers('idempotency-key') key: string | undefined,
         @Res({ passthrough: true }) res: Response) {
    if (key && IDEMPOTENCY.has(key)) {
      res.status(200);
      return ORDERS.get(IDEMPOTENCY.get(key)!);
    }
    if (!RESTAURANTS.some(r => r.id === dto.restaurantId)) {
      throw new NotFoundException('restaurant not found');
    }
    const order = { id: randomUUID(), status: 'PLACED', ...dto };
    ORDERS.set(order.id, order);
    if (key) IDEMPOTENCY.set(key, order.id);
    return order;
  }

  @Get(':id')
  get(@Param('id') id: string) {
    const o = ORDERS.get(id);
    if (!o) throw new NotFoundException('order not found');
    return o;
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    const o = ORDERS.get(id);
    if (!o) throw new NotFoundException('order not found');
    if (!ALLOWED[o.status]?.includes(dto.status)) {
      throw new ConflictException(`cannot go ${o.status} → ${dto.status}`);
    }
    o.status = dto.status;
    return o;
  }
}