const Discord = require("discord.js");
let bot = new Discord.Client();
let prefix = "/";

bot.on("ready",() => {
	console.log("Bot ready");
});

bot.login("NDYzODA5NTIzOTEyODAyMzQ1.DkKZzQ.yVX59OAu9ow2vepns1dBwh4N42U");

bot.on("message", message => {
	if (message.content == "tic")
	{
		message.reply("tac");
		console.log("Tic => Tac");
	} else if (message.content == prefix+"help")
	{
		message.channel.sendMessage("Les commandes :\n/help\ntic");
		console.log("/help");
	} else
	{}
});
