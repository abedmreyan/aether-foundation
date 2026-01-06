CREATE TABLE `agentActivityLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agentId` int NOT NULL,
	`taskId` int,
	`action` varchar(255) NOT NULL,
	`details` text,
	`mcpToolCalled` varchar(255),
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agentActivityLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `agents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`role` enum('project_manager','research','architecture','ui_ux','frontend','backend','devops','qa') NOT NULL,
	`specialization` text NOT NULL,
	`status` enum('idle','working','blocked') NOT NULL DEFAULT 'idle',
	`currentTaskId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `approvals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`entityType` enum('proposal','task','deliverable') NOT NULL,
	`entityId` int NOT NULL,
	`status` enum('approved','rejected','pending_revision') NOT NULL,
	`comments` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `approvals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `deliverables` (
	`id` int AUTO_INCREMENT NOT NULL,
	`taskId` int NOT NULL,
	`agentId` int NOT NULL,
	`type` varchar(100) NOT NULL,
	`name` varchar(255) NOT NULL,
	`url` text NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `deliverables_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `knowledgeBase` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`key` varchar(255) NOT NULL,
	`value` text NOT NULL,
	`source` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `knowledgeBase_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `modules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`subsystemId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`status` enum('planned','designing','in_development','testing','deployed') NOT NULL DEFAULT 'planned',
	`ownerAgentId` int,
	`designDocUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `modules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`status` enum('ideation','strategy_review','design','development','testing','deployed') NOT NULL DEFAULT 'ideation',
	`createdBy` int NOT NULL,
	`aiPmId` int,
	`strategyDocUrl` text,
	`architectureDocUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `proposals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`proposalType` enum('strategy','design','task_assignment') NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`status` enum('pending_review','approved','rejected','revised') NOT NULL DEFAULT 'pending_review',
	`createdBy` int NOT NULL,
	`reviewedBy` int,
	`feedback` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`reviewedAt` timestamp,
	CONSTRAINT `proposals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subsystems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`status` enum('planned','designing','in_development','testing','deployed') NOT NULL DEFAULT 'planned',
	`ownerAgentId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subsystems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `taskDependencies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`taskId` int NOT NULL,
	`dependsOnTaskId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `taskDependencies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`moduleId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`requirements` text NOT NULL,
	`status` enum('pending','assigned','in_progress','completed','approved','blocked') NOT NULL DEFAULT 'pending',
	`assignedAgentId` int,
	`progressPercentage` int NOT NULL DEFAULT 0,
	`blockerReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`completedAt` timestamp,
	CONSTRAINT `tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `agentActivityLogs` ADD CONSTRAINT `agentActivityLogs_agentId_agents_id_fk` FOREIGN KEY (`agentId`) REFERENCES `agents`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `agentActivityLogs` ADD CONSTRAINT `agentActivityLogs_taskId_tasks_id_fk` FOREIGN KEY (`taskId`) REFERENCES `tasks`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `approvals` ADD CONSTRAINT `approvals_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `deliverables` ADD CONSTRAINT `deliverables_taskId_tasks_id_fk` FOREIGN KEY (`taskId`) REFERENCES `tasks`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `deliverables` ADD CONSTRAINT `deliverables_agentId_agents_id_fk` FOREIGN KEY (`agentId`) REFERENCES `agents`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `knowledgeBase` ADD CONSTRAINT `knowledgeBase_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `modules` ADD CONSTRAINT `modules_subsystemId_subsystems_id_fk` FOREIGN KEY (`subsystemId`) REFERENCES `subsystems`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `projects` ADD CONSTRAINT `projects_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `proposals` ADD CONSTRAINT `proposals_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `proposals` ADD CONSTRAINT `proposals_createdBy_agents_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `agents`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `proposals` ADD CONSTRAINT `proposals_reviewedBy_users_id_fk` FOREIGN KEY (`reviewedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subsystems` ADD CONSTRAINT `subsystems_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `taskDependencies` ADD CONSTRAINT `taskDependencies_taskId_tasks_id_fk` FOREIGN KEY (`taskId`) REFERENCES `tasks`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `taskDependencies` ADD CONSTRAINT `taskDependencies_dependsOnTaskId_tasks_id_fk` FOREIGN KEY (`dependsOnTaskId`) REFERENCES `tasks`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_moduleId_modules_id_fk` FOREIGN KEY (`moduleId`) REFERENCES `modules`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_assignedAgentId_agents_id_fk` FOREIGN KEY (`assignedAgentId`) REFERENCES `agents`(`id`) ON DELETE no action ON UPDATE no action;