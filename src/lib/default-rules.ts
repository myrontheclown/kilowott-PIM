import { CategoryRule } from '@/types/product';

export const DEFAULT_CATEGORY_RULES: CategoryRule[] = [
  {
    category: 'clothing',
    label: 'Clothing & Apparel',
    description: 'Garments, shoes, and wearable apparel requiring sizing, color, and textile specifications.',
    attributes: [
      {
        key: 'brand',
        label: 'Brand',
        type: 'text',
        required: true,
        description: 'Brand or manufacturer name',
      },
      {
        key: 'size',
        label: 'Size',
        type: 'select',
        options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size'],
        required: true,
        description: 'Standard sizing classification',
      },
      {
        key: 'color',
        label: 'Color',
        type: 'text',
        required: true,
        description: 'Primary product color',
      },
      {
        key: 'material',
        label: 'Material',
        type: 'text',
        required: true,
        description: 'Fabric or primary material composition (e.g. 100% Organic Cotton)',
      },
      {
        key: 'gender',
        label: 'Target Gender',
        type: 'select',
        options: ['Unisex', 'Men', 'Women', 'Kids'],
        required: false,
      },
    ],
  },
  {
    category: 'electronics',
    label: 'Consumer Electronics',
    description: 'Hardware, gadgets, and digital peripherals with technical specifications.',
    attributes: [
      {
        key: 'brand',
        label: 'Brand',
        type: 'text',
        required: true,
        description: 'Manufacturer brand name',
      },
      {
        key: 'warranty',
        label: 'Warranty Period',
        type: 'text',
        required: true,
        description: 'Warranty duration (e.g., "1 Year Limited", "2 Years Manufacturer")',
      },
      {
        key: 'connectivity',
        label: 'Connectivity',
        type: 'select',
        options: ['Bluetooth 5.3', 'Wi-Fi 6', 'USB-C', 'Wireless & Wired', 'None'],
        required: true,
        description: 'Primary connection interface',
      },
      {
        key: 'batteryLife',
        label: 'Battery Life',
        type: 'text',
        unit: 'hours',
        required: false,
        description: 'Typical run time on battery',
      },
      {
        key: 'modelNumber',
        label: 'Model Number',
        type: 'text',
        required: false,
        description: 'Factory model identifier',
      },
    ],
  },
  {
    category: 'home-goods',
    label: 'Home & Living',
    description: 'Furniture, decor, and household utilities.',
    attributes: [
      {
        key: 'material',
        label: 'Primary Material',
        type: 'text',
        required: true,
        description: 'Core construction material (e.g., Solid Walnut Wood, Ceramic, Stainless Steel)',
      },
      {
        key: 'dimensions',
        label: 'Dimensions (LxWxH)',
        type: 'text',
        required: true,
        description: 'Item dimensions (e.g., 45 x 30 x 15 cm)',
      },
      {
        key: 'color',
        label: 'Color Finish',
        type: 'text',
        required: false,
        description: 'Finish or paint color',
      },
      {
        key: 'careInstructions',
        label: 'Care Instructions',
        type: 'text',
        required: false,
        description: 'Washing or cleaning instructions',
      },
      {
        key: 'weight',
        label: 'Weight',
        type: 'text',
        unit: 'kg',
        required: false,
      },
    ],
  },
  {
    category: 'beauty',
    label: 'Beauty & Personal Care',
    description: 'Cosmetics, skincare, and personal grooming items.',
    attributes: [
      {
        key: 'brand',
        label: 'Brand',
        type: 'text',
        required: true,
        description: 'Brand or lab name',
      },
      {
        key: 'volume',
        label: 'Volume / Net Content',
        type: 'text',
        required: true,
        description: 'Quantity content (e.g., 50 ml, 100 g)',
      },
      {
        key: 'ingredients',
        label: 'Key Active Ingredients',
        type: 'text',
        required: true,
        description: 'Primary formula compounds (e.g., Hyaluronic Acid 2%, Niacinamide)',
      },
      {
        key: 'skinType',
        label: 'Target Skin Type',
        type: 'select',
        options: ['All Skin Types', 'Sensitive', 'Dry', 'Oily', 'Combination'],
        required: false,
      },
    ],
  },
];

export function getCategoryRule(category: string, rules: CategoryRule[] = DEFAULT_CATEGORY_RULES): CategoryRule | undefined {
  return rules.find((r) => r.category.toLowerCase() === category.toLowerCase());
}
