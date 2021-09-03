import CommandBase from './registry.js';
import ytSearch from 'yt-search';
import { config } from '../utils/config.js';
import { Player } from '../music/player.js';
import { replyEmbed } from '../utils/index.js';
import { MessageActionRow, MessageSelectMenu } from 'discord.js';


export const search = new CommandBase('search')
  .setDescription('Search YouTube for videos to play')
  .addStringOption(option => 
    option.setName('query')
    .setDescription('The search query that gets submitted to YouTube')
    .setRequired(true))
  
  .setExecutor(async interaction => {
    // the search query submitted
    let query = interaction.options.getString('query');
    const ephemeral = config().player.results_ephemeral;

    if (!Player.canCreate(interaction.member)) {
      interaction.reply(replyEmbed('You need to be in a voice channel to search for music'));
      return;
    }

    // this says "cyberbully inc. is thinking"
    interaction.deferReply({ ephemeral });

    let results = await ytSearch({ query, category: 'music' });
    let videos  = results.videos.splice(0, 5);

    // map all the videos to be message menu options
    let options = videos.map(({ title, url }) => ({ label: title, value: url }));

    let components = [
      new MessageActionRow()
        .addComponents(
          new MessageSelectMenu({ placeholder: 'Choose a song from search results', customId: 'song_select' })
            .addOptions(...options))
    ];

    // send back the search results
    interaction.followUp({ content: `🔍 ${query}`, components });
  });
