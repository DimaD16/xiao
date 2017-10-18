const { Command } = require('discord.js-commando');
const { stripIndents } = require('common-tags');
const { verify } = require('../../util/Util');

module.exports = class KickCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'kick',
			aliases: ['kickke'],
			group: 'moderation',
			memberName: 'kick',
			description: 'Kicks a user.',
			guildOnly: true,
			clientPermissions: ['KICK_MEMBERS'],
			userPermissions: ['KICK_MEMBERS'],
			args: [
				{
					key: 'member',
					prompt: 'What member do you want to kick?',
					type: 'member'
				},
				{
					key: 'reason',
					prompt: 'What do you want to set the reason as?',
					type: 'string',
					validate: reason => {
						if (reason.length < 140) return true;
						return 'Invalid reason, please keep the reason under 140 characters.';
					}
				}
			]
		});
	}

	async run(msg, { member, reason }) {
		if (member.id === msg.author.id) return msg.say('I don\'t think you want to kick yourself...');
		if (member.id === msg.guild.ownerID) return msg.say('Don\'t you think that might be betraying your leader?');
		if (!member.kickable) return msg.say('This member is not kickable. Perhaps they have a higher role than me?');
		if (member.highestRole.position > msg.member.highestRole.position - 1) {
			return msg.say('Your roles are too low to kick this member.');
		}
		await msg.say(`Are you sure you want to kick ${member.user.tag} (${member.id})?`);
		const verification = await verify(msg.channel, msg.author);
		if (!verification) return msg.say('Aborting.');
		try {
			await member.send(stripIndents`
				You were kicked from ${msg.guild.name} by ${msg.author.tag}!
				**Reason**: ${reason}
			`);
		} catch (err) {
			await msg.say('Failed to send DM.');
		}
		try {
			await member.kick(`${msg.author.tag}: ${reason}`);
		} catch (err) {
			return msg.say(`Failed to kick ${member.user.tag}: \`${err.message}\`.`);
		}
		return msg.say(`Successfully kicked ${member.user.tag}.`);
	}
};
