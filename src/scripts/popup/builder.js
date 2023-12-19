// https://github.com/aesarab/contextual-wiktionary/
'use strict';
export { define };
import { WORDURL, main, humanize } from "./definitions.js";
import { populateHeader, populateDefinition, createSlider, expand } from "./html.js";
import { getDefinitions } from "./json.js";
import { csrunner } from "./languageAutoscroll.js";

async function define(query) {
	// translation is an array like [{partofspeect{},definitions:[definition:{},definition:{}]}]

	// Don't search if the query is empty
	if (query === null || query.match(/^ *$/)) { 
		populateHeader("Wiktionary", "Open Wiktionary.org in a new tab", "https://en.wiktionary.org/");
		document.getElementById("searchInput").focus();
		return
	}

	// Quick things to do before getting the definitions
	console.log('Defining', query);
	main.innerHTML = '';
	populateHeader(`${humanize(query)}`, `Open "${humanize(query)}" in a new tab`, `${WORDURL(query)}`);

	let definitions = await getDefinitions(query);
	// Build definitions
	definitionsBuilder(definitions.en, main);

	// Only list definitions in other languages if they exist.
		if (Object.keys(definitions).length > 1) {
			main.appendChild(createSlider());
			sliderBuilder(definitions);
		}
	// Add onclick handlers for language headings.
		csrunner();
	const hash = window.location.hash.slice(1);
	const e = document.getElementById(hash);
	if ( hash && e ) {
		// Anchor is in use.
			expand();
		e.classList.add('auto-scrolled')
		setTimeout(() => {
			e.scrollIntoView({
				behavior: 'smooth'
			})}, 300)
	} else if (definitions.en[0].definitions == null) {
		// Finally, open the "other languages" box if English had no definitions.
			// This case only happens if English had no definitions thus "definitions.en" was touched on in the third ".then" clause.
			expand();
	}
}

function definitionsBuilder(data, element) {
	for (const definition of data) {
		populateDefinition(definition, element);
	}
}

function sliderBuilder(translations) {
	const slider = document.getElementById('slider');
	if (slider && !slider.firstChild) {
		// Loop through different languages.
			// alternative was for..in, I guess? for..of even?
			Object.keys(translations).forEach((language) => {
				// English translation already exists.
					if (language !== 'en') {
						// Using this to make language header not appear a thousand times.
							let prevLang;
						for (const translation of translations[language]) {
							populateDefinition(translation, slider, translation.language !== prevLang);
							prevLang = translation.language;
						}
					}
			}); //for
	} //if
}
