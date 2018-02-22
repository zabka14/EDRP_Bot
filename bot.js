// Load up the file system library
const fs = require('fs');
const path = require('path');

// Load up the discord.js library
const Discord = require("discord.js");

// Load up the moment.js library
const moment = require('moment-timezone');
moment.locale("fr");

// Load up the schedule library
const schedule = require('node-schedule');

// Load up the underscore-node library
const _ = require('underscore-node');

// Load up the fetch libraries
const fetchXml = require('node-fetch');
const fetchJson = require('node-fetch-json');

// Load up the request library
const request = require('request');

// This is your client. Some people call it `bot`, some people call it `self`,
// some might call it `cootchie`. Either way, when you see `client.something`, or `bot.something`,
// this is what we're refering to. Your client.
const client = new Discord.Client();

// Here we load the config.json file that contains our token and our prefix values.
const config = require("./config/config.json");
const envConfig = require("./config/envConf.json");

// Load up mongoose library
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI, {
    useMongoClient: true
});
mongoose.Promise = global.Promise;
const Schema = mongoose.Schema;

// Player object
var PlayerSchema = new Schema({
    player_id: String,
    player_name: String
});
var Player = mongoose.model('Player', PlayerSchema);



// Client ready
client.on("ready", () => {
    // This event will run if the bot starts, and logs in, successfully.
    console.log(`Bot has started, with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds.`);
    // Example of changing the bot's playing game to something useful. `client.user` is what the
    // docs refer to as the "ClientUser".
    // client.user.setUsername(config.bot_username).catch(console.error);
    // client.user.setGame(config.bot_game).catch(console.error);
});

client.on("guildCreate", guild => {
    // This event triggers when the bot joins a guild.
    console.log(`New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`);
    client.user.setUsername(config.bot_username).catch(console.error);
    client.user.setGame(config.bot_game).catch(console.error);
});

client.on("guildDelete", guild => {
    // this event triggers when the bot is removed from a guild.
    console.log(`I have been removed from: ${guild.name} (id: ${guild.id})`);
});

client.on("channelDelete", channel => {
    unSub(channel.id);
});


client.on("message", async message => {
    // This event will run on every single message received, from any channel or DM.

    // It's good practice to ignore other bots. This also makes your bot ignore itself
    // and not get into a spam loop (we call that "botception").
    if (message.author.bot) return;

    // Ignore non-command message
    if (message.content.indexOf(config.prefix) !== 0) return;

    // Here we separate our "command" name, and our "arguments" for the command.
    // e.g. if we have the message "+say Is this the real life?" , we'll get the following:
    // command = say
    // args = ["Is", "this", "the", "real", "life?"]
    const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    // Log command
    console.log(`----- command received from ${message.author.id} - ${message.author.username}#${message.author.discriminator} : `, message.content);

    switch (command) {
        case 'ping':
            {
                // Calculates ping between sending a message and editing it, giving a nice round-trip latency.
                // The second ping is an average latency between the bot and the websocket server (one-way, not round-trip)
                const m = await message.channel.send("Ping?");
                m.edit(`Pong! Latency is ${m.createdTimestamp - message.createdTimestamp}ms. API Latency is ${Math.round(client.ping)}ms`)
                .then(msg => {
                    message.delete();
                    msg.delete(config.time_before_delete)
                })
                .catch(console.error);
                break;
            }
        case 'help':
            {
                // Display help message
                sendMessage(`help message`, message)
                break;
            }
        case 'register':
            {
                if (args[0] !== undefined) {

                    var newUser = new Player({
                        player_id: message.author.id,
                        player_name: args[0]
                    });
                    newUser.save(function (error) {
                        if (error) console.error(error);
                    });
                    return;
                } else {
                    sendMessage(`Player name missing. Proper command usage is : !register CMDR_Name`, message);
                    return;
                }
                break;
            }
        case 'list_players':
            {
                Player.find(function (error, players) {
                    if (error) console.error(error);
                    let _players = _.map(players, function (item) {
                        return `${item}`
                    });
                    sendMessage(`Player list : ${_players.join(', ')}`, message);
                });
                break;
            }
        default:
            {}
    }
});

// Keepalive
schedule.scheduleJob("0 /5 * * * *", function () {
    console.log(`Sending keepalive...`);
    request(process.env.APP_URL, function (error, response, body) {
        console.log('error:', error); // Print the error if one occurred
        console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
    });
});


var sendMessage = function (message, obj_msg, doDelete = false) {
    if (!doDelete) {
        obj_msg.channel.send(message)
            .catch(console.error);
    } else {
        obj_msg.channel.send(message)
            .then(msg => {
                obj_msg.delete();
                msg.delete(config.time_before_delete)
            })
            .catch(console.error);
    }
}

client.login(envConfig.BOT_TOKEN);