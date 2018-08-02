const Discord = require("discord.js")
const bot = new Discord.Client()

let prefix = "%"

bot.login(process.env.token)

bot.on("ready", function(message)
{
	bot.user.setActivity("les ordres", {type: "LISTENING"})
	.catch(console.error);
})

bot.on("message", function(message)
{
	if (message.content == prefix+"q")
	{
		message.delete(1000)
		message.reply("r")
		.then(function(message)
		{
			message.delete(2000)
		})
		message.channel.send("r")
		.then(function(message)
		{
			message.delete(3000)
		})
		message.author.send("r")
		.then(function(message)
		{
			message.delete(4000)
		})
	} else if (message.content == prefix+"stop")
	{
		bot.user.setActivity("Althenia", {type: "PLAYING"})
		message.delete()
		bot.destroy()
	}
})

bot.on("guildMemberAdd", function(member)
{
	member.createDM()
	.then(function(channel)
	{
		return channel.send("Bienvenue ;)"+member.displayName)
	}).catch(console.error)
})
