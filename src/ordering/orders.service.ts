import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Order } from '../data.js';
import { CatalogService } from '../catalog/catalog.service.js';
import {
  ORDER_REPOSITORY,
  type OrderRepository,
} from './order.repository.js';

const ALLOWED: Record<string, string[]> = {
  PLACED: ['COOKING', 'CANCELLED'],
  COOKING: ['DELIVERING'],
  DELIVERING: ['DELIVERED'],
};

@Injectable()
export class OrdersService {
  private readonly idempotency = new Map<string, string>();

  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: OrderRepository,
    private readonly catalogService: CatalogService,
  ) {}

  async placeOrder(
    restaurantId: number,
    items: string[],
    idempotencyKey?: string,
  ): Promise<{ order: Order; replayed: boolean }> {
    if (idempotencyKey && this.idempotency.has(idempotencyKey)) {
      const existingId = this.idempotency.get(idempotencyKey)!;
      const existingOrder = await this.orderRepository.get(existingId);

      if (existingOrder) {
        return { order: existingOrder, replayed: true };
      }
    }

    if (!this.catalogService.restaurantExists(restaurantId)) {
      throw new NotFoundException('restaurant not found');
    }

    const order: Order = {
      id: randomUUID(),
      restaurantId,
      items,
      status: 'PLACED',
    };

    await this.orderRepository.save(order);

    if (idempotencyKey) {
      this.idempotency.set(idempotencyKey, order.id);
    }

    return { order, replayed: false };
  }

  async getOrder(id: string): Promise<Order> {
    const order = await this.orderRepository.get(id);

    if (!order) {
      throw new NotFoundException('order not found');
    }

    return order;
  }

  async changeStatus(id: string, newStatus: string): Promise<Order> {
    const order = await this.getOrder(id);

    if (!ALLOWED[order.status]?.includes(newStatus)) {
      throw new ConflictException(
        `cannot go ${order.status} to ${newStatus}`,
      );
    }

    order.status = newStatus;
    await this.orderRepository.save(order);

    return order;
  }
}
