CREATE TABLE `chatbotRoutingConnections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`routingRuleId` int NOT NULL,
	`sourceNodeId` varchar(64) NOT NULL,
	`targetNodeId` varchar(64) NOT NULL,
	`conditionLabel` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chatbotRoutingConnections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chatbotRoutingNodes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`routingRuleId` int NOT NULL,
	`nodeId` varchar(64) NOT NULL,
	`nodeType` enum('chatbot','condition','mcp_check','handoff') NOT NULL,
	`chatbotId` int,
	`conditionConfig` text,
	`positionX` int DEFAULT 0,
	`positionY` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chatbotRoutingNodes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chatbotRoutingRules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`widgetId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`initialChatbotId` int NOT NULL,
	`routingConfig` text NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `chatbotRoutingRules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sessionChatbotHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`chatbotId` int NOT NULL,
	`handoffReason` text,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`endedAt` timestamp,
	CONSTRAINT `sessionChatbotHistory_id` PRIMARY KEY(`id`)
);
