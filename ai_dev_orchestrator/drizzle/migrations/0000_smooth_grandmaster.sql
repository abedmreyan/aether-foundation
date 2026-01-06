CREATE TABLE `agentActivityLogs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`agentId` integer NOT NULL,
	`taskId` integer,
	`action` text NOT NULL,
	`details` text,
	`mcpToolCalled` text,
	`timestamp` integer NOT NULL,
	FOREIGN KEY (`agentId`) REFERENCES `agents`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`taskId`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `agentMessages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`fromAgentId` integer NOT NULL,
	`toAgentId` integer NOT NULL,
	`taskId` integer,
	`type` text NOT NULL,
	`content` text NOT NULL,
	`response` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`createdAt` integer NOT NULL,
	`answeredAt` integer,
	FOREIGN KEY (`fromAgentId`) REFERENCES `agents`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`toAgentId`) REFERENCES `agents`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`taskId`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `agents` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`role` text NOT NULL,
	`specialization` text NOT NULL,
	`status` text DEFAULT 'idle' NOT NULL,
	`currentTaskId` integer,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `approvals` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`entityType` text NOT NULL,
	`entityId` integer NOT NULL,
	`status` text NOT NULL,
	`comments` text,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `deliverables` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`taskId` integer NOT NULL,
	`agentId` integer NOT NULL,
	`type` text NOT NULL,
	`name` text NOT NULL,
	`url` text NOT NULL,
	`description` text,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`taskId`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`agentId`) REFERENCES `agents`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `knowledgeBase` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`projectId` integer NOT NULL,
	`key` text NOT NULL,
	`value` text NOT NULL,
	`source` text NOT NULL,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `modules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`subsystemId` integer NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`status` text DEFAULT 'planned' NOT NULL,
	`ownerAgentId` integer,
	`designDocUrl` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`subsystemId`) REFERENCES `subsystems`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `projectAttachments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`projectId` integer NOT NULL,
	`fileName` text NOT NULL,
	`fileSize` integer NOT NULL,
	`mimeType` text NOT NULL,
	`fileKey` text NOT NULL,
	`fileUrl` text NOT NULL,
	`uploadedBy` integer NOT NULL,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`uploadedBy`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`status` text DEFAULT 'ideation' NOT NULL,
	`createdBy` integer NOT NULL,
	`aiPmId` integer,
	`strategyDocUrl` text,
	`architectureDocUrl` text,
	`googleTasksListId` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `proposals` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`projectId` integer NOT NULL,
	`proposalType` text NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`status` text DEFAULT 'pending_review' NOT NULL,
	`createdBy` integer NOT NULL,
	`reviewedBy` integer,
	`feedback` text,
	`createdAt` integer NOT NULL,
	`reviewedAt` integer,
	FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`createdBy`) REFERENCES `agents`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reviewedBy`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `subsystems` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`projectId` integer NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`status` text DEFAULT 'planned' NOT NULL,
	`ownerAgentId` integer,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `taskDependencies` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`taskId` integer NOT NULL,
	`dependsOnTaskId` integer NOT NULL,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`taskId`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`dependsOnTaskId`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`moduleId` integer NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`requirements` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`assignedAgentId` integer,
	`progressPercentage` integer DEFAULT 0 NOT NULL,
	`blockerReason` text,
	`googleTaskId` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`completedAt` integer,
	FOREIGN KEY (`moduleId`) REFERENCES `modules`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assignedAgentId`) REFERENCES `agents`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`openId` text NOT NULL,
	`name` text,
	`email` text,
	`loginMethod` text,
	`role` text DEFAULT 'user' NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`lastSignedIn` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_openId_unique` ON `users` (`openId`);