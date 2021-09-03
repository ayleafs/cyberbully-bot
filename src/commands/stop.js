import { getPlayer, Messages } from '../music/player.js';
import { replyEmbed } from '../utils/index.js';
import CommandBase from './registry.js';

export const stop = new CommandBase('stop')
  .setDescription('Makes the bot fuck off')

  .setExecutor(interaction => {
    // bye bye
    let player = getPlayer(interaction.guild);
    if (!player.isValid(interaction.member)) {
      interaction.reply(Messages.denied());
      return;
    }

    // kill it
    player.die();
    interaction.reply(replyEmbed('Okay, I see how it is 😔', false));
  });
