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

client.on('messageCreate', async msg => {
  if (msg.author.bot) {
    return; // ignore bot messages
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
