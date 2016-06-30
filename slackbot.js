/*
 * all commands must be prefixed with the following or they will be ignored
 */
var commandPrefix = '';


var sbot = require('slackbots');
var slackBotConfig = require('./slackbotConfig.json');

/*
 * array of slack group team configs:
 * can connect the bot to multiple teams, can also provide each team with different params
 */
var SlackBotConfigs = [
    slackBotConfig.slackGroup
];


var SlackBot = function(configuration, executeFn) {



    console.log('Starting SlackBot');


    var startBot = function(bot, options) {

        var users;

        var config = {
            admin: false
        };



        var chats = [];



        bot.on('start', function() {

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



            bot.on('message', function(data) {


                if (data.text && (commandPrefix === "" || data.text.indexOf(commandPrefix) === 0)) {

                    var cmd = data.text.substring(commandPrefix.length);



                    if (cmd.toLowerCase() === "exit") {
                        console.log(bot.ws._socket);
                        bot.ws._socket.end();
                        return;
                    }


                    try {
                        executeFn(data, cmd, getRespondFn(data), options);

                    } catch (e) {
                        getRespondFn(data)('Error executing command:' + '```' + e + '```');
                    }


                }

            });

        }).on('error', function(e) {
            console.log('Closing socket on error: ' + e);
            bot.ws._socket.close();
        });



        var getRespondFn = function(messageData) {

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
                    console.log('Responding To: ' + chat.name);
                    return function(responseText, params, callback) {
                        bot.postMessageToUser(chat.name, responseText, params, callback);
                    }
                }
            }

            /**
             * if that didn't work check for name of sender and use that to get users chat channel
             */
            var user;
            for (var i = 0; i < users.length; i++) {
                user = users[i];

                if (messageData.user === user.id) {
                    console.log('Responding To: ' + user.name);

                    return function(responseText, params, callback) {
                        bot.postMessageToUser(user.name, responseText, params, callback);
                    }

                }
            }

            return function(responseText, params, callback) {
                console.log(responseText);
                console.log(params);
                callback();
            }

        }

        return bot;

    };
    var makeBot = function(args) {

        (new sbot(args))
        .startBot(bot, args)
            .on('close', function() {
                setTimeout(function() {
                    // Restart that bot after 10s
                    makeBot(args);
                }, 10000);
            });
    };

    SlackBotConfigs.forEach(function(args) {
        makeBot(args);
    });
}

module.exports = {
    CreateBot: SlackBot
}