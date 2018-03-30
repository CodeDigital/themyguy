var cooldown = new Date();
var channelMods = "DigitalDataGame, BOT_MyGuy";
var WebSocket = require('ws');
var ping = {
    "type": "PING"
};
var pong = {
    "type": "PONG"
};


var ws = new WebSocket('wss://pubsub-edge.twitch.tv');

ws.on('open', function() {
    console.log('Connected to WEBSOCKET.');
    startPinging();
    ws.send(JSON.stringify({
        "type": "LISTEN",
        "data": {
            "topics": ["whispers.188356345"],
            "auth_token": "eqm0rrezh5i7au6o3um4a54fk5ls64"
        }
    }));
});
function startPinging(){
    setInterval(function(){
        console.log('Pinged WS Server');
        ws.send(JSON.stringify(ping));
    }, (2.5 * 60 * 1000));
}

ws.on('close', function(code,reason) {
    console.log('WS Closed Because: ' + reason + '| Code: ' + code);
});

ws.on('error', function(e) {
    console.log(e);
    ws = new WebSocket('wss://pubsub-edge.twitch.tv');
});

ws.on('message', function(event){
    var e = JSON.parse(event);
    //console.log(JSON.parse(event));
    //console.log(e.data);
    if(e.data != undefined){
        //console.log(e.data.message);
        if(e.data.message != undefined){
            var datas = JSON.parse(e.data.message);
            if(datas.data != undefined){
                var message = JSON.parse(datas.data);
                //console.log(message.body);
                var body = message.body;
                var senderInfo = message.tags;
                var sender = senderInfo.login;
                //console.log(message.tags);
                gotWhisper(sender,body);
                //console.log('It wasn\'t null');
            }
        }
    }
});

cooldown.setTime(cooldown.getTime() - 20000);
//const elc = require('electron');
var irc = require('irc');
var nick = 'bot_myguy';
var channel = 'digitaldatagame';
var oauth = 'oauth:eqm0rrezh5i7au6o3um4a54fk5ls64';

var client = new irc.Client('irc.chat.twitch.tv', nick, {
	autoConnect: false,
	autoRejoin: true,
	channels: [('#' + channel)],
	userName: nick,
	retryCount: 5,
	retryDelay: 2000
});

client.addListener('error', function(e) {
   console.log('ERROR: ' + e.prefix + " | " + e.nick + " | " + e.user + " | " + e.host + " | " + e.server + " | " + e.rawCommand + " | " + e.command + " | " + e.args);
});

client.addListener('registered', function(message){
	console.log(message);
});

client.addListener('message', function(from, message) {
    console.log('pm: ' + from + ' - ' + message);
});

// client.addListener('raw', function(from, message) {
//     console.log('pm: ' + from + ' - ' + message);
// });


client.addListener(('message#' + channel), function (from, message) {
	gotMessage(from,message);
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
	sayChan('/color hotpink');
	actChan('Hello Everybody! I\'m here to help. Type !help for commands.');
	client.send('CAP', 'REQ', ':twitch.tv/commands');

});

function gotMessage(from, message){
    var now = new Date();
    if(now.getTime() - cooldown.getTime() >= 15000){
        if(checkMod(from)){
            cooldown = new Date();
        }
        if(checkM(message, '!hello')){
            sayChan('Hello World!');
        }else if(checkM(message, '!twitter')){
            sayChan('Hi, ' + from + '! His Twitter is  twitter.com/digitaldatagame');
        }else if(checkM(message, '!yt') || checkM(message, '!youtube')){
            sayChan('Hi, ' + from + '! His YouTube is youtube.com/digitaldatagame');
        }else if(checkM(message, '!who')){
            sayChan('I was created by DigitalData. You\'re watching his stream right now!');
        }else if(checkM(message, '!website')){
            sayChan('Hi, ' + from + '! His website is codedigital.github.io');
        }else if(checkM(message, '!subtitles')){
            sayChan('Hi, ' + from + '! DigitalData recently developed a tool allowing streamers to add live working subtitles to their streams. Check it out at codedigital.github.io/TwitchSubtitles');
        }
    }
}

function gotWhisper(from, message){
    var now = new Date();
    if(now.getTime() - cooldown.getTime() >= 15000){
        if(checkMod(from)){
            cooldown = new Date();
        }
        if(checkM(message, '!hello')){
            whisper(from, 'Hello World!');
        }else if(checkM(message, '!twitter')){
            whisper(from, 'Hi, ' + from + '! His Twitter is  twitter.com/digitaldatagame');
        }else if(checkM(message, '!yt') || checkM(message, '!youtube')){
            whisper(from, 'Hi, ' + from + '! His YouTube is youtube.com/digitaldatagame');
        }else if(checkM(message, '!who')){
            whisper(from, 'I was created by DigitalData. You\'re watching his stream right now!');
        }else if(checkM(message, '!website')){
            whisper(from, 'Hi, ' + from + '! His website is codedigital.github.io');
        }else if(checkM(message, '!subtitles')){
            whisper(from, 'Hi, ' + from + '! DigitalData recently developed a tool allowing streamers to add live working subtitles to their streams. Check it out at codedigital.github.io/TwitchSubtitles');
        }
    }
}

function sayChan(message){
	client.say(('#' + channel), message);
}

function whisper(to, message){
	client.say(('#' + channel), ('/w ' + to + ' ' + message));
}

function actChan(message){
	client.action(('#' + channel), message);
}

function checkM(message, command){
    return message.includes(command);
}

function checkMod(nick){
    for (var i = 0;i<channelMods.length;i = i+1){
        if(channelMods[i] == nick){
            return true;
        }
    }
    return false;
}