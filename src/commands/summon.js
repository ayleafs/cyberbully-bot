import { GuildMember } from "discord.js";
import { getPlayer } from "../music/player.js";
import { replyEmbed } from "../utils/index.js";
import CommandBase from "./registry.js";

export const summon = new CommandBase('summon')
  .setDescription('Summons the bot to the current voice channel by force')

  .setExecutor(interaction => {
    let { member } = interaction;
    if (!(member instanceof GuildMember)) {
      return; // only guild members
    }

    if (!member.voice.channel) {
      interaction.reply(replyEmbed('You need to be in a voice channel'));
      return;
    }

    if (!getPlayer(member.guild).connect(member.voice.channel)) {
      interaction.reply(replyEmbed('I am already in this channel, notice me?'));
      return;
    }

    interaction.reply(replyEmbed(`Joining ${member}'s voice channel`, false));
  });
