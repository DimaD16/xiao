const Command = require('../../structures/Command');
const { MessageEmbed } = require('discord.js');
const { stripIndents } = require('common-tags');
const { reactIfAble } = require('../../util/Util');

module.exports = class PokedexCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'pokedex',
			aliases: ['pokemon', 'pokémon', 'pokédex'],
			group: 'search',
			memberName: 'pokedex',
			description: 'Searches the Pokédex for a Pokémon.',
			clientPermissions: ['EMBED_LINKS'],
			credit: [
				{
					name: 'Pokémon',
					url: 'https://www.pokemon.com/us/',
					reason: 'Images, Original Game'
				},
				{
					name: 'PokéAPI',
					url: 'https://pokeapi.co/',
					reason: 'API'
				},
				{
					name: 'Serebii.net',
					url: 'https://www.serebii.net/index2.shtml',
					reason: 'Images'
				},
				{
					name: 'The Sounds Resource',
					url: 'https://www.sounds-resource.com/',
					reason: 'Cry Sound Effects (Gen 1-7)',
					reasonURL: 'https://www.sounds-resource.com/3ds/pokemonultrasunultramoon/'
				},
				{
					name: 'The Sounds Resource',
					url: 'https://www.sounds-resource.com/',
					reason: 'Cry Sound Effects (Gen 8)',
					reasonURL: 'https://www.sounds-resource.com/nintendo_switch/pokemonswordshield/'
				},
				{
					name: 'Pokémon Showdown',
					url: 'https://play.pokemonshowdown.com/',
					reason: 'Cry Sound Effects (Meltan and Melmetal)',
					reasonURL: 'https://play.pokemonshowdown.com/audio/cries/'
				}
			],
			args: [
				{
					key: 'pokemon',
					prompt: 'What Pokémon would you like to get information on?',
					type: 'string'
				}
			]
		});
	}

	async run(msg, { pokemon }) {
		try {
			const data = await this.client.pokemon.fetch(pokemon);
			if (!data) return msg.say('Could not find any results.');
			if (!data.typesCached) await data.fetchTypes();
			if (!data.chain.data.length) await data.fetchChain();
			const typesShown = data.varieties.filter(variety => variety.display);
			const embed = new MessageEmbed()
				.setColor(0xED1C24)
				.setAuthor(`#${data.displayID} - ${data.name}`, data.boxImageURL, data.serebiiURL)
				.setDescription(stripIndents`
					**${data.genus}**
					${data.entries[Math.floor(Math.random() * data.entries.length)]}
				`)
				.setThumbnail(data.spriteImageURL)
				.addField('❯ Types', typesShown.map(variety => {
					const showParens = variety.name && typesShown.length > 1;
					return `${variety.types.join('/')}${showParens ? ` (${variety.name})` : ''}`;
				}).join('\n'))
				.addField('❯ Evolution Chain', data.chain.data.map(pkmn => {
					if (Array.isArray(pkmn)) {
						return pkmn.map(pkmn2 => {
							const found = this.client.pokemon.get(pkmn2);
							if (found.id === data.id) return `**${found.name}**`;
							return found.name;
						}).join('/');
					}
					const found = this.client.pokemon.get(pkmn);
					if (found.id === data.id) return `**${found.name}**`;
					return found.name;
				}).join(' -> '));
			if (data.cry) {
				const connection = msg.guild ? this.client.voice.connections.get(msg.guild.id) : null;
				if (connection) {
					connection.play(data.cry);
					await reactIfAble(msg, this.client.user, '🔉');
				} else {
					const usage = this.client.registry.commands.get('join').usage();
					embed.setFooter(`Join a voice channel and use ${usage} to hear the Pokémon's cry.`);
				}
			}
			return msg.embed(embed);
		} catch (err) {
			return msg.reply(`Oh no, an error occurred: \`${err.message}\`. Try again later!`);
		}
	}
};
