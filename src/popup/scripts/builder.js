// https://github.com/aesarab/contextual-wiktionary/
'use strict';
export { define };
import { WORDURL, main, humanize } from "./definitions.js";
import { populateDefinition, populateHeader, populateLine, createLangHeader, createSlider } from "./html.js";
import { getDefinitions } from "./json.js";
import { csrunner, expand } from "./languageAutoscroll.js";

async function define(query) {
	// translation is an array like [{partofspeect{},definitions:[definition:{},definition:{}]}]

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

	const {definitions, translations, meta} = await getDefinitions(query);

	// Build the popup
	if (meta.query !== query) {
		populateHeader(`${humanize(meta.query)}`, `Open "${humanize(meta.query)}" in a new tab`, `${WORDURL(meta.query)}`);
	}
	let parent = main;
	switch(true) {
		case !meta.definitions:
			console.log("!meta.definitions");
			definitionsBuilder(definitions, main);
		break;
		case meta.engDefs:
			console.log("meta.engDefs");
			definitionsBuilder(definitions, main);
		case (meta.engDefs && meta.otherLang):
			console.log("meta.engDefs && meta.otherLang");
			main.appendChild(createSlider());
			parent = document.getElementById('slider');
		case meta.otherLang: // Fall-through to build other languages
			console.log("meta.otherLang", meta.otherLang);
			populateLine("No English definitions found", "h3", main);
			otherLangBuilder(translations, parent);
			csrunner(); // Add onclick handlers for language headings.
			scrollToAutoScroll(definitions, meta);
		break;
	}
}

function definitionsBuilder(data, element) {
	for (const definition of data) {
		populateDefinition(definition, element);
	}
}

function otherLangBuilder(definitions, parent) {
	const { en, ...translations } = definitions; // Weird syntax ik, it removes en from object translations
	for (const language in translations) {
		createLangHeader(language, parent);
		for (const translation of translations[language]) {
			populateDefinition(translation, parent);
		}
	}
}

function scrollToAutoScroll(definitions, meta) {
	const hash = window.location.hash.slice(1);
	const e = document.getElementById(hash);
	if ( hash && e ) {
		// Anchor is in use.
		expand();
		e.classList.add('auto-scrolled')
		setTimeout(() => { // TODO Remove this delay if you can.
			e.scrollIntoView({
				behavior: 'smooth'
			})}, 300)
	} else if (meta.defsButNotEnglish) {
		// Finally, open the "other languages" box if English had no definitions.
		expand();
	}
}
