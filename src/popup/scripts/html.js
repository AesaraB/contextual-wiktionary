'use strict';
export { populateDefinition, populateHeader, populateLine, createLangHeader, createSlider, transformLink };
import { EDITURL, WORDURL, humanize, langName, stripTags, titleCase } from "./definitions.js";
import { extButton, header, historyContents, searchInput } from "./definitions.js";
import { define } from "./builder.js";

async function populateHeader(object) {
	header.classList.remove("definitionPage")
	searchInput.placeholder = `${humanize(object.content)}`;
	searchInput.value = `${humanize(object.content)}`;
	extButton.title = `Open "${humanize(object.content)}" in a new tab`;
	extButton.href = `${WORDURL(object.content)}`;
	if (object.params) {
		if (object.params.extLink) {
			extButton.title = (object.params.extLink.title);
			extButton.href = (object.params.extLink.href);
		} if (object.params.mainPage) {
			searchInput.value = "";
		} if (object.params.definitionPage) {
			header.classList.add("definitionPage")
		} if (object.params.history && object.params.history.length != 0) {
			header.classList.add("hasHistory")
			historyContents.innerHTML = "";
			for (const oldQuery of object.params.history) {
				if (object.params.history.length >= 2 && object.params.history[0] !== oldQuery) {
				populateLine({ tag: "span", content: ", ", parent: historyContents });
				}
				const oldQueryElement = populateLine({ tag: "a", content: humanize(oldQuery), attributes: { href: "javascript:void(0)" }, parent: historyContents });
				oldQueryElement.onclick = () => define(oldQuery);
			}
		} else {
			historyContents.innerHTML = "";
			const { patchNotesTimes } = await browser.storage.local.get("patchNotesTimes");
			let newTimes = patchNotesTimes;
			if (newTimes <= 5) {
				newTimes++
				browser.storage.local.set({ patchNotesTimes: newTimes });
				const { currentVersion } = await browser.storage.local.get("currentVersion");
				header.classList.add("hasHistory")
				populateLine({ tag: "span", content: `updated to ${currentVersion} `, parent: historyContents });
				const patchNotes = populateLine({ tag: "a", content: "(patch notes)", attributes: { href: `https://github.com/AesaraB/contextual-wiktionary/wiki/patch_notes#${currentVersion.replace(/\./g, '')}` }, parent: historyContents });
				patchNotes.onclick = () => {
					browser.storage.local.set({ patchNotesTimes: 6 });
				}
			}
		}
	}
	const headerSize = header.getBoundingClientRect();
	document.documentElement.setAttribute("style", `scroll-padding-top: ${Math.round(headerSize.height)}px;`);
}

function populateLine(object) {
	const outer = document.createElement(object.tag);
	if (object.content) {
		const inner = document.createTextNode(object.content);
		outer.appendChild(inner);
	} if (object.classes) {
		for (const className of object.classes) {
			outer.classList.add(className);
		}
	} if (object.id) {
		outer.id = object.id;
	} if (object.attributes) {
		for (const attribute in object.attributes) {
			outer.setAttribute(attribute, object.attributes[attribute]);
		}
	} if (object.parent) {
		object.parent.appendChild(outer);
	}
	return outer
}

function populateDefinition(translation, parent) { // This function is responsible for populating the parent body.
	const definitions = translation.definitions;
	const partOfSpeech = translation.partOfSpeech;
	// This is mainly used as a heading to categorise definitions (as a noun, verb, adjective, etc). Also used when spitting out errors.
	if (partOfSpeech) {
		populateLine({tag: "h3", content: partOfSpeech, parent: parent});
	}
	// Definitions
	if (definitions) {
		const ol = populateLine({tag: "ol", parent: parent });
		for (const definition of definitions) {
			const li = populateLine({tag: "li", parent: ol });
			let frag = createFragment(definition.definition);
			li.appendChild(frag.content);

			if (definition.examples) { // definition used in a sentence
				const ul = populateLine({tag: "ul", parent: li });
				for (const example of definition.examples) {
					const li = populateLine({ tag: "li", parent: ul });
					frag = createFragment(example);
					li.appendChild(frag.content);
				}
			}
		}
	}
}

// Create a chunk of useful html from string
function createFragment(content) {
	const frag = document.createElement('template');
	frag.innerHTML = stripTags(content);
	transform_links(frag);
	return frag;
}

// Add a button that opens up the rest of the translations
function createSlider(parent) {
	const details = populateLine({ tag: "details", id: "otherLangContainer", parent: parent });
	populateLine({ tag: "summary", content: "Other Languages", id: "langButton", classes: ["button", "rectangle"], parent: details })
	populateLine({ tag: "div", id: "otherDefsContainer", parent: details });
}

// Create the headers for other languages
function createLangHeader(language, parent) {
	const langContainer = populateLine({
		tag: "a",
		classes: ["langHeadingContainer"],
		id: '' + language,
		parent: parent,
		attributes: { href: "javascript:void(0)" }
	});
	populateLine({ tag: "h2", content: "#", parent: langContainer, classes: ["before"] });
	populateLine({ tag: "h2", content: langName.of(language), parent: langContainer, classes: ["lang"] });
	populateLine({tag: "h2", parent: langContainer, classes: ["after"] });
}

// transform <a> elements of given document fragment
function transform_links(documentFragment) {
	documentFragment.content.querySelectorAll('a').forEach(transformLink);
}

// Chose to edit the href to "javascript:;" because... I had a good plan once. It's like that.
function transformLink(link) {
	// str = "/wiki/salutation heyo#English"  ---->  Array [ "/wiki/salutation heyo#", "salutation heyo" ]
	// let word = link.href.match(/\/wiki\/([\w\s]+)#?/)[1]

	// Using the title property instead.
	let word = link.title;
	// Replace spaces with underscores here. For Wiktionary.
	word = word.replace(/ /g, '_');
	// Bottom left indicator for link target. "javascript:;" is nicer than "MOZ-EXTENSION1231431___...."
	link.href = "javascript:void(0)";

	// Original was not found -> this is the "open edit page" link
	if (link.id === 'addWord') {
		link.href = EDITURL(word);
		link.addEventListener('click', (e) => {
			e.preventDefault();
			browser.tabs.create({
				url: EDITURL(word),
			});
		});
	}
	// Sometimes wiktionary gives "Appendix:Glossary" like links, so
	// if (it isn't like that.) {
	else if (word != null && !/:/g.test(word)) {
		link.onclick = () => define(word);
	} else {
		// so it is like that
		// the link is not going to work
		link.removeAttribute('href');
		link.removeAttribute('title');
	}
}
