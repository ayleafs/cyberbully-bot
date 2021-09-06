import CommandBase from './registry.js';
import path from 'path';

import * as Player from '../music/player.js';
import ytSearch from 'yt-search';
import { replyEmbed } from '../utils/index.js';
import { Track } from '../music/queue.js';


export const play = new CommandBase('play')
  .setDescription('Play a song in the voice channel')
  .addStringOption(option =>
    option.setName('search')
      .setDescription('The search query or URL to play')
      .setRequired(true))

  .setExecutor(async interaction => {
    let { member, options } = interaction;

    let query = options.getString('search', true);

    if (!Player.Player.canCreate(member)) {
      interaction.reply(replyEmbed('You need to be in a voice channel to listen to music'));
      return;
    }

    let youtubeRegex = /^https?:\/\/(www\.)?youtu\.?be(\.com)?\/(watch\?v=)?([\w-]+)/i;

    // check if the URL is YouTube
    let regexResult = youtubeRegex.exec(query);
    let results;
    let toPlay; // list of videos to play

    interaction.deferReply();

    // this will work for youtube links
    if (regexResult) {
      results = await parseYouTubeUrl(query, regexResult);
      toPlay = [ ...results ];
    }

    // if they've not been set yet
    if (!results || results?.length === 0) {
      results = await ytSearch({ query, category: 'music' });
      toPlay = [ results.videos[0] ];
    }

    let player = Player.getPlayer(member.guild);
    player.connect(member.voice.channel);

    // handle multiple songs to play
    if (toPlay.length > 1) {
      let isPlaying;

      for (let video of toPlay) {
        let track = new Track(video.title, `https://www.youtube.com/watch?v=${video.videoId}`);
        
        if (!player.addToQueue(track)) {
          continue;
        }

        // this is the song that got insta-queued
        isPlaying = track;
      }

      // lmfao
      interaction.followUp({ embeds: [
        Player.Messages.queuedPlaylist({ songCount: toPlay.length}),
        isPlaying ? Player.Messages.nowPlaying(isPlaying) : null
      ] })
      return;
    }

    let selection = toPlay[0];
    let track = new Track(selection.title, selection.url);

    // this isn't the same type but it works
    player.lastChannel = interaction.channel;

    let autoPlayed = player.addToQueue(track);
    if (!autoPlayed) {
      interaction.followUp({ embeds: [ Player.Messages.addedToQueue(track) ] });
      return;
    }

    interaction.followUp({ embeds: [ Player.Messages.nowPlaying(player.currentTrack) ] });
  });

async function parseYouTubeUrl(url, regexResult) {
  let args = parseUrlArgs(url);

  // check for a list key or if the regex matched 'playlist' as the video ID
  if (regexResult[4] === 'playlist' || 'list' in args) {
    return (await ytSearch({ listId: args.list })).videos;
  }

  try {
    return [ await ytSearch({ videoId: regexResult[4] }) ];
  } catch (err) { }

  // empty if we reach here
  return [ ];
}

function parseUrlArgs(url) {
  // get to the right of the ?
  let args = path.basename(url).split('?')[1];
  args = args.split('&');

  // setup all the arguments
  let mappedArgs = {};
  for (let arg of args) {
    let [ key, value ] = arg.split('=', 2);
    mappedArgs[key] = value;
  }

  return mappedArgs;
}
