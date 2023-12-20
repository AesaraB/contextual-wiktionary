'use strict';
export { getDefinitions };
import { HOMEPAGE, MYEMAIL, SEARCHURL, WIKTIONARYURL, normalize, humanize } from "./definitions.js";

async function getDefinitions(query) {
	let json;
	// Download the trtanslations
	try {
		const response = await fetch(WIKTIONARYURL(query), { // Fetches Wiki dictionary (Wiktionary) meaning for selected word.
			method: 'GET',
			headers: new Headers({
				'Api-User-Agent': `Context_Menu_Dictionary_Firefox_extension/1.4; (${HOMEPAGE}; ${MYEMAIL})`,
				redirect: true,
			}),
		})
		if (!response.ok) {
			throw new Error('' + response.status + ': ' + response.statusText); }
		json = await response.json();
	} catch(error) { // No definitions found
		if (error.message.indexOf('404') !== -1) {
			json = {};
			json = await searchRelated(json, query);
		}
	}
	let { en, ...translations } = json;
	let definitions = json.en;
	let meta = metaObjects(definitions, translations);

	return {definitions: definitions, translations: translations, meta: meta};
}

function metaObjects(definitions, translations) {
	let meta = {}
	// Definitions in English
	if (!definitions) {
		meta = Object.assign(meta, {engDefs: false})
	} else {
		meta = Object.assign(meta, {engDefs: true})
	}
	// Definitions in other languages
	if (Object.keys(translations).length >= 1) {
		meta = Object.assign(meta, {otherLang: true})
	} else {
		meta = Object.assign(meta, {otherLang: false})
	}
	return meta;
}

async function searchRelated(definitions, query) {
	let alternate404Spellings
	const searchResults = await fetch(SEARCHURL(query))
		.then((res) => (res.ok && res.json()) || {})
		.catch(() => ({}));
	const found = searchResults[1] || []; // If similar queries have results

	if (!found.length == 0) {
		alternate404Spellings = {
			definition: 'Similar and related words',
			examples: found.map( (word) =>
				`<a href="javascript:;" title="${normalize(word)}">${humanize(word)}</a>`
			),
		};
	} else {
		alternate404Spellings = {
			definition: 'No similar or related words found',
			examples: found.map( (word) =>
				`<a href="javascript:;" title="${normalize(word)}">${humanize(word)}</a>`
			),
		};
	}
	definitions.en = [{
		partOfSpeech: "Definition not found",
		definitions: [
			{
				definition: `The word <b>${humanize(query)}</b> was not found.`,
				examples: [
					'<i>Know what it means?</i>',
					`<a title="${humanize(query)}" class="link-actual" target="_blank" id="addWord">Submit it to the Wiktionary.</a>`,
				],
			},
			alternate404Spellings,
		]
	}];
	return definitions;
}
