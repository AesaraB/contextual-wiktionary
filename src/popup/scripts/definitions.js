export { EDITURL, SEARCHURL, DEFINITIONURL, WORDURL, HEADERS };
export { normalize, humanize, langName, stripTags, titleCase };
export { extButton, header, historyContents, main, search, searchInput };

// Wiktionary URLs
const EDITURL = (word) => `https://en.wiktionary.org/w/index.php?title=${word}&action=edit`;
const SEARCHURL = (word) => `https://en.wiktionary.org/w/api.php?action=opensearch&search=${word}&profile=engine_autoselect`; // This is used to find alternative searchText spellings
const DEFINITIONURL = (word) => `https://en.wiktionary.org/api/rest_v1/page/definition/${word}`;
const WORDURL = (word) => `https://en.wiktionary.org/wiki/${word}`;

// User-agent information
const HEADERS = {
	method: 'GET',
	headers: new Headers({
		'Api-User-Agent': `Context_Menu_Dictionary_Firefox_extension/1.4; ("https://github.com/AesaraB/Contextual-Wiktionary"; "aesara@mailbox.org")`,
		redirect: true,
	}),
}

// Quick functions
const langName = new Intl.DisplayNames(["en"], { type: "language" });
const normalize = (word) => word.normalize().trim().replace(/ /g, '_'); // Convert string to become compatible with the Wiktionary API. Don't conflate this with "humanize".
const humanize = (word) => word.trim().replace(/_/g, ' '); // This converts a Wiktionary API URL to format better suited for reading.

// elements
const header = document.getElementById("header");
const main = document.getElementById("main");
const search = document.getElementById('search');
const searchInput = document.getElementById('searchInput');
const extButton = document.getElementById('extButton');
const historyContents = document.getElementById('historyContents');

// https://locutus.io/php/strings/strip_tags/
const ALLOWED_TAGS = '<b><i><u><strong><a><span><div><small>'; // Used to whitelist certain tags we want in our definitions.
function stripTags (input) { // eslint-disable-line camelcase
	// making sure the allowed arg is a string containing only tags in lowercase (<a><b><c>)
	let allowed = ALLOWED_TAGS;
	allowed = (((allowed || '') + '').toLowerCase().match(/<[a-z][a-z0-9]*>/g) || []).join('')

	const tags = /<\/?([a-z0-9]*)\b[^>]*>?/gi
	const commentsAndPhpTags = /<!--[\s\S]*?-->|<\?(?:php)?[\s\S]*?\?>/gi

  let after = input;
	// removes tha '<' char at the end of the string to replicate PHP's behaviour
	after = (after.substring(after.length - 1) === '<') ? after.substring(0, after.length - 1) : after;

	// recursively remove tags to ensure that the returned string doesn't contain forbidden tags after previous passes (e.g. '<<bait/>switch/>')
	while (true) {
		const before = after;
		after = before.replace(commentsAndPhpTags, '').replace(tags, function ($0, $1) {
			return allowed.indexOf('<' + $1.toLowerCase() + '>') > -1 ? $0 : ''
		});
		// return once no more tags are removed
		if (before === after) {
			return after
		}
	}
}

/* To Title Case © 2018 David Gouch | https://github.com/gouch/to-title-case */
// eslint-disable-next-line no-extend-native
const titleCase = (string) => {
	const smallWords = /^(a|an|and|as|at|but|by|en|for|if|in|nor|of|on|or|per|the|to|v.?|vs.?|via)$/i
	const alphanumericPattern = /([A-Za-z0-9\u00C0-\u00FF])/
	const wordSeparators = /([ :–—-])/

	return string.split(wordSeparators)
		.map(function (current, index, array) {
			if (
				/* Check for small words */
				current.search(smallWords) > -1 &&
					/* Skip first and last word */
					index !== 0 &&
					index !== array.length - 1 &&
					/* Ignore title end and subtitle start */
					array[index - 3] !== ':' &&
					array[index + 1] !== ':' &&
					/* Ignore small words that start a hyphenated phrase */
					(array[index + 1] !== '-' ||
						(array[index - 1] === '-' && array[index + 1] === '-'))
			) {
				return current.toLowerCase()
			}

			/* Ignore intentional capitalization */
			if (current.substr(1).search(/[A-Z]|\../) > -1) {
				return current
			}

			/* Ignore URLs */
			if (array[index + 1] === ':' && array[index + 2] !== '') {
				return current
			}

			/* Capitalize the first letter */
			return current.replace(alphanumericPattern, function (match) {
				return match.toUpperCase()
			})
		})
		.join('')
}
