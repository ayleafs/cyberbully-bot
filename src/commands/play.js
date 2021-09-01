import CommandBase from './registry.js';

import * as Player from '../music/player.js';
import ytSearch from 'yt-search';


export const play = new CommandBase('play')
  .setDescription('Play a song in the voice channel.')
  .addStringOption(option =>
    option.setName('query')
      .setDescription('The search query or URL to play.')
      .setRequired(true))
  .addBooleanOption(option =>
    option.setName('results')
      .setDescription('Whether or not a list of five search results should show up.')
      .setRequired(false))

  .setExecutor(async interaction => {
    let { member, options } = interaction;

    let query  = options.getString('query', true);
    // whether or not we should search for results
    let search = options.getBoolean('results', false);

    if (search === null) {
      search = true; // default to true
    }

    let response = await interaction.deferReply({ fetchReply: true });

    // do the searching
    if (search) {
      let results = await ytSearch({ query, category: 'music' });
      results.videos.slice(0, 5).forEach(console.log);
    }
  });
