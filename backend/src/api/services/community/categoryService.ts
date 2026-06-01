import { db } from "../../../db/index.js";
import { communityCategories } from "../../../db/schema.js";
import { eq } from "drizzle-orm";
import { CategoryNotFoundError, CategoryAlreadyExistsError } from "../../../utils/errors.js";
import { logger } from "../../../utils/logger.js";

/**
 * Generate slug from category name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/**
 * Get all active categories
 */
export async function getCategories(): Promise<any[]> {
  try {
    const categories = await db.query.communityCategories.findMany({
      where: (table) => eq(table.isActive, true),
    });

    return categories;
  } catch (error) {
    logger.error("Failed to fetch categories", "APP", error instanceof Error ? error : undefined);
    throw new CategoryNotFoundError("Failed to fetch categories");
  }
}

/**
 * Create a new category
 */
export async function createCategory(
  data: { name: string; description?: string; color?: string; slug?: string },
  adminId: string
): Promise<any> {
  try {
    // Check if category already exists
    const existingCategory = await db.query.communityCategories.findFirst({
      where: (table) => eq(table.name, data.name),
    });

    if (existingCategory) {
      throw new CategoryAlreadyExistsError(data.name);
    }

    // Generate slug from name if not provided
    const slug = data.slug || generateSlug(data.name);

    // Check if slug already exists
    const existingSlug = await db.query.communityCategories.findFirst({
      where: (table) => eq(table.slug, slug),
    });

    if (existingSlug) {
      throw new CategoryAlreadyExistsError(data.name);
    }

    // Create category
    const [category] = await db
      .insert(communityCategories)
      .values({
        name: data.name,
        description: data.description || null,
        slug: slug,
        isActive: true,
        createdAt: new Date(),
      })
      .returning();

    logger.info("Category created", "APP", { categoryId: category.id, adminId });
    return category;
  } catch (error) {
    if (error instanceof CategoryAlreadyExistsError) throw error;
    logger.error("Failed to create category", "APP", error instanceof Error ? error : undefined);
    throw new CategoryAlreadyExistsError(data.name);
  }
}

/**
 * Delete a category (hard delete)
 */
export async function deleteCategory(categoryId: number): Promise<void> {
  try {
    // Check if category exists
    const category = await db.query.communityCategories.findFirst({
      where: (table) => eq(table.id, categoryId),
    });

    if (!category) {
      throw new CategoryNotFoundError(`Category with ID ${categoryId} not found`);
    }

    // Delete category
    await db
      .delete(communityCategories)
      .where(eq(communityCategories.id, categoryId));

    logger.info("Category deleted", "APP", { categoryId });
  } catch (error) {
    if (error instanceof CategoryNotFoundError) throw error;
    logger.error("Failed to delete category", "APP", error instanceof Error ? error : undefined);
    throw new CategoryNotFoundError(`Failed to delete category with ID ${categoryId}`);
  }
}
