/*
 * all commands must be prefixed with the following or they will be ignored
 */
var commandPrefix = '';


var sbot = require('slackbots');
var slackBotConfig = require('./slackbotConfig.json');



var StartSlackBot = function(configuration, executeFn) {


    /*
     * array of slack group team configs:
     * can connect the bot to multiple teams, can also provide each team with different params
     */


    Object.keys(configuration).forEach(function(k) {
        slackBotConfig[k] = configuration[k];

    });

    var SlackBotConfigs = [
        slackBotConfig.slackGroup
    ];


    console.log('Starting SlackBot');


    var startBot = function(bot, options) {

        var users;

        var config = {
            admin: false
        };



        var chats = [];



        bot.on('start', function() {

            var getSender = function(messageData) {


                /**
                 * try to respond to user in the users direct chat channel
                 */


                /**
                 * check for match in direct chat channels
                 */
                var chat;
                for (var i = 0; i < chats.length; i++) {
                    chat = chats[i];

                    if (messageData.channel === chat.channel) {
                        return chat.name;
                    }
                }

                /**
                 * if that didn't work check for name of sender and use that to get users chat channel
                 */
                var user;
                for (var i = 0; i < users.length; i++) {
                    user = users[i];

                    if (messageData.user === user.id) {
                        return user.name;
                        return function(responseText, params, callback) {
                            bot.postMessageToUser(user.name, responseText, params, callback);
                        }

                    }
                }

                return false;
            };

            var getRespondFn = function(messageData) {

                /**
                 * try to respond to user in the users direct chat channel
                 */


                /**
                 * check for match in direct chat channels
                 */
                var sender = getSender(messageData);

                if (sender !== false) {

                    return function(responseText, params, callback) {
                        bot.postMessageToUser(sender, responseText, params, callback);
                    }
                }


                return function(responseText, params, callback) {
                    console.log(responseText);
                    console.log(params);
                    callback();
                }

            };


            //console.log(bot);

            if (options) {
                Object.keys(options).forEach(function(k) {
                    console.log(bot.team.name + ' [' + k + '] = ' + options[k]);
                    config[k] = options[k];
                });
            }


            console.log('Successfully Connected To: ' +
                bot.team.name);

            bot.getChannels().then(function(list) {

                console.log(bot.team.name + ' Channels: ' + JSON.stringify(list.map(function(a) {
                    return a.name;
                }), null, " "));


            });


            bot.getUsers().then(function(list) {

                //console.log(JSON.stringify(list, null, " "));
                users = list.members;



                console.log(bot.team.name + ' Users: ' + JSON.stringify(users.map(function(u) {

                    if (u.name === 'bot.docker') {
                        //console.log(bot.team.name + ' Self: ' + JSON.stringify(u, null, "   "));
                    }

                    return u.name;
                }), null, " "));

                console.log(bot.team.name + ' Building Private Message Map');
                users.forEach(function(u) {

                    bot.getChatId(u.name).then(function(r) {

                        chats.push({
                            name: u.name,
                            id: u.id,
                            channel: r

                        });
                    });
                });

            });


            var one = false;

            bot.on('message', function(data) {

                if ((!data.type) || data.type !== 'message') {
                    return;
                }

                var sender = data.username || false;
                console.log(' sender ' + sender);
                if (sender === options.name || sender === bot.self.name || sender === 'bot') {


                    console.log(data);
                    return;
                }



                if (data.text && (commandPrefix === "" || data.text.indexOf(commandPrefix) === 0)) {

                    var cmd = data.text.substring(commandPrefix.length);
                    console.log(data);


                    if (cmd.toLowerCase() === "exit") {
                        console.log(bot.ws._socket);
                        bot.ws._socket.end();
                        return;
                    }


                    try {
                        executeFn(cmd, getRespondFn(data), {
                            configuration: slackBotConfig,
                            data: data,
                            bot: bot
                        });

                    } catch (e) {
                        getRespondFn(data)('Error executing command:' + '```' + e + '```');
                    }


                }

            });

        }).on('error', function(e) {
            console.log('Closing socket on error: ' + e);
            bot.ws._socket.close();
        });



        return bot;

    };
    var makeBot = function(args) {

        var bot = (new sbot(args)).on('close', function() {
            setTimeout(function() {
                // Restart that bot after 10s
                makeBot(args);
            }, 10000);
        });
        startBot(bot, args)

    };

    SlackBotConfigs.forEach(function(args) {
        makeBot(args);
    });
}

module.exports = {
    Create: StartSlackBot
}