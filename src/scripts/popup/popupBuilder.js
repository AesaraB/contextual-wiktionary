// https://github.com/aesarab/contextual-wiktionary/

'use strict';

// Prevents undesirable inputs from being translated.
function isUndesirable(str){
    return str === null || str.match(/^ *$/) !== null;
}

window.onload = () => { // First, tell defineSelection.js (background script) that the popup is initialised.
	browser.runtime.sendMessage({ok: true});
};

browser.runtime.onMessage.addListener((selectionText) => { //defineSelection.js replies with the selectionText.
	searchText = selectionText || '';
	undefinedBuilder(); // Call undefinedBuilder while definition is loading to prevent blank popup.
	searchValidation()
});

function searchValidation() { // Identify whether the searchText should be defined.
	switch (true) {
		case (isUndesirable(searchText)):
			undefinedBuilder();
			break;
		case (searchText.toUpperCase() !== searchText):  // Don't normalise strings that are written in allcaps (for acronyms).
			searchText = searchText.toLowerCase(); // This code normalises the searchText for translation.
			translate(normalize(searchText));
			break;
		default:
			undefinedBuilder();
			translate(normalize(searchText));
	}
}

function define(word) {
	searchText = `${word}`;
	
	if (isUndesirable(searchText)) {
		undefinedBuilder();
	}
	else {
	translate(searchText);
	}
}

function translate(searchText) {
	
	console.log('Defining', searchText);
	
	
	// PART ONE, GET THE API INFORMATION
	fetch(WIKTIONARYURL(searchText), { // Fetches Wiki dictionary (Wiktionary) meaning for selected word.
		method: 'GET',
		headers: new Headers({
			'Api-User-Agent': `Context_Menu_Dictionary_Firefox_extension/1.0; (${HOMEPAGE}; ${MYEMAIL})`,
			redirect: true,
		}),
	})

	.then((res) => { // Did we get a response from the site?
		if (res.ok) {
			return res.json();
		} else {
			throw new Error('' + res.status + ': ' + res.statusText);
		}
	})
	

    // PART TWO NO DEFINITIONS FOUND
	.then((res) => { // This section is for words with defintions, but not in English.	
		translations = res;
		if (!translations.en) {
			translations.en = [
				{
					partOfSpeech: 'No English definition found.',
				},
			];
		}
	})
		

    
    .catch(async (e) => { 
        let alternate404Spellings

        if (translations == null) { // This section is for words with no definitions whatsoever.
            translations = {};
        }

        // Different spellings.
        if (e.message.indexOf('404') !== -1) {
            const searchResults = await fetch(SEARCHURL(searchText))
                .then((res) => (res.ok && res.json()) || {})
                .catch(() => ({}));
            const found = searchResults[1] || [];
            
            switch(true) {
                case(!found.length == 0):
                    alternate404Spellings = {
                        definition: 'Similar and related words',
                        examples: found.map(
                            (word) =>
                                `<a href="javascript:;" title="${normalize(word)}">${humanize(word)}</a>`
                        ),
                };
                    break;
                default:
                    alternate404Spellings = {
                        definition: 'No similar or related words found',
                        examples: found.map(
                            (word) =>
                                `<a href="javascript:;" title="${normalize(word)}">${humanize(word)}</a>`
                        ),
                    };
            }
        }

        translations.en = [
            {
                partOfSpeech: e.name,
                definitions: [
                    {
                        definition: `The word <b>${humanize(searchText)}</b> was not found.`,
                        examples: [
                            '<i>Know what it means?</i>',
                            `<a title="${humanize(
                                searchText
                            )}" class="link-actual" target="_blank" id="addWord">Submit it to the Wiktionary.</a>`,
                        ],
                    },
                    alternate404Spellings,
                ],
            },
        ];
    })
    
    
    // PART FOUR, POPUP BUILDER.
    .then(definitionBuilder, sliderStuff)
    .catch((e) =>
        console.error(`error in fetch chain wiktionary: ${e}, ${e.lineNumber}`)
    );
}

function undefinedBuilder() { // This script runs when searchText is blank.
	if(isUndesirable(searchText)) {
		searchPlaceholder = `Wiktionary`;
	}
	else {
		searchPlaceholder = `${humanize(searchText).toLowerCase()}`;
	}
	
	extLinkTitle = `Open Wiktionary.org in a new tab`;
	extLinkHref = `https://en.wiktionary.org/`;
	
	document.body.innerHTML = '';
	populateHeader(searchPlaceholder, extLinkTitle, extLinkHref);
	populateFooter();
	
	if(isUndesirable(searchText)) {
		document.getElementById('searchInput').focus();
	}
}


function definitionBuilder() {    
    document.body.innerHTML = '';
    
    // Search Button
    searchPlaceholder = `${humanize(searchText)}`;
    // External Link Button
    extLinkTitle = `Open '${humanize(searchText)}' in a new tab`;
    extLinkHref = WORDURL(searchText);
    
    populateHeader(searchPlaceholder, extLinkTitle, extLinkHref);

    // English translations:
    // translation is an array like [{partofspeect{},definitions:[definition:{},definition:{}]}]
    for (const translation of translations.en) {
        add(translation, document.body);
    }

    // Check that there is something to put under the expander.
    // aka. Check that there are other translations.
    if (Object.keys(translations).length > 1) {
        document.body.appendChild(createSlider());
    }
    populateFooter()
}

function sliderStuff() {
    populateSlider();
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
    } else if (translations.en[0].definitions == null) {
        // Finally, open the "other languages" box if English had no definitions.
        // This case only happens if English had no translations thus "translations.en" was touched on in the third ".then" clause.
        expand();
    }

}