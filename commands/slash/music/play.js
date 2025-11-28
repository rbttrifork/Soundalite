const { ApplicationCommandType, ApplicationCommandOptionType, ActionRowBuilder, StringSelectMenuBuilder, MessageFlags } = require("discord.js");
const { PermissionsBitField } = require("discord.js");
const embedGenerator = require("@utils/helpers/embedGenerator");
const { getLoopMode } = require("@utils/helpers/playerHelpers");
const { QueryType, useMainPlayer, useQueue, QueryResolver } = require("discord-player");
const { SpotifyExtractor } = require("discord-player-spotify");
const config = require("@utils/config/configUtils");
const { searchWithPriorities, getProbableBridgeSource } = require("@utils/helpers/playerHelpers");
const fs = require("fs");
const isURL = require("@utils/functions/isURL");
const { simpleFolderSearch } = require("simple-folder-search");

// Store search results temporarily for select menu interactions
const searchResultsCache = new Map();

module.exports = {
    name: "play",
    description: "Play a song (works best with Deezer or Soundcloud links (YouTube breaks often))",
    type: ApplicationCommandType.ChatInput,
    category: "music",
    permissions: [PermissionsBitField.Flags.Connect, PermissionsBitField.Flags.Speak],
    cooldown: 1000,
    inVoiceChannel: true,
    options: [
        {
            name: "song",
            description: "Song link or search query",
            type: ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: "shuffle",
            description: "Shuffle the results before playing",
            type: ApplicationCommandOptionType.Boolean,
            required: false,
        },
        {
            name: "playnext",
            description: "Put the song(s) on top of the queue",
            type: ApplicationCommandOptionType.Boolean,
            required: false,
        },
    ],
    async execute(logger, interaction, client) {
        const player = useMainPlayer();
        const queue = useQueue();
        const playerConfig = config.get("discordPlayer");

        if (!interaction.member.voice.channel) {
            return await interaction.editReply({ 
                embeds: [embedGenerator.error("You must be in a voice channel to use this command.")] 
            });
        }

        // Try multiple ways to get the song option
        let songQuery = interaction.options.getString("song");
        
        // Fallback: try getting from data array
        if (!songQuery) {
            const songOption = interaction.options.data.find(opt => opt.name === "song");
            if (songOption) {
                songQuery = songOption.value;
            }
        }
        
        // Another fallback: try getting by index (first option should be song)
        if (!songQuery && interaction.options.data.length > 0) {
            songQuery = interaction.options.data[0].value;
        }
        
        const shuffle = interaction.options.getBoolean("shuffle") || false;
        const playnext = interaction.options.getBoolean("playnext") || false;

        logger.debug(`Play command received - songQuery: "${songQuery}", type: ${typeof songQuery}, all options: ${JSON.stringify(interaction.options.data)}`);

        if (!songQuery || (typeof songQuery === "string" && songQuery.trim().length === 0)) {
            logger.warning(`Song query is empty or invalid. Raw value: ${songQuery}, options data: ${JSON.stringify(interaction.options.data)}`);
            return await interaction.editReply({ 
                embeds: [embedGenerator.warning("Please enter a song URL or query to search.")] 
            });
        }

        let string = songQuery.trim();

        const queryType = await awareQueryResolver(string, player, playerConfig);
        if (!isURL(string)) {
            queryType.canStream = false;
            queryType.type = "search";
        }

        if (isURL(string) && string.includes("deezer")) string = await unshortenURL(string);
        if (isURL(string) && new URL(string).hostname === "youtu.be") string = string.split("?list=")[0];

        await interaction.editReply({ 
            embeds: [embedGenerator.info({
                description: "Request received, fetching...",
                footer: { text: "Age restricted videos might not work." },
            })] 
        });

        try {
            let research, specificSearch;

            if (!queryType.canStream && queryType.type !== "playlist") {
                if (
                    queryType.extractor?.identifier === SpotifyExtractor.identifier 
                    && queryType.type === "track" 
                    && playerConfig.extractors.Spotify.enabled
                ) {
                    research = await player.search(string, {
                        requestedBy: interaction.member,
                        searchEngine: `ext:${SpotifyExtractor.identifier}`,
                    });
                    if (!research.hasTracks()) {
                        return await interaction.editReply({ 
                            embeds: [embedGenerator.warning("No results found")] 
                        });
                    }
                    specificSearch = research.tracks[0]?.title ? `${research.tracks[0].title} - ${research.tracks[0].author}` : string;
                } else {
                    specificSearch = string;
                }

                research = await player.search(specificSearch, {
                    requestedBy: interaction.member,
                    searchEngine: "ext:" + searchWithPriorities(playerConfig),
                });

                if (!research.hasTracks()) {
                    let footerText = "";
                    if (!playerConfig.extractors.Youtubei.enabled && (string.includes("youtube.com") || string.includes("youtu.be"))) { 
                        footerText = playerConfig.extractors.Youtubei.config.attemptYoutubeSearchEvenIfDisabled.usingEmbed
                            ? "YouTube extraction is disabled, to support YouTube links, the YouTube embed must be visible (and it still might fail)"
                            : "Youtube has been disabled, for more info, use the help command and go in the support server.";
                    }
                    return await interaction.editReply({ 
                        embeds: [embedGenerator.warning({
                            description: "No results found",
                            footer: { text: footerText || undefined },
                        })] 
                    });
                }

                const musicPath = process.cwd() + "/music";
                let fileTrack = null;
                if (fs.existsSync(musicPath)) {
                    const files = await simpleFolderSearch(musicPath, playerConfig.supportedFileExtensions, string, { minimumScore: 0.4 });
                    if (files.length) {
                        try {
                            fileTrack = await player.search(files[0], { 
                                requestedBy: interaction.member,
                                searchEngine: QueryType.FILE,
                            });
                        } catch {
                            fileTrack = null;
                        }
                    }
                }

                if (fileTrack) {
                    fileTrack.tracks[0].title = "[Local file] " + fileTrack.tracks[0].title;
                    research.tracks.unshift(fileTrack.tracks[0]);
                }

                // If multiple results, show select menu
                if (research.tracks.length > 1) {
                    const cacheKey = `${interaction.user.id}-${Date.now()}`;
                    searchResultsCache.set(cacheKey, {
                        research,
                        shuffle,
                        playnext,
                        queryType,
                        string,
                        playerConfig,
                        userId: interaction.user.id,
                    });

                    const selectMenu = new StringSelectMenuBuilder()
                        .setCustomId(`play_select_${cacheKey}`)
                        .setPlaceholder("Select a track to play")
                        .addOptions(
                            research.tracks.slice(0, 25).map((track, index) => ({
                                label: track.title.length > 100 ? track.title.substring(0, 97) + "..." : track.title,
                                description: track.author ? (track.author.length > 100 ? track.author.substring(0, 97) + "..." : track.author) : "Unknown artist",
                                value: index.toString(),
                            }))
                        );

                    const row = new ActionRowBuilder().addComponents(selectMenu);

                    const choicesEmbed = embedGenerator.info({
                        title: "Select a track to play",
                        description: "Choose from the dropdown menu below",
                        fields: research.tracks.slice(0, 10).map((track, index) => ({
                            name: `${index + 1} - ${track.title}`,
                            value: `By ${track.author || "Unknown"}`,
                            inline: false,
                        })),
                    });

                    return await interaction.editReply({ 
                        embeds: [choicesEmbed],
                        components: [row],
                    });
                }
            } else {
                research = await player.search(string, { requestedBy: interaction.member });
                if (!research.hasTracks()) {
                    return await interaction.editReply({ 
                        embeds: [embedGenerator.warning({
                            description: "No results found",
                            footer: { 
                                text: !playerConfig.extractors.Youtubei.enabled && (string.includes("youtube.com") || string.includes("youtu.be")) 
                                    ? "Youtube has been disabled, for more info, use the help command and go in the support server." 
                                    : undefined,
                            },
                        })] 
                    });
                }
            }

            // Auto-select first result if single result or direct URL
            await playTrack(interaction, research, null, shuffle, playnext, queryType, string, playerConfig, logger);
        } catch (err) {
            logger.error(`Error in /play command: ${err.message}`, err);
            
            // Provide more specific error messages
            let errorMessage = "Failed to fetch / play the requested track";
            if (err.message?.includes("No results found")) {
                errorMessage = "No results found for your search. Try a different query or URL.";
            } else if (err.message?.includes("timeout")) {
                errorMessage = "The request timed out. Please try again.";
            } else if (err.message?.includes("network") || err.message?.includes("ECONNREFUSED")) {
                errorMessage = "Network error. Please check your connection and try again.";
            } else if (err.message?.includes("permission") || err.message?.includes("403")) {
                errorMessage = "Permission denied. The bot may not have access to this content.";
            }
            
            try {
                await interaction.editReply({ 
                    embeds: [embedGenerator.error(errorMessage)],
                    components: [],
                });
            } catch (replyError) {
                logger.error(`Error sending error reply: ${replyError.message}`);
                // Try followUp as fallback
                try {
                    await interaction.followUp({ 
                        embeds: [embedGenerator.error(errorMessage)],
                        flags: 64, // Ephemeral
                    });
                } catch (followUpError) {
                    logger.error(`Error sending followUp: ${followUpError.message}`);
                }
            }
        }
    },
};

