import { Item } from './item.model';

export interface Todo {
  id?: string,
  title: string,
  items?: Item[],
  createdBy?: string,
  createdAt?: number,
  updatedBy?: string,
  updatedAt?: number,
}
