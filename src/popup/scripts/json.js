'use strict';
export { getDefinitions };
import { HEADERS, SEARCHURL, DEFINITIONURL, normalize, humanize, titleCase } from "./definitions.js";

async function getDefinitions(query) {
	let { json, meta } = await searchQuery(query);
	let { en, ...translations } = json;
	let definitions = json.en;
	meta = metaObjects(meta, definitions, translations);
	console.log("meta: ", meta);
	return {definitions: definitions, translations: translations, meta: meta};
}

async function searchQuery(query) {
	let json;
	let meta = {query: query};
	try {
		const response = await fetch(DEFINITIONURL(query), HEADERS); // Fetches query results from Wiktionary API
		if (!response.ok) { throw new Error('' + response.status + ': ' + response.statusText) }; // Error on response not OK
		meta = Object.assign(meta, {definitions: true});
		json = await response.json();
	} catch(error) {
		if (error.message.indexOf('404') !== -1) { // No definitions found
			meta = Object.assign(meta, {definitions: false});
			let results = await searchRelated(meta, query);
			json = results.json;
			meta = results.meta;
		}
	}
	return { json: json, meta: meta };
}

async function searchRelated(meta, query) {
	let json;
	try {
		const response = await fetch(SEARCHURL(query), HEADERS); // If similar queries have results
		if (!response.ok) { throw new Error('' + response.status + ': ' + response.statusText) }; // Error on response not OK
		json = await response.json();
	} catch(error) {};

	const searchResults = json[1]; // If the query has a match in title case.
	let similarResults;

	const titleCaseQuery = titleCase(query)
	if (searchResults.find((element) => element === titleCaseQuery)) {
		meta = Object.assign(meta, {query: titleCaseQuery});
		const results = await searchQuery(titleCaseQuery);
		return results;
	}
		
	if (!searchResults.length == 0) {
		similarResults = {
			definition: 'Similar and related words',
			examples: searchResults.map( (word) =>
				`<a href="javascript:;" title="${normalize(word)}">${humanize(word)}</a>`
			),
		};
	} else {
		similarResults = {
			definition: 'No similar or related words found',
			examples: searchResults.map( (word) =>
				`<a href="javascript:;" title="${normalize(word)}">${humanize(word)}</a>`
			),
		};
	}

	json = {};
	json.en = [{ // Let's use the string builder instead pls
		partOfSpeech: "Definition not found",
		definitions: [
			{
				definition: `The word <b>${humanize(query)}</b> was not found.`,
				examples: [
					'<i>Know what it means?</i>',
					`<a title="${humanize(query)}" class="link-actual" target="_blank" id="addWord">Submit it to the Wiktionary.</a>`,
				],
			},
			similarResults,
		]
	}];
	return {json: json, meta: meta};
}

function metaObjects(meta, definitions, translations) {
	// Definitions in English
	if (!definitions) { // This one is busted
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
