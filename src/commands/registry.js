import { Collection, CommandInteraction } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';

import { Routes } from 'discord-api-types/v9';
import { client, rest } from '../index.js';

import path from 'path';
import url from 'url';
import fs from 'fs';
import { hash } from '../utils/index.js';
import { config, writeConfig } from '../utils/config.js';


export const slashCommands = new Collection();

export default class CommandBase extends SlashCommandBuilder {
  ids = new Collection();
  permissions = [];

  /**
   * Handles the execution event
   * @param {CommandInteraction} interaction 
   */
  run = async (interaction) => interaction.reply({ content: 'Not implemented yet.', ephemeral: true });

  constructor(name, defaultPerm = true) {
    super();
    this.setName(name);

    // this is manually injected because discord.js is shit
    this.defaultPerm = defaultPerm;
  }

  addPermission(permission) {
    this.permissions.push(permission);
  }

  /**
   * @param {(interaction: CommandInteraction) => void} executor 
   * @returns {CommandBase}
   */
  setExecutor(executor) {
    this.run = executor;
    return this;
  }

  toJSON() {
    // inject the permissions into the JSON
    let original = super.toJSON();
    original.default_permission = this.defaultPerm;
    return original;
  }
}

export async function registerAll() {
  // all required paths
  const __filepath = url.fileURLToPath(import.meta.url);
  const __filename = path.basename(__filepath);
  const __dirname  = path.dirname(__filepath);

  // reset the slash commands
  slashCommands.clear();

  // read this directory and find all command files
  let files = fs.readdirSync(__dirname)
  
  for (let file of files) {
    // make sure we don't attempt to register this file
    if (file === __filename) {
      return;
    }

    let base = await import(`./${path.relative('.', file)}`);

    // go through each value
    for (let [ key, value ] of Object.entries(base)) {
      if (!(value instanceof CommandBase)) {
        return; // make sure the export is a CommandBase
      }

      slashCommands.set(base.name, value);
    }
  }
}

export async function register(guildId) {
  // update all the registered json
  let commandData = Array.from(slashCommands.values()).map(executor => executor.toJSON());

  let newHash = hash(JSON.stringify(commandData));
  let lastHash;

  // get the last
  let configGuild = config().commands[guildId];
  if (configGuild) {
    lastHash = configGuild.__hash;
  }

  if (lastHash && newHash === lastHash) {
    return false; // do not register if it's already been registered
  }

  // register all slash commands
  let response = await rest.put(
    Routes.applicationGuildCommands(client.application.id, guildId),
    { body: commandData }
  );

  configGuild = {};

  // update the hash
  configGuild.__hash = newHash;

  // register the id for each guild
  registerIds(configGuild, response);

  // update the guild in the config
  config().commands[guildId] = configGuild;
  writeConfig();

  return true;
}

function registerIds(guild, commands) {
  for (let command of commands) {
    guild[command.id] = command.name;
  }
}

export async function handle(interaction) {
  if (!interaction.isCommand()) {
    return;
  }

  for (let executor of Object.values(registry)) {
    // check for a matching name
    if (executor.ids.get(interaction.guild.id) !== interaction.commandId) {
      continue;
    }

    // otherwise run the executor
    await executor.run(interaction);
    break;
  }
}

// export both these references
export { CommandInteraction, SlashCommandBuilder };
