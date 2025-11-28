const { Events } = require("discord.js");

module.exports = {
    name: Events.Warn,
    once: false,
    log: true,
    execute(client, logger, info) {
        // Filter out harmless YouTube extractor parsing warnings
        const warningString = typeof info === "string" ? info : JSON.stringify(info);
        if (
            warningString.includes("[YOUTUBEJS][Text]: Unable to find matching run for command run") ||
            warningString.includes("Unable to find matching run for command run")
        ) {
            // These are harmless parsing warnings from YouTube extractor, skip logging
            return;
        }
        
        logger.warning(`Warning: ${info}`);
    },
};