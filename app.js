var irc = require('irc');
var elc = require('electron');

var options = {
    port: 80,
    debug: true,
    showErrors: true,
    autoRejoin: true,
    autoConnect: false,
    channels: ['digitaldatagame'],
    retryCount: 3,
    retryDelay: 2000,
};

var client = new irc.Client('irc.chat.twitch.tv', 'digitaldatagame', options);
client.connect();

client.send('PASS','oauth:tvt9fwi4lhlhuqrf6glfjbcj8mzg3r')
//client.on('raw',function(data){
     //console.log(data);
//})
//console.log(client);