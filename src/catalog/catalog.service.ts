import { Injectable } from '@nestjs/common';
import { CatalogRepository } from './catalog.repository.js';

@Injectable()
export class CatalogService {
  constructor(private readonly catalogRepository: CatalogRepository) {}

  listRestaurants(limit: number, offset: number) {
    return {
      data: this.catalogRepository.findAll(limit, offset),
      limit,
      offset,
      total: this.catalogRepository.count(),
    };
  }

  getRestaurant(id: number) {
    return this.catalogRepository.findById(id);
  }

  restaurantExists(id: number): boolean {
    return this.catalogRepository.restaurantExists(id);
  }
}
