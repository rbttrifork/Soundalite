const { EmbedBuilder } = require("discord.js");
const embedGenerator = require("@utils/helpers/embedGenerator");
const { useQueue, useTimeline, useMainPlayer } = require("discord-player");
const { getPauseMode } = require("@utils/helpers/playerHelpers");

module.exports = {
    name: "pause",
    description: "Pauses / Resumes currently playing music",
    category: "music",
    inVoiceChannel: true,
    inSameVoiceChannel: true,
    async execute(logger, client, message, args, flags) {
        try {
            const queue = useQueue(message.guild.id);
            const timeline = useTimeline(message.guild.id);

            if (!queue || !queue.currentTrack) {
                return await message.reply({ 
                    embeds: [embedGenerator.error("There is nothing in the queue right now.")] 
                });
            }

            if (!timeline) {
                return await message.reply({ 
                    embeds: [embedGenerator.error("Unable to access playback timeline.")] 
                });
            }

            const wasPaused = timeline.paused;
            try {
                if (wasPaused) {
                    timeline.resume();
                } else {
                    timeline.pause();
                }
            } catch (pauseError) {
                logger.error(`Error toggling pause: ${pauseError.message}`, pauseError);
                return await message.reply({ 
                    embeds: [embedGenerator.error("Failed to pause/resume playback. Please try again.")] 
                });
            }

            const embed = embedGenerator.info({
                title: getPauseMode(timeline),
                description: wasPaused ? "Resumed playback" : "Paused playback",
            }).withAuthor(message.author);

            await message.reply({ embeds: [embed] });
        } catch (error) {
            logger.error(`Error in pause command: ${error.message}`, error);
            try {
                await message.reply({ 
                    embeds: [embedGenerator.error("An error occurred while pausing/resuming. Please try again.")] 
                });
            } catch (replyError) {
                logger.error(`Error sending error reply: ${replyError.message}`);
            }
        }
    },
}; 
