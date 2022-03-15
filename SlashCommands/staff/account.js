const { Client, CommandInteraction, MessageEmbed, MessageActionRow, MessageButton, WebhookClient, Message } = require('discord.js');
const { webhookURL } = require('../../config.json');
const schema = require('../../database/models/staffSchema')
const webhookClient = new WebhookClient({ url: webhookURL });
const validator = require("email-validator");
const timezoneValidator  = require("timezone-validator")

    module.exports = {
        name: 'account',
        description: 'Account management',
        type: 'CHAT_INPUT',
        ownerOnly: false,
        botPerms: [''],
        userPerms: [''],
        options: [
            {
                name: "create",
                description: "Create an account",
                type: "SUB_COMMAND",
                options: [ 
                    {
                        name: "timezone",
                        description: "What's your timezone? i.e (America/Toronto)",
                        type: "STRING",
                        required: true
                    },
                    {
                        name: "email",
                        description: "What's your email?",
                        type: "STRING",
                        required: true
                    }
                ]
            },
            {
                name: "check",
                description: "Check an account",
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
                description: "Remove a user from the database",
                type: "SUB_COMMAND",
                options: [
                    {
                        name: "user",
                        description: "Choose a user",
                        type: "USER",
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
            if (sub == 'create') {
                const position = interaction.member.roles.highest.id;
                const timezone = interaction.options.getString('timezone');
                const email = interaction.options.getString('email')
                try {
                schema.findOne({ userId: interaction.user.id }, async(err, data) => {
                        if(err) return interaction.editReply({ embeds: [new MessageEmbed().setColor('RED').setDescription(`Something went wrong!`)], ephemeral: true })
                        if (data) {
                            return interaction.editReply({ embeds: [new MessageEmbed().setColor('RED').setDescription(`You already have an account in the database! Ask a Lead Manager or higher to delete it, then try again.`)], ephemeral: true })
                        }

                        else if(!data) {
                            if (validator.validate(email) == false) {
                                return interaction.editReply({ embeds: [new MessageEmbed().setColor('RED').setDescription('Invalid email!')]})
                            }
                                
                            new schema({
                                userId: interaction.user.id,
                                Position: position,
                                Email: email,
                                Timezone: timezone,
                        }).save();
                        if(timezone.length > 100) return interaction.editReply({ embeds: [new MessageEmbed().setColor('RED').setDescription(`Keep your timezone under 100 characters.`)]})
                    
                    const regEmbed = new MessageEmbed()
                        .setAuthor({ name: interaction.user.tag + ` registered in the database`, iconURL: interaction.user.displayAvatarURL({ dynamic: true })})
                        .setDescription(`User ${interaction.user.username}\n**Position**: <@&${interaction.member.roles.highest.id}>`)
        
                    const successEmbed = new MessageEmbed()
                        .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
                        .setDescription('Registered you in the database!')
                        .setColor('AQUA')
                        interaction.editReply({ embeds: [successEmbed], components: [], ephemeral: true });
                        webhookClient.send({
                            username: 'Staff Logging',
                            avatarURL: client.user.displayAvatarURL({ dynamic: true }),
                            embeds: [regEmbed],
                        });
                        }
                    })
                } catch (err) {
                    console.log(err)
                    interaction.editReply({ embeds: [new MessageEmbed().setColor('RED').setDescription(`Something went wrong!`)], ephemeral: true })
                }
    
            }
            if (sub == 'check') {
                let member = interaction.guild.members.cache.get(interaction.user.id);  
                if (!member.roles.cache.some(r=>["Executive Director", "Assistant Director", "Department Leaders", "Management Department"].includes(r.name))) {
                    let ownerOnly = new MessageEmbed()
                            .setDescription("This command is only available for Management!" )
                    return interaction.editReply({embeds : [ownerOnly], ephemeral: true})  
                }  
                const user = interaction.options.getMember('user') || interaction.guild.members.cache.get(interaction.user.id);

                try {
                    schema.findOne({ userId: user.user.id }, async(err, data) => {
                        if(err) return interaction.editReply({ embeds: [new MessageEmbed().setColor('RED').setDescription(`Something went wrong!`)], ephemeral: true })
                        if(!data) {
                            return interaction.editReply({ embeds: [new MessageEmbed().setColor('RED').setDescription(`This user is not in the database`)], ephemeral: true})
                        }
                        const info = await schema.findOne({ 
                            userId: user.user.id
                         });

                        const respEMB = new MessageEmbed()
                        .setAuthor({ name: user.user.username + `#` + user.user.discriminator, iconURL: user.user.displayAvatarURL({ dynamic: true })})
                        .setDescription(`Position: <@&${info.Position}>\nEmail: ${info.Email}\nTimezone: ${info.Timezone}\nLOAs: ${info.LOAReqs}`)

                        interaction.editReply({ embeds: [respEMB], ephemeral: true})
                    })
                } catch (err) {
                    console.log(err)
                    return interaction.editReply({ embeds: [new MessageEmbed().setDescription(`Something went wrong!`).setColor(`RED`)], ephemeral: true})
                }
            }

            if (sub == 'remove') {
                let member = interaction.guild.members.cache.get(interaction.user.id);  
                if (!member.roles.cache.some(r=>["Executive Director", "Assistant Director", "Department Leaders", "Management Department"].includes(r.name))) {
                    let ownerOnly = new MessageEmbed()
                            .setDescription("This command is only available for Management!" )
                    return interaction.editReply({embeds : [ownerOnly], ephemeral: true})  
                }
                const user = interaction.options.getMember('user');
                schema.findOneAndDelete({ userId: user.user.id }, async(err, data) => {
                    if(err) return interaction.editReply({ embeds: [new MessageEmbed().setColor('RED').setDescription(`Something went wrong!`)], ephemeral: true })
                    if(!data) {
                        return interaction.editReply({ embeds: [new MessageEmbed().setColor('RED').setDescription(`This user is not in the database`)], ephemeral: true})
                    }
                    const respEMB = new MessageEmbed()
                    .setAuthor({ name: user.user.username + `#` + user.user.discriminator, iconURL: user.user.displayAvatarURL({ dynamic: true })})
                    .setColor('AQUA')
                        .setDescription(`Successfully removed ${user.user.username}#${user.user.discriminator} from the database!`)
                    
                    interaction.editReply({ embeds: [respEMB], ephemeral: true})

                })
                

            }
        },
    };