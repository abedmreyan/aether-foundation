import { eq } from "drizzle-orm";
import { projectAttachments, type InsertProjectAttachment } from "../../drizzle/schema";
import { getDb } from "../db";

/**
 * Create a project attachment record
 */
export async function createAttachment(attachment: InsertProjectAttachment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(projectAttachments).values(attachment);
  const insertId = result[0].insertId;

  const created = await getAttachmentById(insertId);
  if (!created) throw new Error("Failed to retrieve created attachment");
  return created;
}

/**
 * Get attachment by ID
 */
export async function getAttachmentById(attachmentId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(projectAttachments)
    .where(eq(projectAttachments.id, attachmentId))
    .limit(1);

  return result[0];
}

/**
 * Get all attachments for a project
 */
export async function getAttachmentsByProject(projectId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(projectAttachments)
    .where(eq(projectAttachments.projectId, projectId));
}

/**
 * Delete an attachment
 */
export async function deleteAttachment(attachmentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(projectAttachments).where(eq(projectAttachments.id, attachmentId));
}
