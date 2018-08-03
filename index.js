const Discord = require("discord.js")
const bot = new Discord.Client()
const Mysql = require("mysql")
const Express = require("express")
const app = Express()

const prefix = process.env.prefix

bot.login(process.env.token)

//database
function updateDatabase()
{
	let connection = Mysql.createPool({
		connectionLimit: 50,
		host: process.env.database_host,
		user: process.env.database_user,
		password: process.env.database_password,
		database: process.env.database_name
	})

	let empty = "Empty"
	let commands = empty
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
					commands = rows
					if(commands === empty)
					{
						console.error("No commands in database")
					} else {
						console.info("Query :", commands)
					}
				}
			})
		}
	})
}
updateDatabase()

//bot
bot.on("ready", function(message)
{
	bot.user.setActivity("les ordres", {type: "LISTENING"})
	.catch(console.error)
})

bot.on("message", async function(command)
{
	if(command.author.equals(bot.user)) return
	let args = command.content.substring(prefix.length).split(" ")
	updateDatabase()
	//commandes
	for (let i = 0; i < commands.length; i++)
	{
		let commands_name = commands[i].command
		if(command.content.toLowerCase() === prefix+commands_name)
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
			//embed
			if(commands[i].embed)
			{
				command.channel.send(commands[i].embed_content, {
					embed:
					{
						color: commands[i].embed_property_color,
						author: commands[i].embed_property_author,
						title: commands[i].embed_property_title,
						fields:
						[{
							name: commands[i].embed_property_link_name,
							value: commands[i].embed_property_link_value,
							inline: commands[i].embed_property_link_inline
						}],
						footer: commands[i].embed_property_footer
					}
				})
				.then(function(messageReply)
				{
					if(commands[i].embed_delete)
					{
						messageReply.delete(commands[i].embed_delete_time)
					}
				})
			}
			return
		}
		// else if(command.content.toLowerCase() === prefix+"stop")
		// {
		// 	bot.user.setActivity("Althenia", {type: "PLAYING"})
		// 	command.delete(0)
		// 	bot.destroy()
		// 	.catch(console.error)
		// }
	}
	return
})

bot.on("guildMemberAdd", function(member)
{
	member.createDM()
	.then(function(channel)
	{
		return channel.send("Bienvenue ;) "+member.displayName)
	})
	.catch(console.error)
})
