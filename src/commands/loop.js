import { getPlayer, Messages } from '../music/player.js';
import CommandBase from './registry.js';

export const loop = new CommandBase('loop')
  .setDescription('Loops the current queue')
  .setExecutor(interaction => {
    let { member } = interaction;
    let player = getPlayer(member.guild);

    if (!player.isValid(member)) {
      interaction.reply(Messages.denied());
      return;
    }

    interaction.reply(Messages.loopToggled(player.toggleLoop()));
  });
