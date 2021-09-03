import { getPlayer, Messages } from '../music/player.js';
import CommandBase from './registry.js';


export const clear = new CommandBase('clear')
  .setDescription('Clears the queue incase somebody has bad taste in music')

  .setExecutor(interaction => {
    let player = getPlayer(interaction.guild);

    // make sure the member can clear the queue
    if (!player.isValid(interaction.member)) {
      interaction.reply(Messages.denied());
      return;
    }

    // clear the queue
    player.clearQueue();
    interaction.reply(Messages.clearedQueue());
  });
