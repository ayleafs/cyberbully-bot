export default class Queue {
  data = [];

  clear() {
    // set a new array
    this.data = [];
  }

  peek() {
    return this.empty ? this.data[0] : undefined;
  }

  enqueue(object) {
    this.data.push(object);
  }

  next() {
    return this.data.shift();
  }

  get empty() {
    return this.data.length === 0;
  }
}

export class Track {
  constructor(name, url) {
    this.songName = name;
    this.url      = url;
  }
}
