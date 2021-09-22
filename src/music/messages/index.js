import { Message } from "./context.js";

// all the messages that the bot responds with
export const newSongQueued = new Message(({ player }) => {
  return player.queue.empty ? `Now playing ${player.currentTrack?.repr()}` : `Added ${player.currentTrack?.repr()} to the queue`;
});

export const skippingSong = new Message(({ player }) => `Skipping ${player.currentTrack?.repr()}`);

export const queueCleared = new Message(_ => 'Emptied the queue, no songs, complete silence');

export const toggledLooping = new Message(({ player }) => `Looping mode toggled **${player.queue.loop ? 'on' : 'off'}**`);

export const lonely = new Message(_ => 'Oh ok.. everyone just leave me alone, that\'s fine I\'ll leave too')

export const badSearch = new Message(_ => 'I cannot imagine what you searched to make YouTube confused but there isn\'t anything for you')

export const denied = new Message(_ => 'You cannot do this right now, sorry')
