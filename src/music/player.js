import { AudioPlayerStatus, createAudioPlayer, joinVoiceChannel } from '@discordjs/voice';
import { Collection, Guild, GuildMember, VoiceChannel } from 'discord.js';

import { client } from '../index.js';
import { basicEmbed, replyEmbed } from '../utils/index.js';
import Queue, { Track } from './queue.js';
import MessageContext from './messages/context.js';
import { lonely } from './messages/index.js';


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

    if (!oldState.channel.isVoice() || oldState.channel.members.size > 1) {
      return;
    }

    let player = players.get(oldState.guild.id);
    if (!player || player.currentVoice?.id !== oldState.channelId) {
      return; // no player in this channel
    }

    player.msgCtx.send(lonely);
    player.die();
  });
}

export class Player {
  /**
   * @param {Guild} guild 
   */
  constructor(guild) {
    this.msgCtx = new MessageContext(this);

    // get the guild object
    this.guild = guild;
    this.currentVoice = null;

    this.player = createAudioPlayer();
    this.queue = new Queue();

    // default channel set to systemChannel
    this.lastChannel = guild.systemChannel;

    players.set(this.guild.id, this);
  }

  static canCreate(member) {
    return member instanceof GuildMember && member.voice.channel;
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

        // only send if the currentTrack isn't null
        if (this.currentTrack) {
          this.lastChannel?.send({ embeds: [ Messages.nowPlaying(this.currentTrack) ] });
        }
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
    
    // only play the next song if the current one is non-existent
    if (this.currentTrack) {
      return false;
    }

    this.playNext();
    return true; // true means it gets insta played
  }

  toggleLoop() {
    let loopMode = this.queue.loop = !this.queue.loop;

    // add the current track
    if (loopMode && this.currentTrack) {
      this.queue.enqueue(this.currentTrack);
    }
    
    return loopMode;
  }

  clearQueue() {
    // clear the queue and stop the player
    this.queue.clear();
    this.player.stop();

    this.currentTrack = null;
  }
  
  playNext() {
    if (this.player.state.status === AudioPlayerStatus.Playing) {
      this.player.stop();
      return; // we don't continue to allow the stateChange event to handle it
    }

    if (this.queue.empty) {
      this.currentTrack = null;
      return;
    }
    
    this.currentTrack = this.queue.next();
    this.currentTrack.play(this);
  }

  playUniversal(audioResource) {
    if (!this.connection || !this.player) {
      return;
    }

    this.player.play(audioResource);
  }

  die() {
    this.clearQueue();

    // destroy and nullify the connection
    this.connection.destroy();
    this.connection = null;

    // unregister this player
    players.delete(this.guild.id);
  }
}

export class Messages {
  static denied() {
    return replyEmbed('You cannot do this right now');
  }

  static noSuchThing() {
    return replyEmbed('No such thing, try giving me a real search term');
  }

  static loopToggled(toggle) {
    return replyEmbed(`Looping mode toggled **${toggle ? 'on' : 'off'}**`, false);
  }

  static queuedPlaylist({ songCount, playlistTitle, playlistUrl }) {
   return basicEmbed(`Added ${songCount.toLocaleString('en-US')} songs to the queue`) 
  } 
 
  static addedToQueue({ songName, url }) {
    return basicEmbed(`Added [${songName}](${url}) to the queue`);
  }

  static skippingSong({ songName, url }) {
    return basicEmbed(`Skipping [${songName}](${url})`);
  }

  static clearedQueue() {
    return replyEmbed('Emptied the queue, no songs, complete silence', false);
  }

  static nowPlaying({ songName, url }) {
    return basicEmbed(`Now playing [${songName}](${url})`);
  }

  static disconnected() {
    return basicEmbed('Everyone left the voice channel, departing as well 👋');
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
