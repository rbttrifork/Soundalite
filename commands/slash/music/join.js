const { ApplicationCommandType, PermissionsBitField } = require("discord.js");
const embedGenerator = require("@utils/helpers/embedGenerator");
const { useQueue } = require("discord-player");
const { joinVoiceChannel } = require("discord-voip");

module.exports = {
    name: "join",
    description: "Makes the bot join your voice channel",
    type: ApplicationCommandType.ChatInput,
    category: "music",
    permissions: [PermissionsBitField.Flags.Connect, PermissionsBitField.Flags.Speak],
    inVoiceChannel: true,
    async execute(logger, interaction, client) {
        try {
            if (!interaction.member.voice.channel) {
                return await interaction.editReply({ 
                    embeds: [embedGenerator.error("You must be in a voice channel to use this command.")]
                });
            }

            const voiceChannel = interaction.member.voice.channel;
            const botMember = interaction.guild.members.me;
            const queue = useQueue(interaction.guild.id);

            // Check if bot is already in the same channel
            if (botMember?.voice?.channelId === voiceChannel.id) {
                return await interaction.editReply({ 
                    embeds: [embedGenerator.info({
                        title: "Already connected!",
                        description: `I'm already in **${voiceChannel.name}**`,
                    }).withAuthor(interaction.user)]
                });
            }

            // If there's an active queue, move it to the new channel
            if (queue && queue.connection) {
                await queue.node.setChannel(voiceChannel.id);
                logger.debug(`Bot moved to ${voiceChannel.name} via /join command`);
                
                return await interaction.editReply({ 
                    embeds: [embedGenerator.success({
                        title: "Moved!",
                        description: `I've moved to **${voiceChannel.name}**`,
                    }).withAuthor(interaction.user)]
                });
            }

            // If no queue exists, create a connection using discord-voip
            const connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: interaction.guild.id,
                adapterCreator: interaction.guild.voiceAdapterCreator,
            });

            // Wait a moment to ensure connection is established
            await new Promise(resolve => setTimeout(resolve, 500));

            logger.debug(`Bot joined ${voiceChannel.name} via /join command`);

            return await interaction.editReply({ 
                embeds: [embedGenerator.success({
                    title: "Joined!",
                    description: `I've joined **${voiceChannel.name}**`,
                    footer: { text: "You can now use play commands" },
                }).withAuthor(interaction.user)]
            });

        } catch (error) {
            logger.error(`Failed to join voice channel: ${error.message}`, error);
            return await interaction.editReply({ 
                embeds: [embedGenerator.error({
                    title: "Failed to join",
                    description: `I couldn't join **${interaction.member.voice.channel?.name || "the voice channel"}**: ${error.message}`,
                })]
            });
        }
    },
};

