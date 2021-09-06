import { getPlayer, Messages } from '../music/player.js';
import CommandBase from './registry.js';

export const loop = new CommandBase('loop')
  .setDescription('Loops the current queue')
  .setExecutor(interaction => {
    let { member } = interaction;
    let player = getPlayer(member);

    if (!player.isValid(member)) {
      interaction.reply(Messages.denied());
      return;
    }

    // toggles the loop
    player.queue.loop = !player.queue.loop;

    interaction.reply(Messages.loopToggled(player.queue.loop));
  });
