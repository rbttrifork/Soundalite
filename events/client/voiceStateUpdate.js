const { Events, AuditLogEvent, ChannelType } = require("discord.js");
const { useQueue } = require("discord-player");

module.exports = {
    name: Events.VoiceStateUpdate,
    once: false,
    disabled: false,
    async execute(client, logger, oldState, newState) {
        if (this.disabled) return;
        
        // Auto-follow: If user moves to a new channel and bot is playing music, move bot to new channel
        if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
            // User moved to a different channel
            const guild = newState.guild;
            const botMember = guild.members.me;
            
            // Check if bot is in the old channel
            if (botMember?.voice?.channelId === oldState.channelId) {
                // Check if there's an active queue for this guild
                try {
                    const queue = useQueue(guild.id);
                    if (queue && queue.connection) {
                        // Bot is playing music, move to the new channel
                        const newChannel = newState.channel;
                        if (newChannel && newChannel.type === ChannelType.GuildVoice) {
                            try {
                                await queue.node.setChannel(newChannel.id);
                                logger.debug(`Bot moved to ${newChannel.name} following ${newState.member?.user?.tag || "user"}`);
                            } catch (error) {
                                logger.warn(`Failed to move bot to new channel: ${error.message}`);
                            }
                        }
                    }
                } catch (error) {
                    // Queue might not exist, which is fine
                }
            }
        }
        const userVoiceStateEvents = {};

        const setEvent = (key) => (userVoiceStateEvents[key] = true);

        const user = newState.member?.nickname || newState.member?.user.username || "Unknown User";

        // Primary actions
        if (!oldState.channelId && newState.channelId) 
            setEvent("userJoinedChannel");
        else if (oldState.channelId && !newState.channelId) 
            setEvent("userLeftChannel");
        else if (oldState.channelId !== newState.channelId) 
            setEvent("userMovedChannel");
        

        // Secondary actions
        if (oldState.selfMute !== newState.selfMute) setEvent(newState.selfMute ? "userMuted" : "userUnmuted");
        if (oldState.selfDeaf !== newState.selfDeaf) setEvent(newState.selfDeaf ? "userDeafened" : "userUndeafened");
        if (oldState.serverMute !== newState.serverMute) setEvent(newState.serverMute ? "userServerMuted" : "userServerUnmuted");
        if (oldState.serverDeaf !== newState.serverDeaf) setEvent(newState.serverDeaf ? "userServerDeafened" : "userServerUndeafened");
        if (oldState.streaming !== newState.streaming) setEvent(newState.streaming ? "userStreamingON" : "userStreamingOFF");
        if (oldState.selfVideo !== newState.selfVideo) setEvent(newState.selfVideo ? "userCameraON" : "userCameraOFF");
        if (oldState.suppress !== newState.suppress) setEvent(newState.suppress ? "userSuppressed" : "userUnsuppressed");

        // AFK kick detection
        if (userVoiceStateEvents.userMovedChannel && newState.channelId === newState.guild.afkChannelId) 
            setEvent("userAfkKicked");
        

        // Kicked due to VC deletion
        if (oldState.channelId && !newState.channelId && !oldState.channel) 
            setEvent("userKickedDeletedVC");
        

        // Check if user was moved by an admin using audit logs
        if (userVoiceStateEvents.userMovedChannel) {
            try {
                const logs = await newState.guild.fetchAuditLogs({ type: AuditLogEvent.MemberMove, limit: 5 });
                const entry = logs.entries.find(e => 
                    e.extra?.channel?.id === newState.channelId && // Check if moved into this channel
                    Date.now() - e.createdTimestamp < 5000,
                );

                if (entry) {
                    setEvent("userMovedByAdmin");
                    userVoiceStateEvents.adminWhoMoved = entry.executor.username;
                }
            } catch (err) {
                logger.warn(`Failed to fetch audit logs: ${err.message}`);
            }
        }

        // Kicked by an admin
        if (oldState.channelId && !newState.channelId && oldState.channel) {
            try {
                const logs = await newState.guild.fetchAuditLogs({ type: AuditLogEvent.MemberDisconnect, limit: 5 });
                const entry = logs.entries.find(e => 
                    e.extra?.channel?.id === oldState.channelId && // Check if kicked from this channel
                    Date.now() - e.createdTimestamp < 5000,
                );

                if (entry) {
                    setEvent("userKickedByAdmin");
                    userVoiceStateEvents.adminWhoKicked = entry.executor.username;
                }
            } catch (err) {
                logger.warn(`Failed to fetch audit logs: ${err.message}`);
            }
        }

        // // Final logging (log primary action first, then secondary actions)
        // if (Object.keys(userVoiceStateEvents).length > 0) {
        //    logger.debug(`Voice state update for ${user}:`);
        //    for (const [event, value] of Object.entries(userVoiceStateEvents)) {
        //        if (value) {
        //            if (event === "adminWhoMoved" || event === "adminWhoKicked") 
        //                logger.debug(`  - ${event}: ${value}`);
        //            else 
        //                logger.debug(`  - ${event}`);
        //            
        //        }
        //    }
        // }
    },
};