// Handle select menu interactions for track selection
// This will be registered in the interaction handler
module.exports.handleSelectMenu = async (interaction, logger) => {
    if (!interaction.isStringSelectMenu() || !interaction.customId.startsWith("play_select_")) return;

    const cacheKey = interaction.customId.replace("play_select_", "");
    const cached = searchResultsCache.get(cacheKey);

    if (!cached) {
        return await interaction.reply({ 
            embeds: [embedGenerator.error("This selection menu has expired.")],
            flags: MessageFlags.Ephemeral,
        });
    }

    // Check if the user who clicked is the same as the one who initiated the command
    // We'll store the user ID in the cache
    if (cached.userId && cached.userId !== interaction.user.id) {
        return await interaction.reply({ 
            embeds: [embedGenerator.error("Only the user who initiated this command can select a track.")],
            flags: MessageFlags.Ephemeral,
        });
    }

    await interaction.deferUpdate();

    const choice = parseInt(interaction.values[0]);
    if (choice < 0 || choice >= cached.research.tracks.length) {
        return await interaction.editReply({ 
            embeds: [embedGenerator.error("Invalid selection")],
            components: [],
        });
    }

    searchResultsCache.delete(cacheKey);

    await playTrack(
        interaction,
        cached.research,
        choice,
        cached.shuffle,
        cached.playnext,
        cached.queryType,
        cached.string,
        cached.playerConfig,
        logger,
    );
};

