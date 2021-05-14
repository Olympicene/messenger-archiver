const Command = require("./Command.js");
const SpotifyWebApi = require('spotify-web-api-node');
var path = require("path");
const fs = require("fs");

module.exports = class Recommend extends Command {
  constructor(ids) {
    super(ids);
    this.term = "!Recommend";
    this.description = " ";
    this.type = ["message", "message_reply"];
    this.needContent = false;
    this.message = {
      body: "",
    };
  }

  async doAction(event, api) {

    ////////////////////////////////////////////////////SPOTIFY_LOGIN////////////////////////////////////////////////////


    const databaseDir = path.resolve(__dirname + "/../database/");
    var credentials = JSON.parse(fs.readFileSync(databaseDir + "/credentials-reddit.json"));

    const spotifyApi = new SpotifyWebApi({
      clientId: credentials.spotify.clientId,
      clientSecret: credentials.spotify.clientSecret
    });

    if(Date.now() - parseInt(credentials.spotify.time) > 2700000) { //about 45 minutes
      spotifyApi.clientCredentialsGrant()
      .then((data) => {
        credentials.spotify.accessToken = data.body['access_token'];
        credentials.spotify.time = Date.now();

        fs.writeFileSync(databaseDir + "/credentials-reddit.json", JSON.stringify(credentials, null, "\t"));
      })
      .catch((err) => {
        console.error(`could not get credentials: ${err}`)
      })
    }

    spotifyApi.setAccessToken(credentials.spotify.accessToken);

    ////////////////////////////////////////////////////SPOTIFY_LOGIN////////////////////////////////////////////////////

    try {
      var playlist = await spotifyApi.getPlaylist('7mYoCHFxN5TdfA3sDksdYr')

      var song = playlist.body.tracks.items[Math.floor(Math.random() * playlist.body.tracks.items.length)].track //random song

      var artists = [] //parse artists
      for (var artist in song.artists) {
        artists.push(song.artists[artist].name);
      }

      this.message.body = `${song.name} - ${artists.join(", ")}`

      const mediaDir = path.resolve(__dirname + "/../media/" + `rec.mp3`); //directory the mp3 file is going to
      var url = song.preview_url

      try {

        await super.downloadFile(url, mediaDir)
        this.message.attachment = fs.createReadStream(mediaDir);
      } catch (err) {
        this.message.body = err
        console.error(err)
      }

    } catch (err) {
      this.message.body = err
      console.error(err)
    }
    super.send(event, api, this.message);

  }
};