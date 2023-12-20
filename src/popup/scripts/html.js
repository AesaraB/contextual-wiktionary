'use strict';
export { populateDefinition, populateHeader, populateLine, createLangHeader, createSlider };
import { EDITURL, langName, stripTags, link, searchInput } from "./definitions.js";
import { define } from "./builder.js";
import { expand } from "./languageAutoscroll.js";

function populateHeader(searchPlaceholder, extLinkTitle, extLinkHref, extendedParams) {
	if (extendedParams !== "noValue") {
		searchInput.value = `${searchPlaceholder}`;
	}
	searchInput.placeholder = `${searchPlaceholder}`;
	link.title = `${extLinkTitle}`;
	link.href = `${extLinkHref}`;
}

function populateLine(text, tag, parent) {
	const outer = document.createElement(tag);
	const inner = document.createTextNode(text);
	outer.appendChild(inner);
	if (parent) {
	parent.appendChild(outer);
	} else {
		return outer
	}
}

function createLangHeader(language, parent) {
	const langHeading = populateLine(langName.of(language), "h2");
	langHeading.id = '' + language;
	parent.appendChild(langHeading);
}

function populateDefinition(translation, parent) { // This function is responsible for populating the parent body.
	const definitions = translation.definitions;
	const partOfSpeech = translation.partOfSpeech;
	// This is mainly used as a heading to categorise definitions (as a noun, verb, adjective, etc). Also used when spitting out errors.
	if (partOfSpeech) {
		populateLine(partOfSpeech, "h3", parent);
	}
	// Definitions
	if (definitions) {
		const ol = document.createElement('ol');
		for (const definition of definitions) {
			const li = document.createElement('li');

			let frag = createFragment(definition.definition);
			li.appendChild(frag.content);

			if (definition.examples) { // definition used in a sentence
				const ul = document.createElement('ul');
				for (const example of definition.examples) {
					const li = document.createElement('li');
					frag = createFragment(example);
					li.appendChild(frag.content);
					ul.appendChild(li);
				}
				li.appendChild(ul);
			}
			ol.appendChild(li);
		}
		parent.appendChild(ol);
	}
}

// Add a button that opens up the rest of the translations
function createSlider() {
	const plusButton = document.createElement('button');
	const wrapper = document.createElement('div');
	const slider = document.createElement('div');
	slider.id = 'slider';
	slider.className = 'slider';
	slider.classList.toggle('closed');
	wrapper.className = 'slider-wrapper closed';
	plusButton.className = 'primary-color-button default-button';
	plusButton.id = 'languages-button';
	const plus = document.createTextNode('Other languages');
	plusButton.appendChild(plus);
	plusButton.onclick = expand;
	wrapper.appendChild(plusButton);
	wrapper.appendChild(slider);
	return wrapper;
}

// Create a chunk of useful html from string
function createFragment(content) {
	const frag = document.createElement('template');
	frag.innerHTML = stripTags(content);
	transform_links(frag);
	return frag;
}

// transform <a> elements of given document fragment
function transform_links(documentFragment) {
	documentFragment.content.querySelectorAll('a').forEach(transform_link);
}

// Chose to edit the href to "javascript:;" because... I had a good plan once. It's like that.
function transform_link(link) {
	// str = "/wiki/salutation heyo#English"  ---->  Array [ "/wiki/salutation heyo#", "salutation heyo" ]
	// let word = link.href.match(/\/wiki\/([\w\s]+)#?/)[1]

	// Using the title property instead.
	let word = link.title;
	// Replace spaces with underscores here. For Wiktionary.
	word = word.replace(/ /g, '_');
	// Bottom left indicator for link target. "javascript:;" is nicer than "MOZ-EXTENSION1231431___...."
	link.href = 'javascript:;';

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
