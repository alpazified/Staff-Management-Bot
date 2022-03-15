const { Client, CommandInteraction, MessageEmbed, MessageActionRow, MessageButton, WebhookClient, Message } = require('discord.js');
const schema = require('../../database/models/strikeSchema')
const { webhookURL } = require('../../config.json');
const webhookClient = new WebhookClient({ url: webhookURL });
const uniqid = require('uniqid'); 
const datenow = Date.now();
const timestp = Math.floor(datenow / 1000)

    module.exports = {
        name: 'strike',
        description: 'Staff striking management',
        type: 'CHAT_INPUT',
        ownerOnly: false,
        botPerms: [''],
        userPerms: [''],
        options: [
            {
                name: "add",
                description: "Add a strike to a user",
                type: "SUB_COMMAND",
                options: [ 
                    {
                        name: "user",
                        description: "Who do you want to strike?",
                        type: "USER",
                        required: true
                    },
                    {
                        name: "reason",
                        description: "What's the reason?",
                        type: "STRING",
                        required: true
                    }
                ]
            },
            {
                name: "list",
                description: "Lists a staff members strikes",
                type: "SUB_COMMAND",
                options: [
                    {
                        name: "user",
                        description: "Choose a user",
                        type: "USER",
                        required: false
                    },
                ],
            },
            {
                name: "remove",
                description: "Remove a strike from a user",
                type: "SUB_COMMAND",
                options: [
                    {
                        name: "strikeid",
                        description: "What's the strike ID?",
                        type: "STRING",
                        required: true
                    }
                ],
            }
        ],
    /**
    *
    * @param {Client} client
    * @param {CommandInteraction} interaction
    * @param {String[]} args
    */

        run: async (client, interaction, args) => {
            const sub = interaction.options.getSubcommand()
            if (sub == 'add') {
                let member = interaction.guild.members.cache.get(interaction.user.id);  
                if (!member.roles.cache.some(r=>["Executive Director", "Assistant Director", "Department Leaders", "Management Department"].includes(r.name))) {
                    let ownerOnly = new MessageEmbed()
                            .setDescription("This command is only available for Management!" )
                    return interaction.editReply({embeds : [ownerOnly], ephemeral: true})  
                }
                const user = interaction.options.getMember('user');
                const reason = interaction.options.getString('reason');
                if(reason.length > 256) return interaction.editReply({ embeds: [new MessageEmbed().setColor('RED').setDescription(`Your reason needs to be under 256 characters`)]})

                const strikeID = uniqid()
                if(user.user.bot) {
                    return interaction.editReply({ embeds: [new MessageEmbed().setColor(`RED`).setDescription(`You cannot strike bots.`)]})
                }

                if (user.roles.highest.position >= interaction.member.roles.highest.position) 
                return interaction.editReply({embeds: [new MessageEmbed().setColor('RED').setDescription('You can\'t take action on this user as their role is equal to or higher than yours')], ephemeral: true})
                try {
                schema.findOne({ userId: user.user.id, warnId: strikeID }, async(err, data) => {
                        if(err) return interaction.editReply({ embeds: [new MessageEmbed().setColor('RED').setDescription(`Something went wrong!`)], ephemeral: true })
                        if (data) {
                            return interaction.editReply({ embeds: [new MessageEmbed().setColor('RED').setDescription(`Someone made a warning at the exact same time for the exact same person, try again in a few seconds.`)], ephemeral: true })
                        }

                        else if(!data) {
                            new schema({
                                modId: interaction.user.id,
                                userId: user.user.id,
                                reason : reason,
                                timestamp: timestp,
                                warnId: strikeID,
                        }).save();
                        try {
                            user.send({ embeds: [
                                new MessageEmbed()
                                .setDescription(`> You've recieved a staff strike in Matrix Development for: **${reason}**`)
                                .setFooter({ text: `Contact ${interaction.user.tag} for more information`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
                            ]})
                        } catch (err) {
                            console.log(err)
                            interaction.editReply({ embeds: [new MessageEmbed().setColor('AQUA').setDescription('This user might have their DMs disabled.')]})
                        }

                    const logEmbed = new MessageEmbed()
                        .setAuthor({ name: interaction.user.tag + ` striked ` + user.user.username + `#` + user.user.discriminator, iconURL: interaction.user.displayAvatarURL({ dynamic: true })})
                        .setDescription(`User: <@${user.user.id}>\nReason: ${reason}\nStrike ID: ${strikeID} \nStriked at: <t:${timestp}:F>`)
                        .setColor('BLUE')

                    const successEmbed = new MessageEmbed()
                        .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
                        .setDescription(`Successfully striked ${user.user.username}#${user.user.discriminator}!`)
                        .setColor('AQUA')
                        interaction.editReply({ embeds: [successEmbed], components: [], ephemeral: true });
                        webhookClient.send({
                            username: 'Staff Logging',
                            avatarURL: client.user.displayAvatarURL({ dynamic: true }),
                            embeds: [logEmbed],
                        });
                        }
                    })
                } catch (err) {
                    console.log(err)
                    interaction.editReply({ embeds: [new MessageEmbed().setColor('RED').setDescription(`Something went wrong!`)], ephemeral: true })
                }
    
            }
            if (sub == 'list') {
                let member = interaction.guild.members.cache.get(interaction.user.id);
                let user = interaction.options.getMember('user') || interaction.guild.members.cache.get(interaction.user.id);
                if (!member.roles.cache.some(r=>["Executive Director", "Assistant Director", "Department Leaders", "Management Department"].includes(r.name))) {
                    user = interaction.guild.members.cache.get(interaction.user.id);
                }
                try {
                    schema.findOne({ userId: user.user.id }, async(err, data) => {
                        if(!data) {
                            return interaction.editReply({ embeds: [new MessageEmbed().setColor('RED').setDescription(`This user has no strikes!`)], ephemeral: true})
                        }
                        const info = await schema.find({ 
                            userId: user.user.id
                        });

                        if(!info?.length) return interaction.editReply({ embeds: [new MessageEmbed().setColor('AQUA').setDescription(`This user has no strikes!`)]})
                        const embedDescription = info.map((strike) => {
                            const moderator = interaction.guild.members.cache.get(strike.modId);
                            return [
                                `**Strike ID:** ${strike.warnId}`,
                                `**Moderator:** ${moderator || `Has left the staff server`}`,
                                `**Date:** <t:${strike.timestamp}:F>`,
                                `**Reason:** ${strike.reason}`
                            ].join("\n")
                        })
                        .join("\n\n")
                        const respEMB = new MessageEmbed()
                        .setAuthor({ name: user.user.username + `#` + user.user.discriminator + `'s strikes`, iconURL: user.user.displayAvatarURL({ dynamic: true })})
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

            if (sub == 'remove') {
                let member = interaction.guild.members.cache.get(interaction.user.id);
                let strikeID = interaction.options.getString('strikeid')
                if (!member.roles.cache.some(r=>["Executive Director", "Assistant Director", "Department Leaders", "Management Department"].includes(r.name))) {
                    let ownerOnly = new MessageEmbed()
                            .setDescription("This command is only available for Management!" )
                    return interaction.editReply({embeds : [ownerOnly], ephemeral: true})  
                }
                schema.findOneAndDelete({ warnId: strikeID }, async(err, data) => {
                    if(err) return interaction.editReply({ embeds: [new MessageEmbed().setColor('RED').setDescription(`Something went wrong!`)], ephemeral: true })
                    if(!data) {
                        return interaction.editReply({ embeds: [new MessageEmbed().setColor('RED').setDescription(`This ID does not exist`)], ephemeral: true})
                    }
                    const respEMB = new MessageEmbed()
                    .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL({ dynamic: true })})
                    .setColor('AQUA')
                        .setDescription(`Successfully deleted StrikeID: **${strikeID}** from the database!`)
                    
                    interaction.editReply({ embeds: [respEMB], ephemeral: true})

                })
                

            }
        },
    };