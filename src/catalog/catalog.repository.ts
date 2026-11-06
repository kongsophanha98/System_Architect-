import { Injectable } from '@nestjs/common';
import { RESTAURANTS, type Restaurant } from '../data.js';

@Injectable()
export class CatalogRepository {
  findAll(limit: number, offset: number): Restaurant[] {
    return RESTAURANTS.slice(offset, offset + limit);
  }

  findById(id: number): Restaurant | undefined {
    return RESTAURANTS.find(restaurant => restaurant.id === id);
  }

  restaurantExists(id: number): boolean {
    return RESTAURANTS.some(restaurant => restaurant.id === id);
  }

  count(): number {
    return RESTAURANTS.length;
  }
}
