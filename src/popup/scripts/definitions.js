'use strict';
export { EDITURL, SEARCHURL, WIKTIONARYURL, WORDURL, HOMEPAGE, MYEMAIL };
export { normalize, humanize, langName, stripTags };
export { link, main, search, searchInput };

// Wiktionary URLs
const EDITURL = (word) => `https://en.wiktionary.org/w/index.php?title=${word}&action=edit`;
const SEARCHURL = (word) => `https://en.wiktionary.org/w/api.php?action=opensearch&search=${word}&profile=engine_autoselect`; // This is used to find alternative searchText spellings
const WIKTIONARYURL = (word) => `https://en.wiktionary.org/api/rest_v1/page/definition/${word}`;
const WORDURL = (word) => `https://en.wiktionary.org/wiki/${word}`;

// User-agent information
const HOMEPAGE = `https://github.com/AesaraB/Contextual-Wiktionary`;
const MYEMAIL = `aesara@mailbox.org`;

// Quick functions
const langName = new Intl.DisplayNames(["en"], { type: "language" });
const normalize = (word) => word.normalize().trim().replace(/ /g, '_'); // Convert string to become compatible with the Wiktionary API. Don't conflate this with "humanize".
const humanize = (word) => word.trim().replace(/_/g, ' '); // This converts a Wiktionary API URL to format better suited for reading.

// elements
const main = document.getElementById("main");
const search = document.getElementById('search');
const searchInput = document.getElementById('searchInput');
const link = document.getElementById('externalLink');

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
