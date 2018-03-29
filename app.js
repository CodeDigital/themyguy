var cooldown = new Date();
var channelMods = "DigitalDataGame, BOT_MyGuy";
cooldown.setTime(cooldown.getTime() - 20000);
//const elc = require('electron');
var irc = require('irc');
var nick = 'bot_myguy';
var channel = 'digitaldatagame';
var oauth = 'oauth:gfvjj6psoe40y89oqz3zew36y00eoo';

var client = new irc.Client('irc.chat.twitch.tv', nick, {
    autoConnect: false,
    autoRejoin: true,
    channels: [('#' + channel)],
    userName: 'digitaldatagame',
    retryCount: 5,
    retryDelay: 2000
});

client.addListener('error', function(e) {
   console.log('ERROR: ' + e.rawCommand);
});

client.addListener('registered', function(message){
    console.log(message);
})

client.addListener('pm', function (from, message) {
    console.log(from + ' => ME: ' + message);
});

client.addListener(('message#' + channel), function (from, message) {
    console.log(from + ' => #yourchannel: ' + message);
});

client.addListener('motd', function(motd) {
    console.log(motd);
})

client.addListener('ping', function(server) {
    console.log('You\'ve been pinged!');
});

client.connect();

client.send('PASS', oauth);

client.join(('#' + channel), function () {
    console.log('Connected to ' + channel);
});

function gotMessage(from, message){
    if(message.contains()){}
}
