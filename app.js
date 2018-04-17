//TODO: Add WebHook integration for follows/other.
//TODO: Add More Commands.
//TODO: Create Loadable Application. (Using Electron JS)
//TODO: Integrate P5JS and P5Game Capabilities for Electron App (Stream Avatar Style).

//Declaring General Info Variables. TODO: Find a way to remove these later.
var creator = 'digitaldata';
var channelMods = ["digitaldata", "botmyguy", "nightbot"];
var channel = 'digitaldata';
var token = 'd3zbkzsdftx0rq8ncgdo37pkw2380t';
//var token = '';
var oauthT = 'oauth:' + token;
var botID = '188356345';

//Declaring Cooldown Variables.
var cooldown = new Date();
var cooldownWhisper = new Date();
cooldown.setTime(cooldown.getTime() - 20000);
cooldownWhisper.setTime(cooldownWhisper.getTime() - 20000);

//Declaring WebSocket Variables.
var whisperEvent = 'whispers.' + botID;
var heartbeat;
var userEnded = false;
var WebSocket = require('ws');
var ping = {
		"type": "PING"
};
var pong = {
		"type": "PONG"
};

//Declaring Polling Variables.
var isPolling = false;
var pollingMod = '';
var countOptions = 1;
var pollData = 0;
var poll = ({
		'started': false,
		'name': '',
		'options': [],
		'optionsCount': [],
		'optionsAmt': 0,
		'length': 0,
		'winner':'',
		'voted': []
});

//Declaring IRC Variables.
var irc = require('irc');
var nick = 'botmyguy';
var annoyed = false;
var recursive;
var retryErrorOver;

//Declaring Both WS and IRC Variables.
var client;
var ws;


const url = require('url');
const path = require('path');

const {app, BrowserWindow, Menu, ipcMain} = require('electron');

let mainWindow;

//Listen for the app to be ready.
app.on('ready', function(){
		//Create new window.
		mainWindow = new BrowserWindow({
				titleBarStyle: 'customButtonsOnHover',
				frame: false,
				darkTheme: true
		});
		//Load HTML File into window.
		mainWindow.loadURL(url.format({
				pathname: path.join(__dirname, 'main.html'),
				protocol: 'file:',
				slashes: true
		}));

		//Quit Everything when Window Closed.
		mainWindow.on('closed',function() {
				app.quit();
		});

		mainWindow.on('focus', function () {
				Menu.setApplicationMenu(mainMenu);
		});

		//Build menu from Template.
		const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);

		//Insert Menu
		Menu.setApplicationMenu(mainMenu);
});

//Create main Window menu template
const mainMenuTemplate = [
		{
				label: 'File',
				submenu: [
						{
								label: 'Quit',
								accelerator: (process.platform == 'darwin') ? 'Command+Q':'Ctrl+Q',
								click(){
										app.quit();
								}
						}
				]
		},
		{
				label: 'Connect',
				submenu: [
						{
								label: 'Connect',
								accelerator: ('Return'),
								click(){
										if (token != '') {
												console.log('Connecting!');
												connect();
										}else{
												createErrorWindow('The BOT Couldn\'t Connect','You haven\'t logged in yet! Go through the setup process before continuing.');
										}
								}
						},
						{
								label: 'Disconnect',
								accelerator: ('Backspace'),
								click(){
										disconnect();
								}
						}
				]
		}
];

//
if(process.platform == 'darwin'){
		mainMenuTemplate.unshift({});
}

//Add developer tools if not in production.
if (process.env.NODE_ENV !== 'production'){
		mainMenuTemplate.push({
				label:'Developer Tools',
				submenu: [
						{
								label: 'Toggle Developer Tools',
								accelerator: '`',
								click(item, focusedWindow){
										focusedWindow.toggleDevTools();
								}
						},
						{
								role: 'reload',
								//label: 'Reload',
								//accelerator: (process.platform == 'darwin') ? 'Command+R':'Ctrl+R'
						}
				]
		})
}

