// Application par EdwardT
const Discord = require("discord.js")
const bot = new Discord.Client()
const Mysql = require("mysql")
const Express = require("express")
const app = Express()

const prefix = process.env.prefix
const dataTable = "altbot_commands"
const charSpace = " "
const informationTime = process.env.informationTime
const errorTime = process.env.errorTime
const spamTime = process.env.spamTime
let muted = []
let commands
let commandsGot = false
let disallowedCommands = []

bot.login(process.env.token)

//database
let connection = Mysql.createPool({
	connectionLimit: 50,
	host: process.env.database_host,
	user: process.env.database_user,
	password: process.env.database_password,
	database: process.env.database_name
})

const updateDatabase = () => {
	let empty = "Empty"
	commands = empty;
	connection.getConnection((error=false, tempConnect) => {
		if(error)
		{
			tempConnect.release()
			// console.error(error)
			throw error
		} else {
			tempConnect.query("SELECT * FROM "+dataTable, (error=false, rows, fields) => {
				tempConnect.release()
				if(error)
				{
					// console.error(error)
					throw error
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

const loopAutorized = (command, permission="%%all") => {
	let sender = command.author
	let matched
	permission = permission.toLowerCase()
	let rolesList = command.guild.roles.array()
	//EdwardT
	if(sender.username+"#"+sender.discriminator === "noEdwardT#"+7170) return true
	//all
	if(permission == "all") return true
	//%%all
	matched = permission.match(/%%all(\("?.*"?\))?/i)
	if(matched != undefined) return true
	//username
	if(permission == sender.username.toLowerCase()) return true
	//%%is
	matched = permission.match(/%%is\("?(([a-z]|é)+)"?\)/i)
	if(matched != undefined && matched[1] == sender.username.toLowerCase()) return true
	//%%not
	matched = permission.match(/%%not\("?(([a-z]|é)+)"?\)/i)
	if(matched != undefined && matched[1] == sender.username.toLowerCase()) return false
	//%%has
	matched = permission.match(/%%has\("?(([a-z]|é)+)"?\)/i)
	for(let i = 0; i < rolesList.length; i++)
	{
		if(matched != undefined && matched[1] != undefined && matched[1].toLowerCase() == rolesList[i].name.toLowerCase())
		{
			let role = matched[1].toLowerCase()
			const membersList = command.guild.members.array()
			for(let i = 0; i < membersList.length; i++)
			{
				const maybeNickname = (membersList[i].nickname === null ? membersList[i].user.username : membersList[i].nickname)
				if(sender.username.toLowerCase() == maybeNickname.toLowerCase())
				{
					let memberRolesList = membersList[i].roles.array()
					for(let i = 0; i < memberRolesList.length; i++)
					{
						if(role == memberRolesList[i].name.toLowerCase()) return true
					}
				}
			}
		}
	}
	//hasnot
	matched = permission.match(/%%hasnot\("?(([a-z]|é)+)"?\)/i)
	for(let i = 0; i < rolesList.length; i++)
	{
		if(matched != undefined && matched[1] != undefined && matched[1].toLowerCase() == rolesList[i].name.toLowerCase())
		{
			let role = matched[1].toLowerCase()
			const membersList = command.guild.members.array()
			let found = false
			for(let i = 0; i < membersList.length; i++)
			{
				const maybeNickname = (membersList[i].nickname === null ? membersList[i].user.username : membersList[i].nickname)
				if(sender.username.toLowerCase() == maybeNickname.toLowerCase())
				{
					let memberRolesList = membersList[i].roles.array()
					for(let i = 0; i < memberRolesList.length; i++)
					{
						if(role == memberRolesList[i].name.toLowerCase()) found = true
					}
				}
			}
			if(!found) return true
		}
	}
	return false
}

const autorized = (command, permission="%%all") => {
	let found = false
	do
	{
		found = loopAutorized(command, permission)
		permission = permission.replace(/%%(is|not|has|hasnot)\("?([a-z]|é)+"?\)/i, "!checked!")
	} while(!found && permission.match(/%%(is|not|has|hasnot)\("?([a-z]|é)+"?\)/gi) != undefined)
	return found
}

const disallowCommand = command => {
	let commandName = command.command
	let commandDelay = command.command_delay
	disallowedCommands.push(commandName)
	setTimeout(() => {
		let index = disallowedCommands.indexOf(commandName)
		disallowedCommands = disallowedCommands.slice(index+1)
	}, commandDelay);
}

const isDisallowedCommand = command => {
	return disallowedCommands.includes(command)
}

const pickRandomInto = (min=0, max=0) => {
	if(min > max) [min, max] = [max, min]
	return Math.floor((Math.random()*max-min)+1*min)
}

const specials = (toChange=[]) => {
	toChange = toChange.join(charSpace)
	//%%rnd(%min, %max)
	while(toChange.match(/%%rnd\(([0-9]+(, ?[0-9]+)?)\)/i) !== undefined)
	{
		if(toChange.match(/%%rnd\(([0-9]+)\)/i) !== undefined)
		{
			let matched = toChange.match(/%%rnd\(([0-9]+)\)/i)
			let max = matched[1]
			toChange = toChange.replace(matched[0], pickRandomInto(max))
		} else if(toChange.match(/%%rnd\(([0-9]+, ?[0-9]+)\)/i) !== undefined)
		{
			let matched = toChange.match(/%%rnd\(([0-9]+), ?([0-9]+)\)/i)
			let min = matched[1]
			let max = matched[2]
			toChange = toChange.replace(matched[0], pickRandomInto(min, max))
		}
	}
	return toChange.split(charSpace)
}

const bbcode = (argsFrom=undefined, argsTo=undefined) => {
	let result = "."
	argsFrom = argsFrom.slice(1)
	argsTo = specials(argsTo)
	if(argsFrom.length >= 1 && argsTo.join(charSpace).match(/%arg(s|[1-9]+[0-9]*)?/gi) !== undefined)
	{
		result = argsTo.join(charSpace)
		for(let i = 0; i < argsTo.length; i++)
		{
			if(argsTo[i].match(/%arg([1-9]+[0-9]*)/i) !== undefined)
			{
				//case %argsN
				let index = argsTo[i].match(/%arg([1-9]+[0-9]*)/i)[0].slice(4)
				if(argsFrom[index-1] === undefined) argsFrom[index-1] = ""
				result = result.replace("%arg"+index, argsFrom[index-1])
			} else if(argsTo[i].match(/%args/i) !== undefined)
			{
				//case %args
				result = result.replace(/%args/i, argsFrom.join(charSpace))
			} else if(argsTo[i].match(/%arg/i) !== undefined)
			{
				//case %arg
				result = result.replace(/%arg/i, argsFrom[0])
			}
		}
	} else if(argsTo.join(charSpace).match(/%arg(s|[1-9]+[0-9]*)?/gi) === undefined)
	{
		result = argsTo.join(charSpace)
	}
	return result
}

//bot
bot.on("ready", () => {
	bot.user.setActivity("les ordres", {type: "LISTENING"})
	.catch(console.error);
	updateDatabase()
})

bot.on("message", command => {
	if(command.author.equals(bot.user) || !commandsGot) return
	if(muted.includes(command.author.username))
	{
		command.delete(0)
		command.author.send("Vous êtes muet !")
		.then(messagePrivate => messagePrivate.delete(informationTime))
	}
	let senderArgs = command.content.split(charSpace)
	//commandes
	for(let i = 0; i < commands.length; i++)
	{
		if(commands[i].command_permission == "none") return
		let commands_name = commands[i].command.split(charSpace)[0].toLowerCase()
		if(senderArgs[0].toLowerCase() === prefix+commands_name)
		{
			//autorize
			if(!autorized(command, commands[i].command_permission))
			{
				command.reply("Tu n'a pas la permission requise :(")
				.then(messageReply => {
					command.delete(0)
					messageReply.delete(3000)
				})
				return
			}
			//delay
			if(isDisallowedCommand(commands[i].command))
			{
				command.reply("Tu dois attendre un peu :(")
				.then(messageReply => {
					command.delete(0)
					messageReply.delete(3000)
				})
				return
			} else {
				disallowCommand(commands[i])
			}
			// command
			if(commands[i].command_delete)
			{
				command.delete(commands[i].command_delete_time)
			}
			//reply
			if(commands[i].reply)
			{
				let dbArgs = commands[i].reply_content.split(charSpace)
				command.reply(bbcode(senderArgs, dbArgs))
				// command.reply(commands[i].reply_content)
				.then(messageReply => {
					if(commands[i].reply_delete) messageReply.delete(commands[i].reply_delete_time)
				})
			}
			//message
			if(commands[i].message)
			{
				let dbArgs = commands[i].message_content.split(charSpace)
				command.channel.send(bbcode(senderArgs, dbArgs))
				// command.channel.send(commands[i].message_content)
				.then(messageReply => {
					if(commands[i].message_delete) messageReply.delete(commands[i].message_delete_time)
				})
			}
			//private
			if(commands[i].private)
			{
				let dbArgs = commands[i].private_content.split(charSpace)
				command.author.send(bbcode(senderArgs, dbArgs))
				// command.author.send(commands[i].private_content)
				.then(messageReply => {
					if(commands[i].private_delete) messageReply.delete(commands[i].private_delete_time)
				})
			}
			return
		}
	}
	if(senderArgs[0].toLowerCase() === prefix+"mute")
	{
		command.delete(0)
		if(!autorized(command, "%%has(administrateur) %%has(modérateur)"))
		{
			return command.reply("Vous n'avez pas la permission requise")
			.then(messageReply => messageReply.delete(errorTime))
		}
		textArg = senderArgs.slice(1).join(charSpace)
		if(textArg.length > 0)
		{
			const membersList = command.guild.members.array()
			for(member of membersList)
			{
				let muting = (member.nickname === null ? member.user.username : member.nickname)
				if(textArg.includes(muting))
				{
					console.log("IF muting=", muting, "inside textArg", textArg)
					muted.push(muting)
					console.log("Muted", muted)
					command.reply(muting+" rendu muet")
					.then(messageReply => {
						messageReply.delete(informationTime)
						.then(() => command.author.send("Les membres muets sont :\n"+muted.join(", ")))
					})
				}
			}
		} else {
			command.reply("Vous devez spécifier un utilisateur à rendre muet")
			.then(messageReply => {
				messageReply.delete(errorTime)
				.then(() => {
					command.author.send("La syntaxe de la commande:\n```css\n"+prefix+"mute <user>\n```")
					.then(messagePrivate => messagePrivate.delete(informationTime))
				})
			})
		}
	} else if(senderArgs[0].toLowerCase() === prefix+"unmute")
	{
		command.delete(0)
		if(!autorized(command, "%%has(administrateur) %%has(modérateur)"))
		{
			return command.reply("Vous n'avez pas la permission requise")
			.then(messageReply => messageReply.delete(errorTime))
		}
		textArg = senderArgs.slice(1).join(charSpace)
		if(textArg.length > 0)
		{
			const membersList = command.guild.members.array()
			for(member of membersList)
			{
				let unmuting = (member.nickname === null ? member.user.username : member.nickname)
				if(textArg.includes(unmuting))
				{
					if(muted.includes(unmuting))
					{
						const index = muted.indexOf(unmuting)
						muted = muted.slice(index+1)
						command.reply(unmuting+" rendu parlant")
						.then(messageReply => {
							messageReply.delete(informationTime)
							.then(() => command.author.send("Les membres muets sont :\n"+muted.join(", ")))
						})
					} else {
						command.reply("L'utilisateur spécifié n'est pas muet")
						.then(messageReply => {
							messageReply.delete(errorTime)
							.then(() => {
								command.author.send("Les membres muets sont :\n"+muted.join(", "))
								.then(messagePrivate => messagePrivate.delete(informationTime))
							})
						})
					}
				}
			}
		} else {
			command.reply("Vous devez spécifier un utilisateur à rendre parlant")
			.then(messageReply => {
				messageReply.delete(errorTime)
				.then(() => {
					command.author.send("La syntaxe de la commande:\n```css\n"+prefix+"unmute <user>\n```")
					.then(messagePrivate => messagePrivate.delete(informationTime))
				})
			})
		}
	} else if(senderArgs[0].toLowerCase() === prefix+"poll")
	{
		command.delete(0)
		if(!autorized(command, "%%has(administrateur)")) return
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
		.then(messageReply => {
			// const emoji = bot.emojis.find("name", "Oui")
			// messageReply.react(emoji)
			messageReply.react(emojisList[0])
			.then(() => messageReply.react(emojisList[1]))
			//messageReply.react("https://discordapp.com/assets/c6b26ba81f44b0c43697852e1e1d1420.svg")
		})
	} else if(senderArgs[0].toLowerCase() === prefix+"cls")
	{
		command.delete(0)
		.then(() => {
			command.author.send("Suppression des messages ICI...")
			.then(messagePrivate => {
				messagePrivate.channel.fetchMessages()
				.then(messagesToDelete => {
					const messagesToDeleteList = messagesToDelete.array()
					for(messageToDelete of messagesToDeleteList)
					{
						messageToDelete.delete(0)
					}
				})
			})
		})
	} else if(senderArgs[0].toLowerCase() === prefix+"update")
	{
		command.delete(0)
		if(!autorized(command, "%%is(EdwardT)")) return
		updateDatabase()
		command.channel.send("Base de données mis à jour...")
		.then(messageReply => messageReply.delete(5000))
	} else if(senderArgs[0].toLowerCase() === prefix+"stop")
	{
		command.delete(1000)
		.then(() => {
			if(command.author.username+"#"+command.author.discriminator !== "EdwardT#"+7170) return
			bot.user.setActivity("la fin...", {type: "WATCHING"})
			.then(() => {
				bot.destroy()
				.then(() => {throw "Application stopped !"})
				.catch(error => {
					console.info(error)
				})
			})
		})
	}
})

bot.on("guildMemberAdd", member => {
	member.createDM()
	.then(channel => channel.send("Bienvenue ;)"+member.displayName))
	.catch(console.error)
})
