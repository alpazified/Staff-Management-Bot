const { Client, Collection, MessageEmbed } = require("discord.js");
const logger = require('./utils/logger.js');
const mongoose = require('./database/mongoose')
require('dotenv').config()

const client = new Client({
    intents: 32767,
    partials: ['USER', 'CHANNEL', 'GUILD_MEMBER', 'MESSAGE'],
    allowedMentions: {
      parse: ['roles', 'users', 'everyone'],
      repliedUser: true,
    },
  })
module.exports = client;

console.clear()

client.commands = new Collection();
client.slashCommands = new Collection();
client.userSettings = new Collection()
client.config = require("./config.json");
client.package = require("./package.json");

require("./handler")(client);

mongoose.init();
client.login(process.env.TOKEN);

process.on('warning', (warning) => {
  console.warn(warning.name);
  console.warn(warning.message);
  console.warn(warning.stack);  
})
process.on("uncaughtException", (err, origin) => {
  console.log(`Caught exception: ${err}` +`Exception origin: ${origin}`)
});
process.on("unhandledRejection", (reason, promise) => {
    console.log('Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('exit', code => () => {
    console.log('Exiting Lynx')
})
process.on('beforeExit', () => 
  console.log('exiting...')
)