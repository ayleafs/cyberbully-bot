import * as Utils from './index.js';
import fs from 'fs';


let configInstance = {
  token: 'PUT TOKEN HERE',

  commands: {
    guild_id: {
      hash: '',
      command_name: 'command_id',
      command_name: 'command_id',
      command_name: 'command_id',
      command_name: 'command_id',
    }
  }
};

const configPath = Utils.pathTo('config.json');

// the last time the config was read from
let lastRead = 0;
let refreshRate = 1_000 * 60 * 15;

export function readConfig() {
  // make sure the config exists
  if (!fs.existsSync(configPath)) {
    writeConfig();
    return configInstance;
  }

  const data = fs.readFileSync(configPath, { encoding: 'utf-8' });
  
  try {
    // parse the string data to JSON
    let newConfig = JSON.parse(data);

    // merge the config instances
    let config = { ...configInstance };
    Object.assign(config, newConfig);

    return config;
  } catch (e) {
    console.error(e);
    console.log('Overwriting old config due to inability to read current one.');
    // uh oH that'S tOo Bad
    writeConfig();
  }

  return configInstance;
}

export function writeConfig() {
  const stringData = JSON.stringify(configInstance, null, 2);

  // safe write function, creates the files path for us
  Utils.swriteFileSync(configPath, stringData);
}

export function config() {
  // check to see if we should update the config data
  if (Date.now() - lastRead >= refreshRate) {
    configInstance = readConfig();
    lastRead = Date.now();
  }

  return configInstance;
}