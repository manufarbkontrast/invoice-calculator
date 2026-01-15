CREATE TABLE `invoices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileUrl` text NOT NULL,
	`fileSize` int NOT NULL,
	`toolName` varchar(255),
	`companyName` varchar(255),
	`amount` int NOT NULL,
	`currency` varchar(10) NOT NULL DEFAULT 'EUR',
	`invoiceDate` timestamp,
	`period` varchar(255),
	`month` varchar(7) NOT NULL,
	`status` enum('processing','completed','failed') NOT NULL DEFAULT 'processing',
	`extractionError` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `invoices_id` PRIMARY KEY(`id`)
);
