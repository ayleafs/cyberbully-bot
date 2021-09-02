import CommandBase from './registry.js';

import * as Player from '../music/player.js';
import ytSearch from 'yt-search';
import { GuildMember, MessageActionRow, MessageSelectMenu } from 'discord.js';
import { config } from '../utils/config.js';
import { replyEmbed } from '../utils/index.js';
import { Track } from '../music/queue.js';


export const play = new CommandBase('play')
  .setDescription('Play a song in the voice channel')
  .addStringOption(option =>
    option.setName('query')
      .setDescription('The search query or URL to play')
      .setRequired(true))
  .addBooleanOption(option =>
    option.setName('results')
      .setDescription('Whether or not a list of five search results should show up')
      .setRequired(false))

  .setExecutor(async interaction => {
    let { member, options } = interaction;

    let query  = options.getString('query', true);
    // whether or not we should search for results
    let search = options.getBoolean('results', false);

    const ephemeral = config().player.results_ephemeral;

    if (search === null) {
      search = true; // default to true
    }

    if (member instanceof GuildMember && !member.voice.channel) {
      interaction.reply(replyEmbed('You need to be in a voice channel to listen to music'));
      return;
    }

    let youtubeRegex = /^https?:\/\/(www\.)?youtu\.?be(\.com)?\/(watch\?v=)?([\w-]+)/i;

    // check if the URL is YouTube
    let regexResult = youtubeRegex.exec(query);
    let foundVideo  = false;
    let results;

    // this will work for youtube links
    if (regexResult) {
      try {
        let result = await ytSearch({ videoId: regexResult[4] });
        results = { videos: [ { ...result, url: query } ] };

        foundVideo = true;
      } catch (err) {
        foundVideo = false;
      }
    }

    if (!foundVideo) {
      // make a search query
      results = await ytSearch({ query, category: 'music' });
    }

    await interaction.deferReply({ ephemeral: ephemeral && search && !foundVideo });

    // do the searching
    if (search && !foundVideo) {
      let videos  = results.videos.slice(0, 5);
      videos = videos.map(({ title, url }) => ({ label: title, value: url }));

      let components = [
        new MessageActionRow()
          .addComponents(
            new MessageSelectMenu({ placeholder: 'Choose a song from search results', customId: 'song_select' })
              .addOptions(...videos))
      ];

      // send back the search results
      interaction.followUp({ content: `🔍 ${query}`, components });
      return;
    }

    let player = Player.getPlayer(member.guild);
    let selection = results.videos[0];
    let track = new Track(selection.title, selection.url);

    player.connect(member.voice.channel);
    player.addToQueue(track);

    interaction.followUp({ embeds: [ Player.Messages.addedToQueue(track) ] });
  });
