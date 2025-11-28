require("dotenv").config();
const express = require("express");
const path = require("path");
const { PermissionsBitField } = require("discord.js");

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, "public")));

// Permissions from generateInvite.js
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

// API endpoint to get bot configuration and invite URL
app.get("/api/config", (req, res) => {
    const clientId = process.env.CLIENT_ID;
    
    if (!clientId) {
        return res.status(500).json({ 
            error: "CLIENT_ID is not configured. Please set it in your .env file." 
        });
    }

    // Calculate permission integer (returns BigInt)
    const permissionInteger = PermissionsBitField.resolve(requiredPermissions);
    
    // Convert BigInt to string for JSON serialization and URL
    const permissionIntegerString = permissionInteger.toString();
    
    // Generate invite URL
    const inviteUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=${permissionIntegerString}&scope=bot%20applications.commands`;

    res.json({ 
        clientId,
        inviteUrl,
        permissionInteger: permissionIntegerString
    });
});

// Health check endpoint
app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Serve the SPA for all other routes
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
    console.log(`🎮 Retro invite page running on http://localhost:${PORT}`);
    console.log(`📡 Make sure CLIENT_ID is set in your .env file`);
});