async function playTrack(interaction, research, choice, shuffle, playnext, queryType, string, playerConfig, logger) {
    try {
        const player = useMainPlayer();
        const queue = useQueue(interaction.guild.id);

        // Validate voice channel
        if (!interaction.member?.voice?.channel) {
            return await interaction.editReply({ 
                embeds: [embedGenerator.error("You must be in a voice channel to play music.")],
                components: [],
            });
        }

        // Validate research results
        if (!research || !research.tracks || research.tracks.length === 0) {
            return await interaction.editReply({ 
                embeds: [embedGenerator.error("No tracks found to play.")],
                components: [],
            });
        }

        if (choice === -1) {
            return await interaction.editReply({ 
                embeds: [embedGenerator.warning("Play request cancelled")],
                components: [],
            });
        }

        // Validate choice if provided
        if (choice !== null && (choice < 0 || choice >= research.tracks.length)) {
            return await interaction.editReply({ 
                embeds: [embedGenerator.error("Invalid track selection. Please try again.")],
                components: [],
            });
        }

        // Check queue size limit
        const maxQueueSize = playerConfig?.globalPlayerNodeOptions?.maxSize || 10000;
        const tracksToAdd = choice !== null ? 1 : research.tracks.length;
        const currentQueueSize = queue?.size || 0;
        
        if (tracksToAdd + currentQueueSize > maxQueueSize) {
            return await interaction.editReply({ 
                embeds: [embedGenerator.warning(`Cannot enqueue more than ${maxQueueSize} tracks. Current queue: ${currentQueueSize}, trying to add: ${tracksToAdd}`)],
                components: [],
            });
        }

        // Shuffle if requested
        if (shuffle && choice === null && research.tracks.length > 1) {
            try {
                research.tracks.shuffle();
            } catch (shuffleError) {
                logger.warning(`Error shuffling tracks: ${shuffleError.message}`);
            }
        }

        let finalTrack, finalSearchResult;
        
        try {
            if (playnext && queue) {
                const tracksToInsert = choice !== null ? [research.tracks[choice]] : research.tracks.reverse();
                for (const track of tracksToInsert) {
                    try {
                        queue.insertTrack(track, 0);
                    } catch (insertError) {
                        logger.error(`Error inserting track: ${insertError.message}`);
                        throw new Error("Failed to insert track into queue");
                    }
                }
                
                finalTrack = research.tracks[choice ?? 0];
                finalSearchResult = research;
            } else {
                const trackToPlay = choice !== null ? research.tracks[choice] : research;
                
                const playResult = await player.play(
                    interaction.member.voice.channel.id,
                    trackToPlay,
                    {
                        nodeOptions: {
                            metadata: {
                                channel: interaction.channel,
                                client: interaction.guild.members.me,
                                requestedBy: interaction.user,
                                guild: interaction.guild,
                                probableBridgeSource: getProbableBridgeSource(playerConfig, queryType.canStream),
                            },
                            verifyFallbackStream: false,
                            ...playerConfig.globalPlayerNodeOptions,
                        },
                    },
                );
                
                if (!playResult || !playResult.track) {
                    throw new Error("Play result did not return a valid track");
                }
                
                finalTrack = playResult.track;
                finalSearchResult = playResult.searchResult || research;
            }
        } catch (playError) {
            logger.error(`Error playing track: ${playError.message}`, playError);
            return await interaction.editReply({ 
                embeds: [embedGenerator.error(`Failed to play track: ${playError.message || "Unknown error"}`)],
                components: [],
            });
        }

        if (!finalTrack) {
            return await interaction.editReply({ 
                embeds: [embedGenerator.error("No track was selected or played.")],
                components: [],
            });
        }

        logger.music(`Playing [${finalTrack.title}] in [${interaction.member.voice.channel.name}]`);

        const updatedQueue = useQueue(interaction.guild.id);
        const embed = embedGenerator.info({
            title: `${finalSearchResult?.hasPlaylist() ? "Playlist" : "Track"} ${!updatedQueue?.currentTrack ? "now playing!" : "enqueued!"}`,
            thumbnail: { url: finalTrack.thumbnail || null },
            description: isURL(finalTrack.url) ? `[${finalTrack.title}](${finalTrack.url})` : (finalTrack.title || "Unknown track"),
            fields: [
                { name: "Pre-shuffled", value: shuffle ? "Yes" : "No", inline: true },
                { name: "Force play next", value: playnext && queue ? "Yes" : "No", inline: true },
                { name: "Extractor", value: `\`${finalTrack.extractor?.identifier || "N/A"}\``, inline: false },
                { name: "Probable bridge source ( [\\▶] = upon fail, falls back to...)", value: getProbableBridgeSource(playerConfig, queryType.canStream) || "N/A", inline: false },
            ],
            footer: { text: `Loop mode: ${getLoopMode(updatedQueue)}` },
        }).withAuthor(interaction.user);

        if (finalSearchResult?.playlist) {
            embed.data.fields.push({ 
                name: "Playlist", 
                value: `[${finalSearchResult.playlist.title}](${finalSearchResult.playlist.url})` 
            });
        }

        await interaction.editReply({ 
            embeds: [embed],
            components: [],
        });

        if (!playerConfig.extractors.Youtubei.enabled && (string.includes("youtube.com") || string.includes("youtu.be")) && playerConfig.extractors.Youtubei.config.attemptYoutubeSearchEvenIfDisabled.usingEmbed) {
            try {
                await interaction.followUp({ 
                    embeds: [embedGenerator.warning("Youtube links might not be accurate as YouTube extraction is disabled")],
                    flags: MessageFlags.Ephemeral,
                });
            } catch (followUpError) {
                logger.warning(`Error sending YouTube warning: ${followUpError.message}`);
            }
        }
    } catch (error) {
        logger.error(`Error in playTrack function: ${error.message}`, error);
        try {
            await interaction.editReply({ 
                embeds: [embedGenerator.error("An unexpected error occurred while playing the track. Please try again.")],
                components: [],
            });
        } catch (replyError) {
            logger.error(`Error sending error reply in playTrack: ${replyError.message}`);
        }
    }
}

