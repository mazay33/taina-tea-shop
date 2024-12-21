import { Product } from "@prisma/client";

export class ProductEntity implements Product{
  id: string;
  name: string;
  slug: string;
  price: number;
  discount: number;
  stock: number;
  categoryId: string;
  createdAt: Date;
  updatedAt: Date;

}
