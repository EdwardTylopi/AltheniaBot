const Discord = require("discord.js")
const bot = new Discord.Client()

bot.login("NDYzODA5NTIzOTEyODAyMzQ1.DkKZzQ.yVX59OAu9ow2vepns1dBwh4N42U")

bot.on("ready", function(message)
{
	bot.user.setActivity("Althenia", {type: "WATCHING"})
	.catch(console.error);
})

bot.on("message", function(message)
{
	if (message.content == "tic")
	{
		message.reply("tac")
		message.channel.send("tac")
	}
})

bot.on("guildMemberAdd", function(member)
{
	member.createDM().then(function(channel)
	{
		return channel.send("Bienvenue ;)"+member.displayName)
	}).catch(console.error)
})
