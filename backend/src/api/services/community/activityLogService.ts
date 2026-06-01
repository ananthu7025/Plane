import { logger } from "../../../utils/logger.js";
export async function logActivity(userId: string, action: string, resourceId: string, resourceType: string): Promise<void> {
  try {
    logger.info("Activity logged", "APP", { userId, action, resourceId, resourceType });
  } catch (error) {
    logger.error("Failed to log activity", undefined, error instanceof Error ? error : undefined);
  }
}
