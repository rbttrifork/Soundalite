const { ApplicationCommandType, ApplicationCommandOptionType } = require("discord.js");
const { PermissionsBitField } = require("discord.js");
const embedGenerator = require("@utils/helpers/embedGenerator");
const { useQueue, QueueRepeatMode } = require("discord-player");

module.exports = {
    name: "skip",
    description: "Skip the currently playing song",
    type: ApplicationCommandType.ChatInput,
    category: "music",
    permissions: [PermissionsBitField.Flags.Connect, PermissionsBitField.Flags.Speak],
    cooldown: 1000,
    inVoiceChannel: true,
    inSameVoiceChannel: true,
    async execute(logger, interaction, client) {
        try {
            if (!interaction.member.voice.channel) {
                return await interaction.editReply({ 
                    embeds: [embedGenerator.error("You must be in a voice channel to use this command.")] 
                });
            }

            const queue = useQueue(interaction.guild.id);

            if (!queue || !queue.currentTrack) {
                return await interaction.editReply({ 
                    embeds: [embedGenerator.error("There is nothing in the queue right now.")] 
                });
            }

            const currentTrack = queue.currentTrack;
            queue.node.skip();

            await interaction.editReply({ 
                embeds: [embedGenerator.info({
                    title: "Skipped",
                    thumbnail: { url: currentTrack.thumbnail },
                    description: currentTrack.url ? `[${currentTrack.title}](${currentTrack.url})` : currentTrack.title,
                }).withAuthor(interaction.user)] 
            });

            // Check if there's a next track
            const updatedQueue = useQueue(interaction.guild.id);
            if (!updatedQueue || !updatedQueue.currentTrack) {
                if (queue?.repeatMode !== QueueRepeatMode.AUTOPLAY) {
                    return await interaction.followUp({ 
                        embeds: [embedGenerator.warning("There is nothing left to play.")],
                        flags: 64, // Ephemeral
                    });
                } else {
                    return await interaction.followUp({ 
                        embeds: [embedGenerator.info("Autoplay is enabled, a song will start playing shortly.")],
                        flags: 64, // Ephemeral
                    });
                }
            }

            await interaction.followUp({ 
                embeds: [embedGenerator.info({
                    title: "Now playing",
                    thumbnail: { url: updatedQueue.currentTrack.thumbnail },
                    description: updatedQueue.currentTrack.url 
                        ? `[${updatedQueue.currentTrack.title}](${updatedQueue.currentTrack.url})` 
                        : updatedQueue.currentTrack.title,
                })],
                flags: 64, // Ephemeral
            });
        } catch (error) {
            logger.error(`Error in /skip command: ${error.message}`, error);
            await interaction.editReply({ 
                embeds: [embedGenerator.error("An error occurred while skipping the track. Please try again.")],
                flags: 64, // Ephemeral
            });
        }
    },
};

