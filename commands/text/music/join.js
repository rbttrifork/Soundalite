const { PermissionsBitField } = require("discord.js");
const embedGenerator = require("@utils/helpers/embedGenerator");
const { useQueue, useMainPlayer } = require("discord-player");
const { joinVoiceChannel } = require("discord-voip");

module.exports = {
    name: "join",
    description: "Makes the bot join your voice channel",
    aliases: ["connect", "j"],
    category: "music",
    permissions: [PermissionsBitField.Flags.Connect, PermissionsBitField.Flags.Speak],
    inVoiceChannel: true,
    async execute(logger, client, message, args, flags) {
        const voiceChannel = message.member.voice.channel;
        const botMember = message.guild.members.me;
        const queue = useQueue(message.guild.id);

        // Check if bot is already in the same channel
        if (botMember?.voice?.channelId === voiceChannel.id) {
            return await message.reply({ 
                embeds: [embedGenerator.info({
                    title: "Already connected!",
                    description: `I'm already in **${voiceChannel.name}**`,
                }).withAuthor(message.author)]
            });
        }

        try {
            // If there's an active queue, move it to the new channel
            if (queue && queue.connection) {
                await queue.node.setChannel(voiceChannel.id);
                logger.debug(`Bot moved to ${voiceChannel.name} via join command`);
                
                return await message.reply({ 
                    embeds: [embedGenerator.success({
                        title: "Moved!",
                        description: `I've moved to **${voiceChannel.name}**`,
                    }).withAuthor(message.author)]
                });
            }

            // If no queue exists, create a connection using discord.js voice
            const connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: message.guild.id,
                adapterCreator: message.guild.voiceAdapterCreator,
            });

            // Wait a moment to ensure connection is established
            await new Promise(resolve => setTimeout(resolve, 500));

            logger.debug(`Bot joined ${voiceChannel.name} via join command`);

            return await message.reply({ 
                embeds: [embedGenerator.success({
                    title: "Joined!",
                    description: `I've joined **${voiceChannel.name}**`,
                    footer: { text: "You can now use play commands" },
                }).withAuthor(message.author)]
            });

        } catch (error) {
            logger.error(`Failed to join voice channel: ${error.message}`, error);
            return await message.reply({ 
                embeds: [embedGenerator.error({
                    title: "Failed to join",
                    description: `I couldn't join **${voiceChannel.name}**: ${error.message}`,
                })]
            });
        }
    },
};

