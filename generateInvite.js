require("dotenv").config();

const { PermissionsBitField } = require("discord.js");

// Permissions from README.md
const requiredPermissions = [
    PermissionsBitField.Flags.AddReactions,
    PermissionsBitField.Flags.Connect,
    PermissionsBitField.Flags.CreateGuildExpressions,
    PermissionsBitField.Flags.CreateInstantInvite,
    PermissionsBitField.Flags.DeafenMembers,
    PermissionsBitField.Flags.EmbedLinks,
    PermissionsBitField.Flags.ManageGuildExpressions,
    PermissionsBitField.Flags.ManageMessages,
    PermissionsBitField.Flags.ManageWebhooks,
    PermissionsBitField.Flags.MoveMembers,
    PermissionsBitField.Flags.MuteMembers,
    PermissionsBitField.Flags.SendMessages,
    PermissionsBitField.Flags.Speak,
    PermissionsBitField.Flags.UseExternalEmojis,
    PermissionsBitField.Flags.UseExternalStickers,
    PermissionsBitField.Flags.ViewAuditLog,
    PermissionsBitField.Flags.ViewChannel,
];

// Calculate permission integer
const permissionInteger = PermissionsBitField.resolve(requiredPermissions);

// Get CLIENT_ID from environment
const clientId = process.env.CLIENT_ID;

if (!clientId) {
    console.error("❌ CLIENT_ID is not set in your .env file!");
    process.exit(1);
}

// Generate invite URL
const inviteUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=${permissionInteger}&scope=bot%20applications.commands`;

console.log("\n🤖 Bot Invite URL:");
console.log("=".repeat(80));
console.log(inviteUrl);
console.log("=".repeat(80));
console.log("\n📋 Instructions:");
console.log("1. Copy the URL above");
console.log("2. Paste it into your browser");
console.log("3. Select your Discord server");
console.log("4. Authorize the bot with the required permissions");
console.log("5. The bot will join your server!\n");

