'use strict';
export { populateDefinition, populateHeader, populateLine, createLangHeader, createSlider };
import { EDITURL, link, searchInput } from "./definitions.js";
import { define } from "./builder.js";
import { expand } from "./languageAutoscroll.js";
const ALLOWED_TAGS = '<b><i><u><strong><a><span><div><small>'; // Used to whitelist certain tags we want in our definitions.

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
	const langHeading = document.createElement('h2');
	langHeading.id = '' + language.replace(/ /g, '_');
	const lang = document.createTextNode(language);
	langHeading.appendChild(lang);
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
	frag.innerHTML = strip_tags(content);
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

//http://locutus.io/php/strings/strip_tags/
function strip_tags(input) {
	//  discuss at: http://locutus.io/php/strip_tags/
	// original by: Kevin van Zonneveld (http://kvz.io)
	// improved by: Luke Godfrey
	// improved by: Kevin van Zonneveld (http://kvz.io)
	//    input by: Pul
	//    input by: Alex
	//    input by: Marc Palau
	//    input by: Brett Zamir (http://brett-zamir.me)
	//    input by: Bobby Drake
	//    input by: Evertjan Garretsen
	// bugfixed by: Kevin van Zonneveld (http://kvz.io)
	// bugfixed by: Onno Marsman (https://twitter.com/onnomarsman)
	// bugfixed by: Kevin van Zonneveld (http://kvz.io)
	// bugfixed by: Kevin van Zonneveld (http://kvz.io)
	// bugfixed by: Eric Nagel
	// bugfixed by: Kevin van Zonneveld (http://kvz.io)
	// bugfixed by: Tomasz Wesolowski
	// bugfixed by: Tymon Sturgeon (https://scryptonite.com)
	//  revised by: Rafał Kukawski (http://blog.kukawski.pl)
	//   example 1: strip_tags('<p>Kevin</p> <br /><b>van</b> <i>Zonneveld</i>', '<i><b>')
	//   returns 1: 'Kevin <b>van</b> <i>Zonneveld</i>'
	//   example 2: strip_tags('<p>Kevin <img src="someimage.png" onmouseover="someFunction()">van <i>Zonneveld</i></p>', '<p>')
	//   returns 2: '<p>Kevin van Zonneveld</p>'
	//   example 3: strip_tags("<a href='http://kvz.io'>Kevin van Zonneveld</a>", "<a>")
	//   returns 3: "<a href='http://kvz.io'>Kevin van Zonneveld</a>"
	//   example 4: strip_tags('1 < 5 5 > 1')
	//   returns 4: '1 < 5 5 > 1'
	//   example 5: strip_tags('1 <br/> 1')
	//   returns 5: '1  1'
	//   example 6: strip_tags('1 <br/> 1', '<br>')
	//   returns 6: '1 <br/> 1'
	//   example 7: strip_tags('1 <br/> 1', '<br><br/>')
	//   returns 7: '1 <br/> 1'
	//   example 8: strip_tags('<i>hello</i> <<foo>script>world<</foo>/script>')
	//   returns 8: 'hello world'
	// making sure the allowed arg is a string containing only tags in lowercase (<a><b><c>)
	let allowed = ALLOWED_TAGS;
	allowed = (
		((allowed || '') + '').toLowerCase().match(/<[a-z][a-z0-9]*>/g) || []
		).join('');
	var tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;
	var commentsAndPhpTags = /<!--[\s\S]*?-->|<\?(?:php)?[\s\S]*?\?>/gi;
		var before = input;
	var after = input;
	// recursively remove tags to ensure that the returned string doesn't contain forbidden tags after previous passes (e.g. '<<bait/>switch/>')
	while (true) {
		before = after;
		after = before
			.replace(commentsAndPhpTags, '')
			.replace(tags, function ($0, $1) {
				return allowed.indexOf('<' + $1.toLowerCase() + '>') > -1 ? $0 : '';
		});
		// return once no more tags are removed
		if (before === after) {
			return after;
		}
	}
}
