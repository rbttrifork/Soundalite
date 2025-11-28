const embedGenerator = require("@utils/helpers/embedGenerator");
const { useQueue, useMainPlayer, QueueRepeatMode } = require("discord-player");

module.exports = {
    name: "skip",
    description: "Skip a currently playing song",
    category: "music",
    aliases: ["next"],
    cooldown: 1000,
    inVoiceChannel: true,
    inSameVoiceChannel: true,
    async execute(logger, client, message, args, flags) {
        try {
            let queue = useQueue(message.guild.id);
            if (!queue || !queue.currentTrack) {
                return await message.reply({ 
                    embeds: [embedGenerator.error("There is nothing in the queue right now.")] 
                });
            }

            const currentTrack = queue.currentTrack;
            
            if (!queue.node) {
                return await message.reply({ 
                    embeds: [embedGenerator.error("Unable to access the player node.")] 
                });
            }

            queue.node.skip();
            
            await message.reply({ 
                embeds: [embedGenerator.info({
                    title: "Skipped",
                    thumbnail: { url: currentTrack.thumbnail || null },
                    description: currentTrack.url 
                        ? `[${currentTrack.title}](${currentTrack.url})` 
                        : (currentTrack.title || "Unknown track"),
                }).withAuthor(message.author)] 
            });

            // Check for next track after a brief delay
            setTimeout(async () => {
                try {
                    const updatedQueue = useQueue(message.guild.id);
                    if (!updatedQueue || !updatedQueue.currentTrack) {
                        if (queue?.repeatMode !== QueueRepeatMode.AUTOPLAY) {
                            await message.channel.send({ 
                                embeds: [embedGenerator.warning("There is nothing left to play.")] 
                            });
                        } else {
                            await message.channel.send({ 
                                embeds: [embedGenerator.info("Autoplay is enabled, a song will start playing shortly.")] 
                            });
                        }
                        return;
                    }

                    await message.channel.send({ 
                        embeds: [embedGenerator.info({
                            title: "Now playing",
                            thumbnail: { url: updatedQueue.currentTrack.thumbnail || null },
                            description: updatedQueue.currentTrack.url 
                                ? `[${updatedQueue.currentTrack.title}](${updatedQueue.currentTrack.url})` 
                                : (updatedQueue.currentTrack.title || "Unknown track"),
                        })] 
                    });
                } catch (followUpError) {
                    logger.warning(`Error sending follow-up skip message: ${followUpError.message}`);
                }
            }, 500);
        } catch (error) {
            logger.error(`Error in skip command: ${error.message}`, error);
            try {
                await message.reply({ 
                    embeds: [embedGenerator.error("An error occurred while skipping the track. Please try again.")] 
                });
            } catch (replyError) {
                logger.error(`Error sending error reply: ${replyError.message}`);
            }
        }
    },
}; 