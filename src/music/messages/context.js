import { Interaction } from "discord.js";
import { Player } from "../player.js";

export default class MessageContext {
  /**
   * @param {Player} player 
   */
  constructor(player) {
    this.player = player;
    this.activeChannel = null;
  }

  /**
   * @param {Message} msg
   * @param {Interaction} interaction 
   */
  send(msg, interaction = null) {
    let embed = { description: msg.getText(this), ...msg.embedOptions };

    // if there's no response or it's been replied to, or it cannot be replied to
    // then we send a message using the active channel
    if (!interaction || interaction.replied || !('reply' in interaction)) {
      this.activeChannel?.send({ embeds: [ embed ] })?.catch(console.error);
      return;
    }

    interaction.reply({ embeds: [ embed ], ephemeral: msg.ephemeral });
  }
}

export class Message {
  /**
   * @param {(ctx: MessageContext) => string} getMessage
   * @param {MessageEmbedOptions} options
   * @param {boolean} ephemeral
   */
  constructor(getMessage, options = {}, ephemeral = false) {
    this.getText      = getMessage;
    this.embedOptions = options;
    
    this.ephemeral = ephemeral;
  }
}
