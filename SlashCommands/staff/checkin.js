const { Client, CommandInteraction, MessageEmbed, MessageActionRow, MessageButton, Message, WebhookClient, Collection } = require('discord.js');
const schema = require('../../database/models/checkinSchema');
const uniqid = require('uniqid');
const datenow = Date.now();
const timestp = Math.floor(datenow / 1000)
require('dotenv').config();
const webhookClient = new WebhookClient({ url: process.env.WEBHOOK_URL });
const schema2 = require('../../database/models/staffSchema')

    module.exports = {
        name: 'checkin',
        description: 'Checkin management system',
        type: 'CHAT_INPUT',
        ownerOnly: false,
        botPerms: [''],
        userPerms: [''],
        timeout: 600000,
        options: [
            {
                name: "initialize",
                description: "Check in to the system",
                type: "SUB_COMMAND",
                options: [
                    {
                        name: "reason",
                        description: "Reason for checking in",
                        type: "STRING",
                        required: true
                    }
                ],
            },
            {
                name: "list",
                description: "List a user's checkins",
                type: "SUB_COMMAND",
                options: [
                    {
                        name: "user",
                        description: "Who's checkins do you want to view?",
                        type: "USER",
                        required: true
                    }
                ]
            }
        ],
    /**
    *
    * @param {Client} client
    * @param {CommandInteraction} interaction
    * @param {String[]} args
    */

        run: async (client, interaction, args) => {
        const sub = interaction.options.getSubcommand();
        if (sub == 'initialize') {
            let reason = interaction.options.getString('reason');
            const id = uniqid()
            try {
                schema.findOne({ userId: interaction.user.id, cID: id }, async(err, data) => {
                    const logEmbed = new MessageEmbed()
                        .setAuthor({ name: interaction.user.tag + ` has checked in`, iconURL: interaction.user.displayAvatarURL({ dynamic: true })})
                        .setDescription(`User: <@${interaction.user.id}>\nReason: ${reason}\nID: ${id}\nTime: <t:${timestp}:F>`)
                    if(err) return interaction.editReply({ embeds: [new MessageEmbed().setColor('RED').setDescription(`Something went wrong!`)], ephemeral: true })
                    if(data) return interaction.editReply({ embeds: [new MessageEmbed().setColor('RED').setDescription(`Try again in a few seconds`)]})
                    console.log(reason.length)
                    if(reason.length > 150) return interaction.editReply({ embeds: [new MessageEmbed().setColor('RED').setDescription(`Your reason needs to be under 150 characters`)]})
                    if(!data) {
                        new schema({
                            Reason: reason,
                            cID: id,
                            userId: interaction.user.id,
                            checkedinAt: timestp
                        }).save()
                        webhookClient.send({
                            username: "Staff Logging",
                            avatarURL: client.user.displayAvatarURL({ dynamic: false }),
                            embeds: [logEmbed]
                        })
                        return interaction.editReply({ embeds: [new MessageEmbed().setColor('AQUA').setDescription(`Successfully checked in!`)]})
                    }
                })
            } catch (err) {
                console.log(err)
                return interaction.editReply({ embeds: [new MessageEmbed().setColor('RED').setDescription(`Something went wrong!`)], ephemeral: true })
            }
        }
        if(sub == 'list') {
            let member = interaction.guild.members.cache.get(interaction.user.id);
            let user = interaction.options.getMember('user') || interaction.guild.members.cache.get(interaction.user.id);
            if (!member.roles.cache.some(r=>["Executive Director", "Assistant Director", "Department Leaders", "Management Department"].includes(r.name))) {
                user = interaction.guild.members.cache.get(interaction.user.id);
            }
            try {
                schema.findOne({ userId: user.user.id }, async(err, data) => {
                    if(!data) {
                        return interaction.editReply({ embeds: [new MessageEmbed().setColor('RED').setDescription(`This user hasn't checked in!`)], ephemeral: true})
                    }
                    const info = await schema.find({ 
                        userId: user.user.id
                    });

                    if(!info?.length) return interaction.editReply({ embeds: [new MessageEmbed().setColor('AQUA').setDescription(`This user hasn't checked in yet!`)]})
                    const embedDescription = info.map((checkin) => {
                        const user = interaction.guild.members.cache.get(checkin.userId);
                        return [
                            `**Checkin ID:** ${checkin.cID}`,
                            `**User:** ${user || `Left the server`}`,
                            `**Date:** <t:${checkin.checkedinAt}:F>`,
                            `**Reason:** ${checkin.Reason}`
                        ].join("\n")
                    })
                    .join("\n\n")
                    const respEMB = new MessageEmbed()
                    .setAuthor({ name: user.user.username + `#` + user.user.discriminator + `'s check ins`, iconURL: user.user.displayAvatarURL({ dynamic: true })})
                    .setDescription(`${embedDescription}`)
                    .setColor('AQUA')
                    .setTimestamp();

                    interaction.editReply({ embeds: [respEMB], ephemeral: true})
                })
            } catch (err) {
                console.log(err)
                return interaction.editReply({ embeds: [new MessageEmbed().setDescription(`Something went wrong!`).setColor(`RED`)], ephemeral: true})
        } 
    }

}};