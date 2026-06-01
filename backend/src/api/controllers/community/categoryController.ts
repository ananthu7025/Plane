import { Request, Response, NextFunction } from "express";
import * as categoryService from "../../services/community/categoryService.js";
import { sendSuccess } from "../../../utils/response.js";

export async function getCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const categories = await categoryService.getCategories();
    sendSuccess(res, 200, categories);
  } catch (error) {
    next(error);
  }
}

export async function createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await categoryService.createCategory(req.body, req.userId!);
    sendSuccess(res, 201, { category: result });
  } catch (error) {
    next(error);
  }
}

export async function deleteCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = typeof req.params.id === "string" ? req.params.id : req.params.id[0];
    await categoryService.deleteCategory(parseInt(id));
    sendSuccess(res, 200, { message: "Category deleted" });
  } catch (error) {
    next(error);
  }
}
