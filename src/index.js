import Discord from 'discord.js';
import * as Config from './utils/config.js';
import * as Registry from './commands/registry.js';
import * as Player from './music/player.js';

import { REST } from '@discordjs/rest';


export const client = new Discord.Client({ intents: [ 'GUILDS', 'GUILD_MESSAGES', 'DIRECT_MESSAGES', 'GUILD_VOICE_STATES' ] });
export const rest   = new REST({ version: 9 });

client.once('ready', async () => {
  console.log(`${client.user.username} is running`);

  client.user.setPresence({
    activities: [ { type: 'LISTENING', name: 'Spotify' } ]
  });

  // set the rest api token
  rest.setToken(Config.config().token);

  // registers all slash commands
  await Registry.registerAll();

  console.log('Registering all slash commands');

  // register all slash commands for each guild
  let guilds = await client.guilds.fetch();
  for (let guild of await guilds.values()) {
    let result = await Registry.register(guild.id);

    if (!result) console.log(`Skipping guild (${guild.id}), already up-to-date`);
  }

  console.log('Registering the player events');
  Player.registerEvents();
});

let lastMessage = 0;

client.on('messageCreate', async msg => {
  if (msg.author.bot) {
    return; // ignore bot messages
  }

  // check for messages that are equal to bbtom
  if (msg.content.toLowerCase() === 'bbtom') {
    msg.reply('woah there');
    return;
  }

  // run with a 10% chance and only every 60 seconds
  if (Date.now() - lastMessage < 60) {
    return;
  }

  if (Math.random() > .1) {
    return;
  }

  let hi = /(^h[ie][yl]*?o*) *tom+$/i;
  let search = hi.exec(msg.content);

  // respond to people saying hi
  if (search) {
    let hey = search[1];
    let greeting = `${hey} ${msg.author.username.toLowerCase()}`;

    // count the y's and if it's larger than 4 add a wink
    if ((hey.match(/y/gi) || []).length >= 4) {
      greeting += ' ;)';
    }

    msg.reply(greeting);
    lastMessage = Date.now();
    return;
  }

  // check the regex101 link for examples: https://regex101.com/r/hImFl6/
  if (/(i? +do *n[o']t like|i hate|die|fuck) +(you ?)?tom/gi.test(msg.content)) {
    lastMessage = Date.now();
    msg.reply(':(');
  }
});

client.on('guildCreate', async guild => {
  let registered = await Registry.register(guild.id);
  if (registered) console.log(`Registered commands for ${guild.id}`);
});

// send all interactions to Registry.handle
client.on('interactionCreate', Registry.handle);

client.login(Config.config().token).catch(() => {
  console.log('Failed to login, check the config and update the token');
});
