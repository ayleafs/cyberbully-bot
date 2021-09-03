import { getPlayer, Messages } from "../music/player.js";
import { replyEmbed } from "../utils/index.js";
import CommandBase from "./registry.js";

export const skip = new CommandBase('skip')
  .setDescription('Skips the current song')

  .setExecutor(interaction => {
    let { member } = interaction;

    let player = getPlayer(member.guild);
    if (!player.isValid(member)) {
      interaction.reply(Messages.denied());
      return;
    }

    if (!player.currentTrack) {
      interaction.reply(replyEmbed('There is no song to skip right now'));
      return;
    }

    interaction.reply({ embeds: [ Messages.skippingSong(player.currentTrack) ] });

    // play the next song in queue
    player.playNext();
  });
