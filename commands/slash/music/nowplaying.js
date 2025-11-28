const { ApplicationCommandType } = require("discord.js");
const embedGenerator = require("@utils/helpers/embedGenerator");
const { getLoopMode, getPauseMode } = require("@utils/helpers/playerHelpers");
const { useQueue, useTimeline } = require("discord-player");
const isURL = require("@utils/functions/isURL");

module.exports = {
    name: "nowplaying",
    description: "See what song is currently playing",
    type: ApplicationCommandType.ChatInput,
    category: "music",
    aliases: ["np", "playing"],
    async execute(logger, interaction, client) {
        try {
            const queue = useQueue(interaction.guild.id);
            const timeline = useTimeline(interaction.guild.id);

            if (!queue || !queue.currentTrack) {
                return await interaction.editReply({ 
                    embeds: [embedGenerator.error("There is nothing in the queue right now.")] 
                });
            }

            const track = queue.currentTrack;

            // Create progress bar safely
            let progressBar = "▬▬▬▬▬▬▬▬▬▬▬▬▬▬";
            let progressPercent = "0%";
            
            try {
                if (track.raw?.live) {
                    progressBar = "Live ┃ ▬▬▬▬▬▬▬▬▬▬▬▬▬▬🔘 ┃ Infinity";
                    progressPercent = "99%";
                } else if (queue.node && timeline?.timestamp) {
                    progressBar = queue.node.createProgressBar() || progressBar;
                    progressPercent = `${timeline.timestamp.progress || 0}%`;
                }
            } catch (progressError) {
                logger.warning(`Error creating progress bar: ${progressError.message}`);
            }

            const embed = embedGenerator.info({
                title: "Now Playing",
                description: 
                    `${isURL(track.url) ? `[${track.title}](${track.url})` : track.title}\n` +
                    `Requested by: ${track.requestedBy?.displayName || "Unknown"}`,
                thumbnail: { url: track.thumbnail || null },
                fields: [
                    { name: "Author", value: track.author || "Unknown", inline: false },
                    { name: "Progress", value: `${progressBar} (${progressPercent})`, inline: false }, 
                    { name: "Loop mode", value: getLoopMode(queue), inline: true },
                    { name: "Play mode", value: getPauseMode(timeline || queue), inline: true },
                    { name: "Extractor", value: `\`${track.extractor?.identifier || "N/A"}\``, inline: false },
                ],
                footer: { 
                    text: `Event Loop Lag: ${queue.player?.eventLoopLag?.toFixed(0) || "N/A"}ms` 
                },
            }).withAuthor(track.requestedBy || interaction.user);

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            logger.error(`Error in /nowplaying command: ${error.message}`, error);
            await interaction.editReply({ 
                embeds: [embedGenerator.error("An error occurred while fetching the current track. Please try again.")],
                flags: 64, // Ephemeral
            });
        }
    },
};

