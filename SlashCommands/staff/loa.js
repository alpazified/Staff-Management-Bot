const { Client, CommandInteraction, MessageEmbed, MessageActionRow, MessageButton, WebhookClient } = require('discord.js');
const schema = require('../../database/models/loaSchema')
const datenow = Date.now();
const timestp = Math.floor(datenow / 1000)
const emotes = require('../../emotes.json')
const uniqid = require('uniqid');
const { webhookURL } = require('../../config.json');
const webhookClient = new WebhookClient({ url: webhookURL });
    module.exports = {
        name: 'loa',
        description: 'Request to go on LOA',
        type: 'CHAT_INPUT',
        ownerOnly: false,
        botPerms: [''],
        userPerms: [''],
        timeout: 3.6e+6,
        options: [
            {
                name: "start",
                description: "Go on LOA",
                type: 'SUB_COMMAND',
                options: [
                    {
                        name: "reason",
                        description: "Reason for LOA",
                        type: "STRING",
                        required: true
                    },
                    {
                        name: "duration",
                        description: "Duration of LOA [1d/3d/2w]",
                        type: "STRING",
                        required: true
                    }
                ],
            },
            {
                name: "check",
                description: "Check how many times a user has gone on LOA",
                type: 'SUB_COMMAND',
                options: [
                    {
                        name: "user",
                        description: "Choose a user",
                        type: "USER",
                        required: false
                    }
                ]
            },
                        {
                name: "end",
                description: "End your LOA",
                type: "SUB_COMMAND",
                options: [
                    {
                        name: "loaid",
                        description: "What's the LOA ID?",
                        type: 'STRING',
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
        if (sub == 'start') {
            let member = interaction.guild.members.cache.get(interaction.user.id);  
            let time = interaction.options.getString("duration")
            let reason = interaction.options.getString("reason")
            if(reason.length > 256) return interaction.editReply({ embeds: [new MessageEmbed().setColor('RED').setDescription(`Your reason needs to be under 256 characters`)]})
            const id = uniqid()
            try {
                schema.findOne( { userId: interaction.user.id, LOAId: id }, async(err, data) => { // Initalizises LOA schema
                if(err) return interaction.editReply({ embeds: [new MessageEmbed().setColor('RED').setDescription(`Something went wrong!`)], ephemeral: true })
                if(data) return interaction.editReply({ embeds: [new MessageEmbed().setColor('AQUA').setDescription(`Try again in a few seconds`)], ephemeral: true })
                if(!data) new schema({ // Creates LOA Schema
                    Reason: reason,
                    Duration: time,
                    LOAId: id,
                    userId: interaction.user.id,
                    startedAt: timestp,
                    endedAt: null
                }).save()
                const logEmbed = new MessageEmbed()
                    .setColor('DARK_NAVY')
                    .setAuthor({ name: `${interaction.user.tag} has gone on LOA`, iconURL: interaction.user.displayAvatarURL({ dynamic: true })})
                    .setDescription(`User: <@${interaction.user.id}>\nReason: ${reason}\nDuration: ${time}\nLOA ID: ${id}\nStarted at: <t:${timestp}:F>`)
                interaction.editReply({ embeds: [new MessageEmbed().setColor('AQUA').setDescription(`Your LOA ID is ${id}. Remember to run /loa end [loa id] before trying to check in again!`)]})
                webhookClient.send({ 
                    username: 'LOA Logging',
                    avatarURL: client.user.displayAvatarURL({ dynamic: true }),
                    embeds: [logEmbed]})
            })
            } catch (err) {
                if(err) return interaction.editReply({ embeds: [new MessageEmbed().setColor('RED').setDescription(`Something went wrong!`)], ephemeral: true })
            }
        }
        // Next Subcommand

        if(sub == 'check') {
            let member = interaction.guild.members.cache.get(interaction.user.id);
                let user = interaction.options.getMember('user') || interaction.guild.members.cache.get(interaction.user.id);
                if (!member.roles.cache.some(r=>["Executive Director", "Assistant Director", "Department Leaders", "Management Department"].includes(r.name))) {
                    user = interaction.guild.members.cache.get(interaction.user.id);
                }
                try {
                    schema.findOne({ userId: user.user.id }, async(err, data) => {
                        if(!data) {
                            return interaction.editReply({ embeds: [new MessageEmbed().setColor('RED').setDescription(`This user hasn't gone on LOA!`)], ephemeral: true})
                        }
                        const info = await schema.find({ 
                            userId: user.user.id
                        });

                        if(!info?.length) return interaction.editReply({ embeds: [new MessageEmbed().setColor('AQUA').setDescription(`This user hasm't gone on LOA!`)]})
                        const embedDescription = info.map((loa) => {
                            const user = interaction.guild.members.cache.get(loa.userId);
                            return [
                                `**User:** ${user || ` Left the server`}`,
                                `**LOA ID:** ${loa.LOAId}`,
                                `**Started at:** <t:${loa.startedAt}:F>`,
                                `**Reason:** ${loa.Reason}`,
                                `**Ended at:** <t:${loa.endedAt}:F>`
                            ].join("\n")
                        })
                        .join("\n\n")
                        const respEMB = new MessageEmbed()
                        .setAuthor({ name: user.user.username + `#` + user.user.discriminator + `'s LOA stats`, iconURL: user.user.displayAvatarURL({ dynamic: true })})
                        .setDescription(`${embedDescription}`)
                        .setColor('RED')
                        .setTimestamp();

                        interaction.editReply({ embeds: [respEMB], ephemeral: true})
                    })
                } catch (err) {
                    console.log(err)
                    return interaction.editReply({ embeds: [new MessageEmbed().setDescription(`Something went wrong!`).setColor(`RED`)], ephemeral: true})
                }
            }
            // Next subcommand
            if (sub == 'end') {
                let loaid = interaction.options.getString('loaid');
                let member = interaction.guild.members.cache.get(interaction.user.id);  
                if (!member.roles.cache.some(r=>["Executive Director", "Assistant Director", "Department Leaders", "Management Department"].includes(r.name))) {
                    let ownerOnly = new MessageEmbed()
                            .setDescription("This command is only available for Management!" )
                    return interaction.editReply({embeds : [ownerOnly], ephemeral: true})  
                }

                const successEmbed2 = new MessageEmbed()
                .setColor('AQUA')
                .setDescription(`Successfuly removed your LOA status, feel free to check in now!`)

                const info = await schema.find({ 
                    LOAId: loaid
                });            

            try {
                schema.findOneAndUpdate({ LOAId: loaid}, { endedAt: timestp }, async(err, data) => {
                    if(err) return interaction.editReply({ embeds: [new MessageEmbed().setColor('RED').setDescription(`Something went wrong!`)], ephemeral: true })
                    if(!data) return interaction.editReply({ embeds: [new MessageEmbed().setColor('AQUA').setDescription(`Invalid ID or you didn't initiate this LOA`)], ephemeral: true })    
                })

                return interaction.editReply({ embeds: [successEmbed2] })
            } 
            catch (err) {
                console.log(err)
                return interaction.editReply({ embeds: [new MessageEmbed().setDescription(`Something went wrong!`).setColor(`RED`)], ephemeral: true})
            }
            }
        },
    };