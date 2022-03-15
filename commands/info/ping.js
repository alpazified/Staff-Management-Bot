const { Message, Client } = require("discord.js");

module.exports = {
    name: "help",
    aliases: ['h'],
    /**
     *
     * @param {Client} client
     * @param {Message} message
     * @param {String[]} args
     */
    run: async (client, message, args) => {
        message.channel.send(`stfu`);
    },
};
