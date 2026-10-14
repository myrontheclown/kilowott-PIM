import { CategoryRule, Product } from '@/types/product';
import { DEFAULT_CATEGORY_RULES, getCategoryRule } from './default-rules';

export interface CompletenessResult {
  score: number;
  missingFields: string[];
  isComplete: boolean;
  canPublish: boolean;
  publishBlockers: string[];
}

export function calculateProductCompleteness(
  product: Partial<Product>,
  rules: CategoryRule[] = DEFAULT_CATEGORY_RULES
): CompletenessResult {
  const missingFields: string[] = [];
  const publishBlockers: string[] = [];

  // Core base field checks
  let coreScore = 0;
  const maxCoreScore = 75;

  if (product.name && product.name.trim().length >= 3) {
    coreScore += 15;
  } else {
    missingFields.push('Product Name (min 3 chars)');
    publishBlockers.push('Product Name is required');
  }

  if (product.sku && product.sku.trim().length >= 2) {
    coreScore += 10;
  } else {
    missingFields.push('SKU (Stock Keeping Unit)');
    publishBlockers.push('SKU is required');
  }

  if (product.regularPrice !== undefined && product.regularPrice > 0) {
    coreScore += 15;
  } else {
    missingFields.push('Regular Price (> 0)');
    publishBlockers.push('Valid regular price is required');
  }

  if (product.category && product.category.trim().length > 0) {
    coreScore += 10;
  } else {
    missingFields.push('Category');
    publishBlockers.push('Category is required');
  }

  if (product.description && product.description.trim().length >= 10) {
    coreScore += 10;
  } else {
    missingFields.push('Description (min 10 chars)');
    publishBlockers.push('Product description is incomplete');
  }

  if (product.imageUrl && product.imageUrl.trim().length > 0) {
    coreScore += 10;
  } else {
    missingFields.push('Primary Image URL');
  }

  if (product.stockQuantity !== undefined && product.stockQuantity >= 0) {
    coreScore += 5;
  } else {
    missingFields.push('Stock Quantity');
  }

  // Category specific attributes check
  const categoryRule = product.category ? getCategoryRule(product.category, rules) : undefined;
  const requiredAttributes = categoryRule
    ? categoryRule.attributes.filter((attr) => attr.required)
    : [];

  let attributeScore = 0;
  const maxAttributeScore = 25;

  if (requiredAttributes.length > 0) {
    const pointsPerAttr = maxAttributeScore / requiredAttributes.length;
    for (const attr of requiredAttributes) {
      const val = product.attributes?.[attr.key];
      const hasValue = val !== undefined && val !== null && String(val).trim().length > 0;
      if (hasValue) {
        attributeScore += pointsPerAttr;
      } else {
        missingFields.push(`Attribute: ${attr.label}`);
        publishBlockers.push(`Required attribute '${attr.label}' for category '${categoryRule?.label || product.category}' is missing`);
      }
    }
  } else {
    // If no specific required attributes, scale coreScore to 100
    attributeScore = (coreScore / maxCoreScore) * maxAttributeScore;
  }

  const rawScore = coreScore + attributeScore;
  const score = Math.min(100, Math.round(rawScore));
  const isComplete = missingFields.length === 0 && score === 100;
  const canPublish = isComplete && publishBlockers.length === 0;

  return {
    score,
    missingFields,
    isComplete,
    canPublish,
    publishBlockers,
  };
}
