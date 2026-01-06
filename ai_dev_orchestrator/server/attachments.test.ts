import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return ctx;
}

describe("File Attachments", () => {
  let testProjectId: number;
  let testAttachmentId: number;

  beforeAll(async () => {
    // Create a test project
    const project = await db.createProject({
      name: "Test Project for Attachments",
      description: "Testing file attachments",
      status: "ideation",
      createdBy: 1,
    });
    testProjectId = project.id;
  });

  it("should upload a file attachment", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // Create a small test file (1KB of data)
    const testFileData = Buffer.from("Test file content for attachment").toString("base64");

    const result = await caller.attachments.upload({
      projectId: testProjectId,
      fileName: "test-document.txt",
      fileSize: 33,
      mimeType: "text/plain",
      fileData: testFileData,
    });

    expect(result).toBeDefined();
    expect(result.id).toBeGreaterThan(0);
    expect(result.fileName).toBe("test-document.txt");
    expect(result.projectId).toBe(testProjectId);
    expect(result.fileUrl).toBeDefined();
    expect(result.fileKey).toBeDefined();

    testAttachmentId = result.id;
  });

  it("should list attachments by project", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const attachments = await caller.attachments.listByProject({
      projectId: testProjectId,
    });

    expect(attachments).toBeDefined();
    expect(Array.isArray(attachments)).toBe(true);
    expect(attachments.length).toBeGreaterThan(0);

    const testAttachment = attachments.find((a) => a.id === testAttachmentId);
    expect(testAttachment).toBeDefined();
    expect(testAttachment?.fileName).toBe("test-document.txt");
  });

  it("should delete an attachment", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.attachments.delete({
      attachmentId: testAttachmentId,
    });

    expect(result.success).toBe(true);

    // Verify deletion
    const attachments = await caller.attachments.listByProject({
      projectId: testProjectId,
    });

    const deletedAttachment = attachments.find((a) => a.id === testAttachmentId);
    expect(deletedAttachment).toBeUndefined();
  });

  it("should handle multiple file uploads", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // Upload multiple files
    const files = [
      { name: "file1.pdf", mime: "application/pdf" },
      { name: "file2.png", mime: "image/png" },
      { name: "file3.zip", mime: "application/zip" },
    ];

    for (const file of files) {
      const testData = Buffer.from(`Content of ${file.name}`).toString("base64");
      
      await caller.attachments.upload({
        projectId: testProjectId,
        fileName: file.name,
        fileSize: testData.length,
        mimeType: file.mime,
        fileData: testData,
      });
    }

    // Verify all files were uploaded
    const attachments = await caller.attachments.listByProject({
      projectId: testProjectId,
    });

    expect(attachments.length).toBeGreaterThanOrEqual(3);
    
    const uploadedNames = attachments.map((a) => a.fileName);
    expect(uploadedNames).toContain("file1.pdf");
    expect(uploadedNames).toContain("file2.png");
    expect(uploadedNames).toContain("file3.zip");
  });
});
