const { ApplicationCommandType } = require("discord.js");
const { PermissionsBitField } = require("discord.js");
const embedGenerator = require("@utils/helpers/embedGenerator");
const { useQueue, useTimeline } = require("discord-player");
const { getPauseMode } = require("@utils/helpers/playerHelpers");

module.exports = {
    name: "pause",
    description: "Pause or resume the currently playing music",
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
            const timeline = useTimeline(interaction.guild.id);

            if (!queue || !queue.currentTrack) {
                return await interaction.editReply({ 
                    embeds: [embedGenerator.error("There is nothing in the queue right now.")] 
                });
            }

            if (!timeline) {
                return await interaction.editReply({ 
                    embeds: [embedGenerator.error("Unable to access playback timeline.")] 
                });
            }

            // Toggle pause/resume
            const wasPaused = timeline.paused;
            if (wasPaused) {
                timeline.resume();
            } else {
                timeline.pause();
            }

            const embed = embedGenerator.info({
                title: getPauseMode(timeline),
                description: wasPaused 
                    ? "Resumed playback" 
                    : "Paused playback",
            }).withAuthor(interaction.user);

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            logger.error(`Error in /pause command: ${error.message}`, error);
            await interaction.editReply({ 
                embeds: [embedGenerator.error("An error occurred while pausing/resuming. Please try again.")],
                flags: 64, // Ephemeral
            });
        }
    },
};