//Create empty Window menu template
const emptyMenuTemplate = [];

function createErrorWindow(title, message) {
		var errorMessage = {};
		errorMessage.title = title;
		errorMessage.body = message;

		//Create Error Window
		errorWindow = new BrowserWindow({
				titleBarStyle: 'customButtonsOnHover',
				frame: false,
				width: 400,
				height: 200,
				title: 'An Error Occured!',
				darkTheme: true
		});

		//Load Error Window Template
		errorWindow.loadURL(url.format({
				pathname: path.join(__dirname, 'errorWindow.html'),
				protocol: 'file:',
				slashes: true
		}));

		setTimeout(function () {
				//console.log('Shown');
				errorWindow.webContents.send('got:error', errorMessage);
		}, 1000);

		//Build menu from Template.
		//const errorMenu = Menu.buildFromTemplate(emptyMenuTemplate);

		//Insert Menu
		//Menu.setApplicationMenu(errorMenu);

		//Garbage Collection Handle.
		errorWindow.on('closed', function(){
				errorWindow = null;
		});
}

function connect() {
		function startWS() {
				var successfulConnection = false;
				userEnded = false;
				console.log('Starting WS Connection...');
				ws = new WebSocket('wss://pubsub-edge.twitch.tv');

				ws.addEventListener('open', function () {
						startPinging();
						retryErrorOver = setTimeout(function () {
								console.log('Established Stable Connection To WebSocket.');
								successfulConnection = true;
						}, 5000)
						ws.send(JSON.stringify({
								"type": "LISTEN",
								"data": {
										"topics": ["whispers.188356345"],
										"auth_token": token
								}
						}));
				});

				function startPinging() {
						heartbeat = setInterval(function () {
								if (ws.readyState == 1) {
										ws.ping(JSON.stringify(ping), true, function () {
												console.log('Pinged WS Server');
										});
								}
						}, (60 * 1000));
				}

				ws.addEventListener('close', function (code, reason) {
						console.log('WS Closed Because: ' + reason + ' | Code: ' + code.data);
						clearInterval(heartbeat);
						if(!userEnded){
								startWS();
						}else{
							successfulConnection = false;
							//userEnded = false;
							clearInterval(heartbeat);
							clearTimeout(retryErrorOver);
						}
				});

				ws.addEventListener('error', function (e) {
						console.log(e);
						clearInterval(heartbeat);
						clearTimeout(retryErrorOver);
						startWS();
				});

				ws.addEventListener('message', function (event) {
						//console.log(event);
						if (event != undefined) {
								//var e = JSON.parse(event);
								//console.log(JSON.parse(event));
								//console.log(e.data);
								//console.log(event);
								if (event.data != undefined) {
										var edata = JSON.parse(event.data);
										//console.log(edata);
										//Check Type of Message (either RECONNECT or WHISPER
										if (edata.type == 'MESSAGE') {
												if (edata.data != undefined) {
														//console.log(edata.data.message);
														if(edata.data.topic = whisperEvent){
																var datas = JSON.parse(edata.data.message);
																//console.log(datas);
																if (datas.data != undefined) {
																		var message = JSON.parse(datas.data);
																		//console.log(message.body);
																		var body = message.body;
																		var senderInfo = message.tags;
																		var sender = senderInfo.login;
																		//console.log(message.tags);
																		gotWhisper(sender, body);
																		//console.log('It wasn\'t null');
																}
														}else{
																console.log('This is something else...')
														}
												}
										}else if(edata.type = 'RECONNECT' && successfulConnection){
												//console.log(edata);
												startWS();
										}
								}
						}
				});
		}

		client = new irc.Client('irc.chat.twitch.tv', nick, {
				autoConnect: false,
				autoRejoin: true,
				channels: [('#' + channel)],
				userName: nick,
				retryCount: 5,
				retryDelay: 2000
		});

		client.addListener('error', function (e) {
				console.log('ERROR: ' + e.prefix + " | " + e.nick + " | " + e.user + " | " + e.host + " | " + e.server + " | " + e.rawCommand + " | " + e.command + " | " + e.args);
		});

		client.addListener('registered', function (message) {
				console.log(message.args);
		});

		client.addListener('message', function (from, message) {
				console.log('pm: ' + from + ' - ' + message);
		});

		client.addListener(('message#' + channel), function (from, message) {
				gotMessage(from, message);
				console.log(from + ' => #yourchannel: ' + message);
		});

		client.addListener('motd', function (motd) {
				console.log(motd);
		})

		client.addListener('ping', function (server) {
				console.log('You\'ve been pinged!');
		});

		client.connect(10, function () {
				console.log('IRC Connected!');
		});

		client.send('PASS', oauthT);

		client.join(('#' + channel), function () {
				console.log('Connected to ' + channel);
				sayChan('/color hotpink');
				actChan('Hello Everybody! I\'m here to help. Type !help for commands.');
				client.send('CAP', 'REQ', ':twitch.tv/commands');
				sayChan('/host ' + channel);
				console.log('Trying WS...');
				startWS();
		});

		function gotMessage(from, message) {
				var now = new Date();
				if (now.getTime() - cooldown.getTime() >= 15000) {
						if (!checkMod(from)) {
								cooldown = new Date();
						}
						if (checkM(message, '@BOT_MyGuy')) {
								if (from == creator) {
										sayChan('Hello there, Master!');
								} else {
										sayChan('Hey! You\'re not my master...');
								}
						}
						if (checkM(message, '!hello')) {
								sayChan('Hello World!');
						} else if (checkM(message, '!twitter')) {
								sayChan('Hi, ' + from + '! His Twitter is  twitter.com/digitaldatagame');
						} else if (checkM(message, '!yt') || checkM(message, '!youtube')) {
								sayChan('Hi, ' + from + '! His YouTube is youtube.com/digitaldatagame');
						} else if (checkM(message, '!who')) {
								sayChan('I was created by DigitalData. You\'re watching his stream right now!');
						} else if (checkM(message, '!website')) {
								sayChan('Hi, ' + from + '! His website is codedigital.github.io');
						} else if (checkM(message, '!subtitles')) {
								sayChan('Hi, ' + from + '! DigitalData recently developed a tool allowing streamers to add live working subtitles to their streams. Check it out at codedigital.github.io/TwitchSubtitles');
						} else if (checkM(message, '!ryan')) {
								sayChan('Currently he is debating the need for capitalism with the communists.');
						} else if (checkM(message, '!matt')) {
								sayChan('Matt is standing behind you but you cannot see his brilliant disguise (hint: look for nearby trees).');
						} else if (checkM(message, '!dante')) {
								sayChan('Ocean Man incarnate and our local salt boi.');
						} else if (checkM(message, '!time')) {
								var nowTime = new Date();
								sayChan([nowTime.getDate() > 9 ? nowTime.getDate() : ("0" + '' + nowTime.getDate())] + "/" + [(nowTime.getMonth() + 1) > 9 ? (nowTime.getMonth() + 1) : ("0" + '' + (nowTime.getMonth() + 1))] + "/" + nowTime.getFullYear() + " - " + [nowTime.getHours() > 9 ? nowTime.getHours() : ("0" + '' + nowTime.getHours())] + ":" + [nowTime.getMinutes() > 9 ? nowTime.getMinutes() : ("0" + '' + nowTime.getMinutes())] + ":" + [nowTime.getSeconds() > 9 ? nowTime.getSeconds() : ("0" + '' + nowTime.getSeconds())]);
						} else if (checkM(message, '!illuminati')) {
								sayChan('I am not permitted to speak about this. TheIlluminati TheIlluminati TheIlluminati ');
						} else if (checkM(message, '!luke')) {
								sayChan('Just your average everyday genius. The alter ego to !buke');
						} else if (checkM(message, '!buke')) {
								sayChan('🅱UKE 🅱USSO. 🅱E 🅱RE🅱ARED 🅱OR 🅱IS 🅱RATH');
						} else if (checkM(message, '!anika')) {
								sayChan('Digital Data\'s sister who is secretly better than he is at anything. But don\'t tell him I said that.');
						} else if (checkM(message, '!carter')) {
								sayChan('Holy kappa. You\'ve done it this time. Hailing from \'Murica is the dude. The real dude.');
						} else if (checkM(message, '!help')) {
								sayChan('If you want to know what commands you can use, visit [WEBSITE LINK]');
						} else if (checkM(message, '!thx')) {
								sayChan('Thx Fam This Is Life.');
						} else if (checkM(message, '!specs')) {
								sayChan('Currently DigitalData is running a GTX 970 (MSI Gaming 4G) with an Intel I7 3770K, 16GB of RAM and a bunch of Hard Drives.');
						} else if (checkM(message, '!gear')) {
								sayChan('Gear List: ' +
										'His Mouse is a Logitech G900 Chaos Spectrum. ' +
										'His Keyboard is a Ducky ONE with Cherry MX Greens. ' +
										'His Headphones are the Audio Technica ATH-M50X\'s. ' +
										'His Microphone is the Blue Yeti Pro. ' +
										'His Mouse Mat is the Asus ROG Sheath (The Largest One).');
						} else if (checkM(message, '!recursive') & checkMod(from)) {
								if (!annoyed) {
										recursive = setTimeout(function () {
												sayChan('Recursive? Maybe you meant:');
												sayChan('!recursion');
												recursionLoop = true;
										}, 5500);
								} else {
										annoyed = false;
								}
						} else if (checkM(message, '!stop')) {
								if (recursive != null) {
										annoyed = true;
										clearTimeout(recursive);
								}
								sayChan('Alright, I\'ll stop. LUL ');
						} else if (checkM(message, '!endpoll')) {
								poll['length'] = 0;
								isPolling = false;
								endPoll();
								sayChan('Poll Ended!');
						} else if (checkM(message, '!poll')) {
								if (checkMod(from)) {
										if (!isPolling && !poll['started']) {
												isPolling = true;
												pollData = 1;
												pollingMod = from;
												console.log(pollingMod);
												sayChan('Enter Poll Name');
										} else {
												sayChan('A poll has already been started. Wait until it ends.');
										}
								} else {
										sayChan('You do not have permission to do this...');
								}
						} else if (isPolling) {
								if (from === pollingMod) {
										if (pollData === 1) {
												poll['name'] = message;
												console.log(poll['name']);
												sayChan('How many options to this poll?');
												pollData = 2;
										} else if (pollData === 2) {
												poll['optionsAmt'] = message;
												console.log(poll['optionsAmt']);
												sayChan('Enter the ' + poll['optionsAmt'] + ' Options one by one.');
												pollData = 3;
										} else if (pollData === 3) {
												var pollOptions = poll['options'];
												pollOptions.push(message);
												poll['optionsCount'].push(0);
												poll['options'] = pollOptions;
												poll['optionsAmt'] -= 1;
												sayChan('Option ' + countOptions + ': ' + message);
												countOptions += 1;
												if (poll['optionsAmt'] === 0) {
														console.log(poll['options']);
														sayChan('Enter the length (in seconds) of the poll.');
														pollData = 4;
												}
										} else if (pollData === 4) {
												poll['length'] = message;
												console.log(poll['length']);
												sayChan('The Poll Has Begun');
												sayChan('"' + poll['name'] + '"');
												sayChan('Enter either the option or the number of the option as shown below:');
												var optionsArray = poll['options'];
												for (var i = 0; i < optionsArray.length; i++) {
														sayChan(' ' + (i + 1) + ' - ' + optionsArray[i]);
												}
												pollData = 0;
												isPolling = false;
												poll['started'] = true;
												startPoll();

										}
								}
						} else if (poll['started']) {
								var optionsArray = poll['options'];
								var addIndex;
								var inPoll = false;
								for (var i = 0; i < optionsArray.length; i++) {
										if (checkM(message, ((i + 1) + ''))) {
												addIndex = i;
												inPoll = true;
												break;
										}
										if (checkM(message, optionsArray[i])) {
												addIndex = i;
												inPoll = true;
												break;
										}
								}
								if (inPoll) {
										if (!hasVoted(from)) {
												var optionsCount = poll['optionsCount'];
												optionsCount[addIndex] += 1;
												poll['optionsCount'] = optionsCount;
												poll['voted'].push(from);
										} else {
												sayChan(from + "! You have already Voted, Fam.")
										}
								}
						}
				}
		}

		function startPoll() {
				var counter = 0;
				var x = setInterval(function () {
						counter += 1;
						if (counter === 10) {
								sayChan('Don\'t forget to vote on  the poll "' + poll['name'] + '"!');
								sayChan('Enter either the option or the number of the option as shown below:');
								var optionsArray = poll['options'];
								for (var i = 0; i < optionsArray.length; i++) {
										sayChan(' ' + (i + 1) + ' - ' + optionsArray[i]);
								}
								counter = 0;
						}
						if (poll['length'] <= 0) {
								poll['started'] = false;
								var maxIndex = 0;
								var optionsCount = poll['optionsCount'];
								for (var i = 0; i < optionsCount.length; i++) {
										if (optionsCount[maxIndex] > optionsCount[i]) {
										} else {
												maxIndex = i;
										}
								}
								var optionsArray = poll['options'];
								console.log('Winner of the Poll: "' + optionsArray[maxIndex] + '" with ' + optionsCount[maxIndex] + ' Vote(s).');
								sayChan('Winner of the Poll: "' + optionsArray[maxIndex] + '" with ' + optionsCount[maxIndex] + ' Vote(s).');
								//alert('Winner of the Poll: "' + optionsArray[maxIndex] + '" with ' + optionsCount[maxIndex] + ' Votes.');
								poll = ({
										'started': false,
										'name': '',
										'options': [],
										'optionsCount': [],
										'optionsAmt': 0,
										'length': 0,
										'winner': '',
										'voted': []
								});
								clearInterval(x);
						}
						poll['length'] -= 1;
				}, 5000);
		}

		function endPoll() {
				poll = ({
						'started': false,
						'name': '',
						'options': [],
						'optionsCount': [],
						'optionsAmt': 0,
						'length': 0,
						'winner': '',
						'voted': []
				});
				pollingMod = '';
		}

		function hasVoted(name) {
				var peopleVoted = poll['voted'];
				for (var i = 0; i < peopleVoted.length; i++) {
						if (peopleVoted[i] === name) {
								return true;
						}
				}
				return false;
		}

		function gotWhisper(from, message) {
				var now = new Date();
				if (now.getTime() - cooldownWhisper.getTime() >= 15000) {
						if (checkMod(from)) {
								cooldownWhisper = new Date();
						}
						if (checkM(message, '!hello')) {
								whisper(from, 'Hello World!');
						} else if (checkM(message, '!twitter')) {
								whisper(from, 'Hi, ' + from + '! His Twitter is  twitter.com/digitaldatagame');
						} else if (checkM(message, '!yt') || checkM(message, '!youtube')) {
								whisper(from, 'Hi, ' + from + '! His YouTube is youtube.com/digitaldatagame');
						} else if (checkM(message, '!who')) {
								whisper(from, 'I was created by DigitalData. You\'re watching his stream right now!');
						} else if (checkM(message, '!website')) {
								whisper(from, 'Hi, ' + from + '! His website is codedigital.github.io');
						} else if (checkM(message, '!subtitles')) {
								whisper(from, 'Hi, ' + from + '! DigitalData recently developed a tool allowing streamers to add live working subtitles to their streams. Check it out at codedigital.github.io/TwitchSubtitles');
						} else if (checkM(message, '!ryan')) {
								whisper(from, 'Currently he is debating the need for capitalism with the communists.');
						} else if (checkM(message, '!matt')) {
								whisper(from, 'Matt is standing behind you but you cannot see his brilliant disguise (hint: look for nearby trees).');
						} else if (checkM(message, '!dante')) {
								whisper(from, 'Ocean Man incarnate and our local salt boi.');
						} else if (checkM(message, '!time')) {
								var nowTime = new Date();
								whisper(from, [nowTime.getDate() > 9 ? nowTime.getDate() : ("0" + '' + nowTime.getDate())] + "/" + [(nowTime.getMonth() + 1) > 9 ? (nowTime.getMonth() + 1) : ("0" + '' + (nowTime.getMonth() + 1))] + "/" + nowTime.getFullYear() + " - " + [nowTime.getHours() > 9 ? nowTime.getHours() : ("0" + '' + nowTime.getHours())] + ":" + [nowTime.getMinutes() > 9 ? nowTime.getMinutes() : ("0" + '' + nowTime.getMinutes())] + ":" + [nowTime.getSeconds() > 9 ? nowTime.getSeconds() : ("0" + '' + nowTime.getSeconds())]);
						} else if (checkM(message, '!illuminati')) {
								whisper(from, 'I am not permitted to speak about this. TheIlluminati TheIlluminati TheIlluminati ');
						} else if (checkM(message, '!luke')) {
								whisper(from, 'Just your average everyday genius. The alter ego to !buke');
						} else if (checkM(message, '!buke')) {
								whisper(from, '🅱UKE 🅱USSO. 🅱E 🅱RE🅱ARED 🅱OR 🅱IS 🅱RATH');
						} else if (checkM(message, '!anika')) {
								whisper(from, 'Digital Data\'s sister who is secretly better than he is at anything. But don\'t tell him I said that.');
						} else if (checkM(message, '!carter')) {
								whisper(from, 'Holy kappa. You\'ve done it this time. Hailing from \'Murica is the dude. The real dude.');
						} else if (checkM(message, '!help')) {
								whisper(from, 'If you want to know what commands you can use, visit [WEBSITE LINK]');
						} else if (checkM(message, '!thx')) {
								whisper(from, 'Thx Fam This Is Life.');
						} else if (checkM(message, '!specs')) {
								whisper(from, 'Currently DigitalData is running a GTX 970 (MSI Gaming 4G) with an Intel I7 3770K, 16GB of RAM and a bunch of Hard Drives.');
						} else if (checkM(message, '!gear')) {
								whisper(from, 'Gear List: ' +
										'His Mouse is a Logitech G900 Chaos Spectrum. ' +
										'His Keyboard is a Ducky ONE with Cherry MX Greens. ' +
										'His Headphones are the Audio Technica ATH-M50X\'s. ' +
										'His Microphone is the Blue Yeti Pro. ' +
										'His Mouse Mat is the Asus ROG Sheath (The Largest One).');
						}
				}
		}

		function sayChan(message) {
				client.say(('#' + channel), message);
		}

		function whisper(to, message) {
				client.say(('#' + channel), ('/w ' + to + ' ' + message));
		}

		function actChan(message) {
				client.action(('#' + channel), message);
		}

		function checkM(message, command) {
				return message.includes(command);
		}

		function checkMod(nick) {
				for (var i = 0; i < channelMods.length; i = i + 1) {
						//console.log(channelMods[i]);
						if (channelMods[i] == nick) {
								return true;
						}
				}
				return false;
		}
}

function disconnect(){
		client.disconnect(function () {
				console.log('Disconnected From IRC');
		});
		//var userEnded = true;
		userEnded = true;
		ws.terminate();
		clearTimeout(retryErrorOver);
		console.log('Disconnected From WS');
}
