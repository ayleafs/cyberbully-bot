import Track from "./track.js";
import { raw as ytdl } from "youtube-dl-exec";
import { demuxProbe, createAudioResource } from "@discordjs/voice";

export default class YouTubeTrack extends Track {
  constructor({ name, url, playlist }) {
    super({ name, url });

    this.playlist = playlist;
  }

  play(player) {
    let stream = ytdl(this.url, {
      o: '-',
      q: true, 
      f: 'bestaudio[ext=webm+acodec=opus+asr=48000]/bestaudio', 
      r: '100K'
    }, { stdio: [ 'ignore', 'pipe' ] });

    // if nothing comes from the stdout, ignore
    if (!stream.stdout) {
      return;
    }

    // when the stream spawns, start demuxing it and sending it through to
    // discord via the player we've created
    stream.once('spawn', () => {
      demuxProbe(stream.stdout)
        .then(probe => player.playUniversal(createAudioResource(probe.stream, { inputType: probe.type })));
    });
  }
}
