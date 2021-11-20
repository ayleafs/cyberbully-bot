import * as toxicity from '@tensorflow-models/toxicity';
import { Message } from 'discord.js';


/*

  // check the regex101 link for examples: https://regex101.com/r/hImFl6/
  if (/(i? +do *n[o']?t like|i hate|die|fuck) +(you ?)?tom/gi.test(msg.content)) {
    lastMessage = Date.now();
    msg.reply({ content: ':(', failIfNotExists: false });
  }

*/

export default class Brain {
  static async init() {
    return new Brain(await toxicity.load(0.8));
  }

  /**
   * @param {toxicity.ToxicityClassifier} model
   */
  constructor(model) {
    this.model = model;
  }

  /**
   * @param {Message} msg
   */
  processMentioned(msg) {
    // strip the message contents of any mentions
    let { content } = msg;
    content = content.replaceAll(/<@!\d+>/gi, '').trim();

    // we don't want to waste time processing long messages
    if (content.length >= 100) {
      return;
    }

    console.log('---')

    this.model.classify(content).then(predictions => {
      for (let { label, results } of predictions) {
        // filter to only include those results
        if (![ 'insult', 'toxicity', 'threat', 'sexual_explicit' ].includes(label)) {
          continue;
        }


        let first = results[0];
        console.log(label, first.match, first.probabilities[1]);
      }
    });
  }
}
