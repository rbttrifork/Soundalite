const { ApplicationCommandType, ApplicationCommandOptionType, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const embedGenerator = require("@utils/helpers/embedGenerator");
const { useQueue, useHistory } = require("discord-player");
const formatDuration = require("@utils/functions/formatDuration");
const { findBestMatch, algorithms } = require("@utils/algorithms/findBestMatch");

module.exports = {
    name: "queue",
    description: "Shows the current queue and/or history",
    type: ApplicationCommandType.ChatInput,
    category: "music",
    options: [
        {
            name: "search",
            description: "Search for a song in the queue",
            type: ApplicationCommandOptionType.String,
            required: false,
        },
    ],
    async execute(logger, interaction, client) {
        try {
            const queue = useQueue(interaction.guild.id);
            const history = useHistory(interaction.guild.id);

            if (!queue || !queue.tracks || !queue.currentTrack || queue.tracks.data.length === 0) {
                return await interaction.editReply({ 
                    embeds: [embedGenerator.error("There is nothing in the queue / currently playing.")] 
                });
            }

            const tracks = queue.tracks ? queue.tracks.data : [];
            const historyTracks = history?.tracks?.data?.length > 0 ? history.tracks.data : [];
            const currentTrack = queue.currentTrack;

            // Handle search option
            const searchQuery = interaction.options.getString("search");
            if (searchQuery) {
                try {
                    const bestMatch = findBestMatch(algorithms.FUZZY_MATCH, searchQuery, tracks.map(track => track.title));
                    const matches = bestMatch.matches.slice(0, 5);
                
                    if (matches.length === 0) {
                        return await interaction.editReply({ 
                            embeds: [embedGenerator.error("No results found in the queue.")] 
                        });
                    }
                
                    const maxIndexLength = tracks.length.toString().length;
                
                    const description = matches.map(match => {
                        const arrayPosition = tracks.findIndex(t => t.title === match.value);
                        if (arrayPosition === -1) return null;
                        const paddedIndex = (arrayPosition + 1).toString().padStart(maxIndexLength, " ");
                        const trackTitle = tracks[arrayPosition].title;
                        const boldedTitle = trackTitle.replace(new RegExp(`(${searchQuery})`, "gi"), "**$1**");
                        return `[\`${paddedIndex}\`] - ${boldedTitle} - ${tracks[arrayPosition].author || "Unknown"}`;
                    }).filter(Boolean).join("\n");
                
                    return await interaction.editReply({
                        embeds: [embedGenerator.info({
                            title: `Search results for "${searchQuery}"`,
                            description: description || "No matches found",
                        }).withAuthor(interaction.user)],
                    });
                } catch (searchError) {
                    logger.error(`Error in queue search: ${searchError.message}`, searchError);
                    return await interaction.editReply({ 
                        embeds: [embedGenerator.error("An error occurred while searching the queue.")] 
                    });
                }
            }

            // Build queue display with pagination
            const fieldPerPage = 10;
            let counter = 0;
            const trackPages = [];
            const historyPages = [];
            const trackFields = [];
            const historyFields = [];

            const maxTrackIndexLength = tracks.length.toString().length;
            const maxHistoryIndexLength = historyTracks.length.toString().length;

            tracks.forEach((track, index) => {
                const paddedIndex = (index + 1).toString().padStart(maxTrackIndexLength, " ");
                trackFields.push({
                    name: `[${paddedIndex}] - ${track.title} - ${track.author || "Unknown"}`,
                    value: `Requested by: ${track.requestedBy?.displayName ?? "N/A"}`,
                });
            });

            historyTracks.forEach((track, index) => {
                const paddedIndex = (-1 * (index + 1)).toString().padStart(maxHistoryIndexLength + 1, " ");
                historyFields.push({
                    name: `[${paddedIndex}] - ${track.title} - ${track.author || "Unknown"}`,
                    value: `Requested by: ${track.requestedBy?.displayName ?? "N/A"}`,
                });
            });

            // Paginate fields
            for (let i = 0; i < trackFields.length; i += fieldPerPage) {
                trackPages.push(trackFields.slice(i, i + fieldPerPage));
            }

            for (let i = 0; i < historyFields.length; i += fieldPerPage) {
                historyPages.push(historyFields.slice(i, i + fieldPerPage));
            }

            historyPages.reverse();
            const alltracks = [...historyPages, ...trackPages];

            if (alltracks.length === 0) {
                return await interaction.editReply({ 
                    embeds: [embedGenerator.info({
                        title: "Queue",
                        description: `Currently playing: **${currentTrack.title}** - ${currentTrack.author || "Unknown"}\n\nNo other tracks in queue.`,
                    }).withAuthor(interaction.user)] 
                });
            }

            // Create pagination buttons
            const FirstPage = new ButtonBuilder()
                .setCustomId(`queue_first_${interaction.user.id}`)
                .setLabel("Page 0")
                .setStyle(ButtonStyle.Success);

            const LastPage = new ButtonBuilder()
                .setCustomId(`queue_last_${interaction.user.id}`)
                .setLabel("▶▶")
                .setStyle(ButtonStyle.Success);

            const NextPage = new ButtonBuilder()
                .setCustomId(`queue_next_${interaction.user.id}`)
                .setLabel("▶")
                .setStyle(ButtonStyle.Primary);

            const PreviousPage = new ButtonBuilder()
                .setCustomId(`queue_previous_${interaction.user.id}`)
                .setLabel("◀")
                .setStyle(ButtonStyle.Primary);

            const PageNumber = new ButtonBuilder()
                .setCustomId(`queue_page_${interaction.user.id}`)
                .setLabel(`${counter - historyPages.length} / ${alltracks.length - historyPages.length - 1}`)
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true);

            const row = new ActionRowBuilder()
                .addComponents(FirstPage, PreviousPage, PageNumber, NextPage, LastPage);

            const setEmbed = (count) => {
                const embed = {
                    title: "Queue for the current guild",
                    description: `Currently playing: **${currentTrack.title}** - ${currentTrack.author || "Unknown"}`,
                    color: 0xffffff,
                    fields: alltracks[count] || [],
                    footer: { 
                        text: `Estimated time left: ${formatDuration(queue.estimatedDuration || 0)}` 
                    },
                };
                if ((count - historyPages.length) < 0) embed.title = "History for the current guild";
                return embed;
            };

            const updateComponents = (count) => {
                row.components[0].setDisabled(count === historyPages.length);
                row.components[1].setDisabled(count === 0);
                row.components[2].setLabel(`${count - historyPages.length} / ${Math.max(0, alltracks.length - historyPages.length - 1)}`);
                row.components[3].setDisabled(count >= alltracks.length - 1);
                row.components[4].setDisabled(count >= alltracks.length - 1);
            };

            counter = historyPages.length;
            updateComponents(counter);

            const helpMessage = await interaction.editReply({
                embeds: [setEmbed(counter)],
                components: [row],
            });

            const filter = (buttonInteraction) => {
                return buttonInteraction.user.id === interaction.user.id;
            };

            const collector = helpMessage.createMessageComponentCollector({
                filter,
                time: 120000,
                dispose: true,
            });
            
            collector.on("collect", async (buttonInteraction) => {
                try {
                    const customId = buttonInteraction.customId;
                    
                    if (customId.includes("next")) {
                        counter = Math.min(counter + 1, alltracks.length - 1);
                    } else if (customId.includes("previous")) {
                        counter = Math.max(counter - 1, 0);
                    } else if (customId.includes("first")) {
                        counter = historyPages.length;
                    } else if (customId.includes("last")) {
                        counter = alltracks.length - 1;
                    }

                    updateComponents(counter);

                    await buttonInteraction.update({
                        embeds: [setEmbed(counter)],
                        components: [row],
                    });
                } catch (buttonError) {
                    logger.error(`Error handling queue button: ${buttonError.message}`, buttonError);
                }
            });

            collector.on("end", async () => {
                try {
                    row.components.forEach(component => {
                        component.setDisabled(true);
                    });
                    await helpMessage.edit({
                        embeds: [setEmbed(counter)],
                        components: [row],
                    });
                } catch (endError) {
                    logger.warning(`Error ending queue collector: ${endError.message}`);
                }
            });
        } catch (error) {
            logger.error(`Error in /queue command: ${error.message}`, error);
            await interaction.editReply({ 
                embeds: [embedGenerator.error("An error occurred while fetching the queue. Please try again.")],
                flags: 64, // Ephemeral
            });
        }
    },
};

