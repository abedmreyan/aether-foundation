CREATE TABLE `calls` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`widgetId` int NOT NULL,
	`agentId` int,
	`callSid` varchar(255),
	`status` enum('initiated','ringing','in-progress','completed','failed','busy','no-answer') NOT NULL DEFAULT 'initiated',
	`duration` int DEFAULT 0,
	`recordingUrl` text,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`endedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `calls_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `twilioSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`accountSid` varchar(255),
	`authToken` varchar(255),
	`twimlAppSid` varchar(255),
	`phoneNumber` varchar(20),
	`isConfigured` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `twilioSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `twilioSettings_userId_unique` UNIQUE(`userId`)
);
