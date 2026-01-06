CREATE TABLE `chatbotWidgets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`chatbotId` int NOT NULL,
	`widgetId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chatbotWidgets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chatbots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`systemPrompt` text NOT NULL,
	`temperature` int DEFAULT 70,
	`maxTokens` int DEFAULT 500,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `chatbots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `knowledgeBases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`chatbotId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`type` enum('text','url','file') NOT NULL,
	`fileUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `knowledgeBases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mcpServers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`chatbotId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`serverUrl` varchar(500) NOT NULL,
	`authType` enum('none','bearer','api_key','basic') NOT NULL DEFAULT 'none',
	`authToken` varchar(500),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mcpServers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `promptTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`category` varchar(100) NOT NULL,
	`description` text,
	`systemPrompt` text NOT NULL,
	`isPublic` boolean NOT NULL DEFAULT true,
	`userId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `promptTemplates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workflowLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workflowId` int NOT NULL,
	`status` enum('success','failed','skipped') NOT NULL,
	`triggerData` text,
	`executionResult` text,
	`errorMessage` text,
	`executedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workflowLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workflows` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`triggerType` enum('new_message','new_call','status_change','time_based','webhook') NOT NULL,
	`triggerConfig` text,
	`conditions` text,
	`actions` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`executionCount` int DEFAULT 0,
	`lastExecutedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workflows_id` PRIMARY KEY(`id`)
);
