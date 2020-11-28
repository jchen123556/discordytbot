const { SSL_OP_TLS_BLOCK_PADDING_BUG, SSL_OP_SSLEAY_080_CLIENT_DH_BUG } = require('constants');
const Discord = require('discord.js');
const {
	prefix,
    token,
    ytkey
} = require('./config.json');
const ytdl = require("ytdl-core");
var search = require('youtube-search');

var results = null;

const client = new Discord.Client();
client.login(token);

class Queue {
    constructor() {
        this.items = [];
        this.size = 0;
    }
    dequeue() {
        if (this.size != 0) {
            var item = this.items.shift();
            this.size -= 1;
            return item;
        }
    }
    enqueue(item) {
        this.items.push(item);
        this.size += 1;
    }
    clear() {
        this.items = [];
        this.size = 0;
    }
}

const queue = new Queue();

client.once('ready', () => {
    console.log('Ready!');
});
client.once('reconnecting', () => {
    console.log('Reconnecting!');
});
client.once('disconnect', () => {
    console.log('Disconnect!');
});

client.on('message', async message => {
    // Checks if message is from bot and has valid prefix
    if (!message.author.bot && message.content.startsWith(prefix)) {
        var command = message.content.substring(1).split(" ");
        if (command[0] == "play") {
            playSong(message);
        } else if (command[0] == "skip") {
            skip(message);
        } else if (command[0] == "stop") {
            stop(message);
        } else {
            // printQueue(message);
            message.channel.send("You need to enter a valid command!");
        }
    }
});

async function playSong(message) {
    var query = message.content.substring(6);
    var opts = {
        maxResults: 1,
        type: "video",
        key: ytkey
    };
    var info = await search(query, opts, (function(err, r) {
        return r;
    })());

    //console.log(info);

    const videourl = info.results[0].link;

    const songInfo = await ytdl.getInfo(videourl);
    const song = {
        title: songInfo.videoDetails.title,
        url: songInfo.videoDetails.video_url,
   };

    const queueobj = {
        voiceChannel: message.member.voice.channel,
        textChannel: message.channel,
        connection: null,
        song: song
    }
    queue.enqueue(queueobj);

    try {
        var connection = await queueobj.voiceChannel.join();
        queueobj.connection = connection;
        play();
    } catch (err) {
        console.log(err);
        queue.clear();
        return;
    }
}

function play() {
    newsong = queue.dequeue();
    const dispatcher = newsong.connection
        .play(ytdl(newsong.song.url))
        .on("finish", () => {
            play();
        })
        .on("error", error => console.error(error));
    dispatcher.setVolume(1);
    newsong.textChannel.send(`Start playing: **${newsong.song.title}**`);
}

async function skip(message) {
    queue.dequeue();
}

async function stop(message) {
    queue.dequeue();
}

function saveResults(result) {
    results = result;
}

/*
async function printQueue(message) {
    message.channel.send("Queue contents are: ");
    var m = "";
    for (i = 0; i < queue.items.length; i++) {
        m += queue.items[i];
        m += ", ";
    }
    message.channel.send(m);
}
message
*/
