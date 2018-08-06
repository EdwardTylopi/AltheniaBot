const Discord = require("discord.js")
const bot = new Discord.Client()
const Mysql = require("mysql")
const Express = require("express")
const app = Express()

const prefix = process.env.prefix
const charSpace = " "
let commands
let commandsGot = false

bot.login(process.env.token)

//database
let connection = Mysql.createPool({
	connectionLimit: 50,
	host: process.env.database_host,
	user: process.env.database_user,
	password: process.env.database_password,
	database: process.env.database_name
})

function updateDatabase()
{
	let empty = "Empty"
	commands = empty;
	connection.getConnection(function(error, tempConnect)
	{
		if(error)
		{
			tempConnect.release()
			console.error(error)
		} else {
			tempConnect.query("SELECT * FROM altbot", function(error, rows, fields)
			{
				tempConnect.release()
				if(error)
				{
					console.error(error)
				} else {
					commands = rows;
					if(commands === empty)
					{
						console.error("No commands in database")
					} else {
						console.info("----------\nCommands :")
						for(let i = 0; i < commands.length; i++)
						{
							console.info(prefix+commands[i].command)
						}
						console.info("----------")
						commandsGot = true
					}
				}
			})
		}
	})
}

function placeArgument(argsFrom=undefined, argsTo=undefined)
{
	let result = argsTo.join(charSpace)
	argsFrom = argsFrom.slice(1)
	if(argsFrom.length >= 1)
	{
		for(let i = 0; i < argsTo.length; i++)
		{
			if(argsTo[i].match(/%arg([1-9]+[0-9]*)/i) != undefined)
			{
				//case %argsN
				let index = argsTo[i].match(/%arg([1-9]+[0-9]*)/i)[0].slice(4)
				result = result.replace("%arg"+[index], argsFrom[index-1])
			} else if(argsTo[i].match(/%args/i) != undefined)
			{
				//case %args
				result = result.replace(/%args/i, argsFrom.join(charSpace))
			} else if(argsTo[i].match(/%arg/i) != undefined)
			{
				//case %arg
				result = result.replace(/%arg/i, argsFrom[0])
			}
		}
	}
	return result
}

//bot
bot.on("ready", function(message)
{
	bot.user.setActivity("les ordres", {type: "LISTENING"})
	.catch(console.error);
	updateDatabase()
})

bot.on("message", async function(command)
{
	if(command.author.equals(bot.user) || !commandsGot) return
	let senderArgs = command.content.split(charSpace)
	//commandes
	for(let i = 0; i < commands.length; i++)
	{
		let commands_name = commands[i].command.split(charSpace)[0].toLowerCase()
		if(senderArgs[0].toLowerCase() === prefix+commands_name)
		{
			//command
			if(commands[i].command_delete)
			{
				command.delete(commands[i].command_delete_time)
			}
			//reply
			if(commands[i].reply)
			{
				let dbArgs = commands[i].reply_content.split(charSpace)
				command.reply(placeArgument(senderArgs, dbArgs))
				// command.reply(commands[i].reply_content)
				.then(function(messageReply)
				{
					if(commands[i].reply_delete)
					{
						messageReply.delete(commands[i].reply_delete_time)
					}
				})
			}
			//message
			if(commands[i].message)
			{
				let dbArgs = commands[i].message_content.split(charSpace)
				command.channel.send(placeArgument(senderArgs, dbArgs))
				// command.channel.send(commands[i].message_content)
				.then(function(messageReply)
				{
					if(commands[i].message_delete)
					{
						messageReply.delete(commands[i].message_delete_time)
					}
				})
			}
			//private
			if(commands[i].private)
			{
				let dbArgs = commands[i].private_content.split(charSpace)
				command.author.send(placeArgument(senderArgs, dbArgs))
				// command.author.send(commands[i].private_content)
				.then(function(messageReply)
				{
					if(commands[i].private_delete)
					{
						messageReply.delete(commands[i].private_delete_time)
					}
				})
			}
			return
		}
	}
	if(senderArgs[0].toLowerCase() === prefix+"update")
	{
		updateDatabase()
		command.delete(0)
		command.channel.send("Base de données mis à jour...")
		.then(function(messageReply)
		{
			messageReply.delete(5000)
		})
		return
	} else if(senderArgs[0].toLowerCase() === prefix+"poll")
	{
		for(let i = 0; i < senderArgs.length; i++)
		{
			if(senderArgs[i].startsWith("<:") && senderArgs[i].endsWith(">"))
			{
				let maybeEmoji = senderArgs[i].slice(2, -1)
				if(maybeEmoji.search(/([a-z0-9]+):[0-9]+/gi) == 0)
				{
					let emojiName = maybeEmoji.match(/[a-z0-9]+/gi)[0]
					senderArgs[i] = ":"+emojiName+":"
				}
			}
		}
		let question = senderArgs.slice(1).join(charSpace)
		let emojisList = ["✅", "❌"]
		let embed = new Discord.RichEmbed()
		.setColor("0xFF7F00")
		.setTitle("__Sondage__")
		.setURL("https://Althenia.fr")
		.setThumbnail("https://edwardtenhtml.000webhostapp.com/Althenia/althenia/file.logos/logo.png")
		.setDescription("_Répondre avec les **réactions**_")
		.addField("**"+question+"**", "✅ → **Oui** ;\n❌ → **Non**.", false)
		.setImage("https://cdn.discordapp.com/attachments/380068296193605632/475781634671771648/Poll_001.png")
		.setFooter("On attends vos réponses...")
		.setTimestamp()
		command.channel.send(embed)
		.then(function(messageReply)
		{
			// let emoji = bot.emojis.find("name", "Oui")
			// messageReply.react(emoji)
			messageReply.react(emojisList[0])
			.then(function(messageReaction)
			{
				messageReply.react(emojisList[1])
			})
			//messageReply.react("https://discordapp.com/assets/c6b26ba81f44b0c43697852e1e1d1420.svg")
		})
		command.delete(0)
		return
	} else if(senderArgs[0].toLowerCase() === prefix+"stop")
	{
		command.delete(1000)
		.then(function(messageDelete)
		{
			bot.user.setActivity("la fin...", {type: "WATCHING"})
			.then(function(osef)
			{
				bot.destroy()
				.then(function()
				{
					throw "Application stopped !"
				})
				.catch(function(error)
				{
					console.info(error)
				})
			})
		})
	} 
})

bot.on("guildMemberAdd", function(member)
{
	member.createDM()
	.then(function(channel)
	{
		return channel.send("Bienvenue ;)"+member.displayName)
	})
	.catch(console.error)
})
