var cooldown = new Date();
var channelMods = "DigitalDataGame, BOT_MyGuy";

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
	userName: 'digitaldatagame',
	retryCount: 5,
	retryDelay: 2000
});

client.addListener('error', function(e) {
   console.log('ERROR: ' + e.rawCommand);
});

client.addListener('registered', function(message){
	console.log(message);
});

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

// function gotWhisper(from, message){
//     var now = new Date();
//     if(now.getTime() - cooldown.getTime() >= 15000){
//         if(checkMod(from)){
//             cooldown = new Date();
//         }
//         if(checkM(message, '!hello')){
//             whisper('Hello World!');
//         }else if(checkM(message, '!twitter')){
//             whisper('Hi, ' + from + '! His Twitter is  twitter.com/digitaldatagame');
//         }else if(checkM(message, '!yt') || checkM(message, '!youtube')){
//             whisper('Hi, ' + from + '! His YouTube is youtube.com/digitaldatagame');
//         }else if(checkM(message, '!who')){
//             whisper('I was created by DigitalData. You\'re watching his stream right now!');
//         }else if(checkM(message, '!website')){
//             whisper('Hi, ' + from + '! His website is codedigital.github.io');
//         }else if(checkM(message, '!subtitles')){
//             whisper('Hi, ' + from + '! DigitalData recently developed a tool allowing streamers to add live working subtitles to their streams. Check it out at codedigital.github.io/TwitchSubtitles');
//         }
//     }
// }

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