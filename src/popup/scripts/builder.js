// https://github.com/aesarab/contextual-wiktionary/
'use strict';
export { define };
import { WORDURL, main, humanize } from "./definitions.js";
import { populateDefinition, populateHeader, populateLine, createLangHeader, createSlider } from "./html.js";
import { getDefinitions } from "./json.js";
import { csrunner } from "./languageAutoscroll.js";

async function define(query) {
	// Don't search if the query is empty
	if (query === null || query.match(/^ *$/)) { 
		console.log("popup: no definition");
		populateHeader("Wiktionary", "Open Wiktionary.org in a new tab", "https://en.wiktionary.org/", "noValue");
		document.getElementById("searchInput").focus();
		return
	}

	// Quick things to do before getting the definitions
	console.log("popup: definining", query);
	main.innerHTML = '';
	populateHeader(`${humanize(query)}`, `Open "${humanize(query)}" in a new tab`, `${WORDURL(query)}`);

	const {engDefs, otherDefs, error, meta} = await getDefinitions(query);
	if (meta.query !== query) { // Check if the query has changed
		console.log("popup: query has changed from \""+query+"\" to \""+meta.query+"\"");
		populateHeader(`${humanize(meta.query)}`, `Open "${humanize(meta.query)}" in a new tab`, `${WORDURL(meta.query)}`);
	}

	// Build the popup
	switch(true) {
		case !meta.hasDefs: {
			console.log("popup: query has no definitions");
			populateLine({ tag: "h3", content: "No definitions found", parent: main });
			definitionsBuilder(error, main);
			break;
		}
		case meta.hasOtherDefs: {
			let otherDefsParent, otherLangParent;
			if (meta.hasEngDefs) { // (meta.engDefs && meta.otherLang)
				console.log("popup: query has defifnitions in English and other languages");
				definitionsBuilder(engDefs, main);
				createSlider(main);
				otherDefsParent = document.getElementById('otherDefsContainer');
				otherLangParent = document.getElementById('otherLangContainer');
			} else { // (!meta.engDefes && meta.otherLang)
				console.log("popup: query has defifnitions in non-English languages");
				populateLine({ tag: "h3", content: "No English definitions found", parent: main });
				otherDefsParent = main;
			}
			translationsBuilder(otherDefs, otherDefsParent);
			csrunner(); // Add onclick handlers for language headings.
			scrollToAutoScroll(otherLangParent);
			break;
		}
		case meta.hasEngDefs: {
			console.log("popup: query has English definitions");
			definitionsBuilder(engDefs, main);
			break;
		}
	}
}

function definitionsBuilder(data, element) {
	for (const definition of data) {
		populateDefinition(definition, element);
	}
}

function translationsBuilder(otherDefs, parent) {
	for (const language in otherDefs) {
		createLangHeader(language, parent);
		for (const translation of otherDefs[language]) {
			populateDefinition(translation, parent);
		}
	}
}

function scrollToAutoScroll(parent) {
	const hash = window.location.hash.slice(1);
	const e = document.getElementById(hash);
	if ( hash && e ) { // Anchor is in use.
		if (parent) { parent.setAttribute("open", "") };
		// I really don't like this delay
		setTimeout(() => { e.scrollIntoView({ behavior: 'smooth' })}, 100)
	}
}
