import { AudioPlayerStatus, createAudioPlayer, createAudioResource, demuxProbe, joinVoiceChannel } from '@discordjs/voice';
import { Collection, Guild, GuildMember, VoiceChannel } from 'discord.js';

import { raw as ytdl } from 'youtube-dl-exec';
import { client } from '../index.js';
import { basicEmbed } from '../utils/index.js';
import Queue, { Track } from './queue.js';


const players = new Collection();

export function registerEvents() {
  // handle playing URLs
  client.on('interactionCreate', interaction => {
    if (!interaction.isSelectMenu() || interaction.customId !== 'song_select') {
      return;
    }

    let player = getPlayer(interaction.guild);
    player.connect(interaction.member.voice.channel);

    // find the right title and URL
    let url       = interaction.values[0];
    let { label } = interaction.component.options.filter(({ value }) => url === value)[0];
    let track     = new Track(label, url);

    interaction.reply({ embeds: [ Messages.addedToQueue(track) ] });
    player.addToQueue(track);
  });

  // make sure to destory all voice connections that don't need to exist
  client.on('voiceStateUpdate', (oldState, newState) => {
    if (oldState.member.user.bot) {
      return; // ignore bots
    }

    // check if they left the channel
    if (!oldState.channelId && newState.channelId) {
      return; // this is a join event
    }

    if (oldState.channel.members.size > 1) {
      return;
    }

    let player = players.get(oldState.guild.id);
    if (!player) {
      return; // no player in this channel
    }

    if (!oldState.channel.isVoice()) {
      return;
    }

    player.die();
  });
}

export class Player {
  /**
   * @param {Guild} guild 
   */
  constructor(guild) {
    // get the guild object
    this.guild = guild;
    this.currentVoice = null;

    this.player = createAudioPlayer();
    this.queue = new Queue();
    
    players.set(this.guild.id, this);
  }

  /**
   * @param {GuildMember} member 
   * @returns 
   */
  isValid(member) {
    if (!this.currentVoice) {
      return false;
    }

    if (member.voice?.channel?.id !== this.currentVoice.id) {
      return false;
    }

    return true;
  }

  /**
   * @param {VoiceChannel} voiceChannel 
   */
  connect(voiceChannel) {
    if (this.connection && voiceChannel.id === this.currentVoice?.id) {
      return false; // do not create a new connection if already is current channel
    }

    this.connection = joinVoiceChannel({
      adapterCreator: this.guild.voiceAdapterCreator,
      guildId: this.guild.id,
      channelId: voiceChannel.id
    });

    this.player.on('stateChange', (olds, news) => {
      // if it goes from Idle to non-idle then queue the next song
      if (olds.status !== AudioPlayerStatus.Idle && news.status === AudioPlayerStatus.Idle) {
        this.playNext();
      }
    });

    this.connection.subscribe(this.player);
    this.guild.members.fetch(client.user.id).then(member => member.voice.setDeaf(true));

    // update the current voice channel
    this.currentVoice = voiceChannel;
    return true;
  }

  addToQueue(track) {
    this.queue.enqueue(track);
    
    // only play the next song if it is idle OR the queue is empty
    if (this.player.state.status === AudioPlayerStatus.Playing && !this.queue.empty) {
      return;
    }

    this.playNext();
  }
  
  playNext(force = false) {
    if (force) {
      this.player.stop();
      return;
    }

    if (this.queue.empty) {
      this.currentTrack = null;
      return;
    }
    
    this.currentTrack = this.queue.next();
    this.playYouTube(this.currentTrack.url);
  }

  playYouTube(url) {
    let stream = ytdl(url, {
      o: '-',
      q: true, 
      f: 'bestaudio[ext=webm+acodec=opus+asr=48000]/bestaudio', 
      r: '100K'
    }, { stdio: [ 'ignore', 'pipe', 'ignore' ] });
    
    if (!stream.stdout) {
      return;
    }

    stream.once('spawn', () => {
      demuxProbe(stream.stdout)
        .then(probe => this.player.play(createAudioResource(probe.stream, { metadata: this, inputType: probe.type })));
    });
  }

  die() {
    this.player.stop(true);
    this.connection.destroy();
    this.connection = null;

    // unregister this player
    players.delete(this.guild.id);
  }
}

export class Messages {
  static addedToQueue({ songName, url }) {
    return basicEmbed(`Added [${songName}](${url}) to the queue`);
  }

  static skippingSong({ songName, url }) {
    return basicEmbed(`Skipping [${songName}](${url})`);
  }

  static nowPlaying({ songName, url }) {
    return basicEmbed(`Now playing [${songName}](${url})`);
  }
}

/**
 * @returns {Player}
 */
export function getPlayer(guild) {
  let player = players.get(guild.id);

  if (!player) {
    // create a new player since one doesn't exist
    player = new Player(guild);
  }

  return player;
}
