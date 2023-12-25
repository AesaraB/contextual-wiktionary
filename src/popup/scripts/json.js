export { getDefinitions };
import { HEADERS, SEARCHURL, DEFINITIONURL, normalize, humanize, titleCase } from "./definitions.js";

// Build the response
async function getDefinitions(query) {
	let { json, meta } = await searchQuery(query); // Want to know what's happening? console.log(json)
	const { en, error, ...otherDefs } = json;
	meta = metaObjects(meta, en, otherDefs);
	return { engDefs: en, otherDefs: otherDefs, error: error, meta: meta };
}

// Search Wiktionary for query definitions
async function searchQuery(query) {
	let json;
	let meta = { query: query, hasDefs: false };
	try {
		const response = await fetch(DEFINITIONURL(query), HEADERS); // Fetches query results from Wiktionary API
		if (!response.ok) {
			throw new Error(`${response.status}: ${response.statusText}`);
		} // Error on response not OK
		meta = Object.assign(meta, { hasDefs: true });
		json = await response.json();
	} catch (error) {
		//meta = Object.assign(meta, {error: error}); // Better error handling in future
		if (error.message.indexOf("404") !== -1) {
			// No definitions found
			const results = await searchRelated(query, meta);
			json = results.json;
			meta = results.meta;
		}
	}
	return { json: json, meta: meta };
}

// Search Wiktionary for related queries
async function searchRelated(query, meta) {
	let json;
	try {
		const response = await fetch(SEARCHURL(query), HEADERS); // If similar queries have results
		if (!response.ok) {
			throw new Error(`${response.status}: ${response.statusText}`);
		} // Error on response not OK
		json = await response.json();
	} catch (error) {}
	const searchResults = json[1];

	// Match alternate case of query
	const alternateCases = await alternateCaseQuery(searchResults, query, meta);
	if (alternateCases) {
		return alternateCases;
	}

	// Build the error message
	json = { error: [{ definitions: [] }] };
	const errorDefs = json.error[0].definitions;
	errorDefs.push({
		// Query not found
		definition: `The query <b>${humanize(query)}</b> has no definitions.`,
		examples: [
			"<i>Know what it means?</i>",
			`<a title="${humanize(query)}" class="link-actual" target="_blank" id="addWord">Submit it to the Wiktionary.</a>`,
		],
	});
	if (searchResults.length > 0) {
		// Find similar words
		errorDefs.push({
			definition: "Similar and related words",
			examples: searchResults.map((word) => `<a href="javascript:;" title="${normalize(word)}">${humanize(word)}</a>`),
		});
	}
	return { json: json, meta: meta };
}

async function alternateCaseQuery(searchResults, query, meta) {
	let newQuery;
	const titleCaseQuery = titleCase(query);
	const lowerCaseQuery = query.toLowerCase();
	switch (searchResults.find((element) => element)) {
		case titleCaseQuery:
			newQuery = titleCaseQuery;
			break;
		case lowerCaseQuery:
			newQuery = lowerCaseQuery;
			break;
	}
	if (newQuery) {
		meta = Object.assign(meta, { query: newQuery });
		const results = await searchQuery(newQuery);
		return results;
	}
}

function metaObjects(meta, definitions, translations) {
	// Definitions in English
	if (!definitions) {
		meta = Object.assign(meta, { hasEngDefs: false });
	} else {
		meta = Object.assign(meta, { hasEngDefs: true });
	}
	// Definitions in other languages
	if (Object.keys(translations).length >= 1) {
		meta = Object.assign(meta, { hasOtherDefs: true });
	} else {
		meta = Object.assign(meta, { hasOtherDefs: false });
	}
	return meta;
}
