const Discord = require("discord.js")
const bot = new Discord.Client()
const Mysql = require("mysql")
const Express = require("express")
const app = Express()

const prefix = process.env.prefix
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
	let args = command.content.split(" ")
	console.log(args)
	//commandes
	for(let i = 0; i < commands.length; i++)
	{
		let commands_name = commands[i].command.toLowerCase()
		if(args[0].toLowerCase() === prefix+commands_name)
		{
			if(commands[i].command_delete)
			{
				command.delete(commands[i].command_delete_time)
			}
			//reply
			if(commands[i].reply)
			{
				command.reply(commands[i].reply_content)
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
				command.channel.send(commands[i].message_content)
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
				command.author.send(commands[i].private_content)
				.then(function(messageReply)
				{
					if(commands[i].private_delete)
					{
						messageReply.delete(commands[i].private_delete_time)
					}
				})
			}
			return
		} else if(args[0].toLowerCase() === prefix+"update")
		{
			updateDatabase()
			command.delete(0)
			command.channel.send("Base de données mis à jour...")
			.then(function(messageReply)
			{
				messageReply.delete(5000)
			})
			return
		}
	}
	return
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
