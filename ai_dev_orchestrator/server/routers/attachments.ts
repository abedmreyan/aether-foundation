import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { storagePut } from "../storage";
import * as attachmentsDb from "../db/attachments";
import { nanoid } from "nanoid";

export const attachmentsRouter = router({
  /**
   * Upload a file and create attachment record
   */
  upload: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        fileName: z.string(),
        fileSize: z.number(),
        mimeType: z.string(),
        fileData: z.string(), // base64 encoded file data
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Decode base64 file data
      const fileBuffer = Buffer.from(input.fileData, "base64");

      // Generate unique file key
      const fileExtension = input.fileName.split(".").pop() || "";
      const uniqueId = nanoid(10);
      const fileKey = `projects/${input.projectId}/attachments/${uniqueId}-${input.fileName}`;

      // Upload to S3
      const { url } = await storagePut(fileKey, fileBuffer, input.mimeType);

      // Create database record
      const attachment = await attachmentsDb.createAttachment({
        projectId: input.projectId,
        fileName: input.fileName,
        fileSize: input.fileSize,
        mimeType: input.mimeType,
        fileKey,
        fileUrl: url,
        uploadedBy: ctx.user.id,
      });

      return attachment;
    }),

  /**
   * Get all attachments for a project
   */
  listByProject: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      return attachmentsDb.getAttachmentsByProject(input.projectId);
    }),

  /**
   * Delete an attachment
   */
  delete: protectedProcedure
    .input(z.object({ attachmentId: z.number() }))
    .mutation(async ({ input }) => {
      await attachmentsDb.deleteAttachment(input.attachmentId);
      return { success: true };
    }),
});
