var SlackBot = require('../slackbot.js');


var shell = require('child_process');



SlackBot.Create(require('./slackbotConfig.json'), function(cmd, respond, config) {

	console.log(cmd);


	shell.exec(cmd, {
		"shell": "/bin/bash"
	}, function(err, stdout, stderr) {


		if (err) {

			respond('```' + err + '```');
			console.log(`err: ${err}`);
		}



		if (stdout) {
			respond('```' + stdout + '```');
		}
		if (stderr) {
			respond('```' + stderr + '```');
		}

		console.log(`stdout: ${stdout}`);
		console.log(`stderr: ${stderr}`);



	});


});