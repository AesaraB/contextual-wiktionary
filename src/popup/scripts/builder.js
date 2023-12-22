// https://github.com/aesarab/contextual-wiktionary/
'use strict';
export { define };
import { WORDURL, main } from "./definitions.js";
import { populateDefinition, populateHeader, populateLine, createLangHeader, createSlider, transformLink } from "./html.js";
import { getDefinitions } from "./json.js";
import { csrunner } from "./languageAutoscroll.js";

async function define(query) {
	// Don't search if the query is empty
	if (query === null || query.match(/^ *$/)) { 
		console.log("popup: no definition");
		await populateHeader({ content: "Wiktionary", params: { extLink: { title: "Open Wiktionary.org in a new tab", href: "https://en.wiktionary.org/" }, mainPage: true }});
		document.getElementById("searchInput").focus();
		return
	}

	// Quick things to do before getting the definitions
	const { history } = await browser.storage.local.get("history");
	console.log("popup: definining", query);
	main.innerHTML = '';
	populateHeader({ content: query })

	// Getting the definitions
	const {engDefs, otherDefs, error, meta} = await getDefinitions(query);

	await populateHeader({ content: meta.query, params: { history: history, definitionPage: true }})
	const currHistory = await updateHistory(history, meta);
	if (meta.query !== query) { // Check if the query has changed
		console.log("popup: query has changed from \""+query+"\" to \""+meta.query+"\"");
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

async function updateHistory(history, meta) {
	if (meta.hasDefs) {
		if (history.includes(meta.query)) {
			history.splice(history.indexOf(meta.query), 1);
		} if (await history.length === 4) {
			history.splice(0,1);
		} 
		history.push(meta.query);
		browser.storage.local.set({ history: history });
		return history
	}
}

function scrollToAutoScroll(parent) {
	const hash = window.location.hash.slice(1);
	const e = document.getElementById(hash);
	if ( hash && e ) { // Anchor is in use.
		e.classList.add("autoScrolled")
		if (parent) { parent.setAttribute("open", "") };
		// I really don't like this delay
		setTimeout(() => { e.scrollIntoView({ behavior: 'smooth' })}, 100)
	}
}