/**
 * Attempts to find an extractor and type for a given query
 * 
 * @param {string} query 
 * @param {Player} player 
 * @returns {Promise<{ extractor: Extractor | null, type: string }>}
 */
async function awareQueryResolver(query, player, playerConfig) {
    const extractors = player.extractors.store;
    const result = { extractor: null, type: null, canStream: false };
    const extractorConfig = Object.entries(playerConfig?.extractors) || {};

    if (!query || !extractors || !extractors.size) return result;

    const maybeTrack = ["track", "song", "music", "audio", "video", "watch"];
    const maybePlaylist = ["playlist", "album", "mix", "compilation", "set", "queue", "list"];
    const maybeSearch = ["search", "find", "look", "query", "get", "play"];

    if (maybeTrack.some(word => query.includes(word))) result.type = "track";
    else if (maybePlaylist.some(word => query.includes(word))) result.type = "playlist";
    else if (maybeSearch.some(word => query.includes(word))) result.type = "search";

    const sortedExtractors = Array.from(extractors.values()).sort((a, b) => b.priority - a.priority);

    for (const extractor of sortedExtractors) {
        try {
            if (await extractor.validate(query, QueryResolver.resolve(query).type)) {
                result.extractor = extractor;
                const configEntry = extractorConfig.find(
                    ext => extractor.identifier.toLowerCase().includes(ext[0].toLowerCase()),
                );
                result.canStream = configEntry ? !!configEntry[1].canStream : false;
                break;
            }
        } catch {
            result.extractor = null;
            break;
        }
    }

    return result;
}

/**
 * Unshortens a URL using a HEAD request
 * 
 * @param {string} url - The URL to unshorten
 * @returns {Promise<string>} The unshortened URL or the original URL if an error occurs
 */
async function unshortenURL(url) {
    try {
        const response = await fetch(url, {
            method: "GET",
            redirect: "follow",
            signal: AbortSignal.timeout(7000),
        });

        const { origin, pathname } = new URL(response.url);
        return origin + pathname;
    } catch (error) {
        console.error("Failed to unshorten:", error.message);
        return url;
    }
}

