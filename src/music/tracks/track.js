export default class Track {
  constructor({ name, url }) {
    this.name = name;
    this.url  = url;
  }

  play(player) {
    console.error({ this: this, message: 'Just attempted to play from a base Track' });
  }

  repr() {
    // this is the way the song will be represented
    return `[${this.name}](${this.url})`;
  }
}
