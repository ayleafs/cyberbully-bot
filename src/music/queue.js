export default class Queue {
  data = [];
  loop = false;


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
    let next = this.data.shift();

    if (this.loop) {
      this.enqueue(next);
    }

    return next;
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
