import { z } from 'zod';

export const ProductSchema = z.object({
  name: z.string().min(3, 'Product name must be at least 3 characters'),
  sku: z.string().min(2, 'SKU must be at least 2 characters').toUpperCase(),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  shortDescription: z.string().optional(),
  regularPrice: z.number().positive('Regular price must be greater than 0'),
  salePrice: z.number().nonnegative('Sale price must be non-negative').optional(),
  stockQuantity: z.number().int().nonnegative('Stock quantity must be a non-negative integer'),
  stockStatus: z.enum(['instock', 'outofstock', 'onbackorder']),
  category: z.string().min(1, 'Category is required'),
  imageUrl: z.string().url('A valid image URL is required'),
  attributes: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
  status: z.enum(['draft', 'published']),
});

export const WooCommerceCredentialsSchema = z.object({
  storeUrl: z.string().url('Store URL must be a valid URL (e.g. https://your-store.com)'),
  consumerKey: z.string().min(5, 'Consumer key is required'),
  consumerSecret: z.string().min(5, 'Consumer secret is required'),
});

export const AttributeDefinitionSchema = z.object({
  key: z.string().min(2, 'Key must be at least 2 characters').regex(/^[a-zA-Z0-9_-]+$/, 'Alphanumeric, dash or underscore only'),
  label: z.string().min(2, 'Label is required'),
  type: z.enum(['text', 'number', 'select']),
  options: z.array(z.string()).optional(),
  required: z.boolean(),
  unit: z.string().optional(),
  description: z.string().optional(),
});
