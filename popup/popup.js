"use strict"
// Keep it in uppercase if all the letters are in uppercase. This helps in case of acronyms like CE.
const normalize = word => word.trim().toUpperCase()===word.trim() ? word.trim() : word.trim().replace(/ /g, "_").toLowerCase()
const WIKTIONARYURL = word => `https://en.wiktionary.org/api/rest_v1/page/definition/${normalize(word)}`

// in ms. The timeout before scrolling lower again. 30 seems ok on my pc at least.
const SCROLLDOWNWAIT = 10


const HOMEPAGE = `https://github.com/losnappas/Context-menu-dictionary`
const MYEMAIL = `hanu6@hotmail.com`
// const HOMEPAGE = `testing`
// const MYEMAIL = `testing`
const ALLOWED_TAGS = "<b><i><u><strong>"

// Send message back indicating that the popup is now open & ready.
window.onload = () => {
	browser.runtime.sendMessage({ok: true})
}

var translations

// Background script responds with the selection text.
browser.runtime.onMessage.addListener( selectionText => {
	// let translations
	/*
		Fetches Wiki dictionary (Wiktionary) meaning for selected word.
		Wiktionary gives <b> and <i> etc tags too.
	*/
	fetch( WIKTIONARYURL(selectionText), 
	{
		method: "GET",
		headers: new Headers( {

			"Api-User-Agent": `Context_Menu_Dictionary_Firefox_extension/1.0; (${HOMEPAGE}; ${MYEMAIL})`,
			"redirect": true

		})
	})
	.then( res => {

		if (res.ok) {
			return res.json() 
		} else {
			throw new Error( "" + res.status + ": "+ res.statusText )
		}
	})
	.then( res => {
		//store result in upper scope
		translations = res
		if (!res.en) {
			throw new Error("No English meaning found. Try the + button below.")
		}
	})
	.catch( e => {
		// console.error(e, e.name, e.message )
		translations==null ? translations={} : translations
		translations.en = [
		{
			"partOfSpeech": e.name,
			"definitions": [
				{
					"definition": e.message
				},
				{
					"definition": "Word is probably not in the dictionary. If you know or find out what it means, then consider adding it."
				},
				{
					"definition": "https://en.wiktionary.org/"
				}
			]
		}
		]
	})
	.then( () => {

		// let popup = document

		//Heading3: the selected word Capitalized Like This
		let heading = document.createElement("h3")

		//https://stackoverflow.com/questions/2332811/capitalize-words-in-string
		let headingText = document.createTextNode( selectionText.replace(/(^|\s)\S/g, l => l.toUpperCase()) )

		heading.appendChild( headingText )
		document.body.appendChild( heading )

		// English translations:
		// translation is an array like [{partofspeect{},definitions:[definition:{},definition:{}]}] 
		for (let translation of translations.en) {

			add( translation, document.body )
		}


		// Add a button that opens up the rest
		let plusButton = document.createElement("button")
		let wrapper = document.createElement("div")
		let slider = document.createElement("div")
		
		slider.id = "slider"
		slider.className = "slider"
		slider.classList.toggle("closed")
		wrapper.className = "slider-wrapper closed"
		plusButton.className = "slider-button"
		plusButton.id = "plus-button"

		let plus = document.createTextNode('+')
		plusButton.appendChild( plus )

		plusButton.onclick = expand

		wrapper.appendChild( plusButton )

		wrapper.appendChild( slider )

		// Check that there is something to put under the expander.
		if ( Object.keys(translations).length <= 1 ){
			plusButton.disabled = true
		}
		document.body.appendChild( wrapper )


		// Add a footer so it's easier to distinguish document end.
		let footer = document.createElement("footer")
		footer.innerHTML += "<br/>https://en.wiktionary.org/"
		document.body.appendChild( footer )

	})
	.catch( e => console.error(`error in fetch chain wiktionary: ${e}, ${e.lineNumber}`) )

})

// Expander for the button
function expand () {
	// Check if content has already been added previously.
	if ( !slider.firstChild ) {

		// Loop through different languages.
		// How is this actually so painful? Really.?
		Object.keys( translations ).forEach( language => {

			// English translation already exists.
			if ( language !== 'en' ) {
				for ( let translation of translations[language] ) {
					add( translation, slider , true )
				}
			}


		})//for
	}//if

	if ( !slider.classList.toggle("closed") ) {
		// Scroll down with the expanding div
		scrollDown( 0, 0 )
	}
}


// Compare current height to next height. If they don't match, then re-scroll to bottom and go again. If they do, goto step 1 10 times to make this thing less glitchy.
function scrollDown ( cur, tries ) {
	// Scrolls down with the expanding div.
	if ( cur != document.body.scrollHeight ) {
		window.scrollTo( 0, document.body.scrollHeight )
		// Now this is lexical
		let x = document.body.scrollHeight
		setTimeout( () => scrollDown( x, 0 ) , SCROLLDOWNWAIT )
	} else if ( tries < 10 ) {
		setTimeout( () => scrollDown( cur, tries + 1 ) , SCROLLDOWNWAIT )
	}
}

// popup means context
function add ( translation, popup, addingExtra ) {

	
	let definitions = translation.definitions

	let partOfSpeech = translation.partOfSpeech

	if ( addingExtra ) {
		let language = translation.language
		if ( language ) {
			// Put a heading to indicate the language we're using now.
			let h5 = document.createElement("h4")
			let lang = document.createTextNode( language )
			h5.appendChild( lang )
			slider.appendChild( h5 )
		}
	}

	// noun/verb/etc
	if (partOfSpeech) {
		let p = document.createElement("p")
		let t = document.createTextNode( partOfSpeech )
		p.appendChild( t )
		popup.appendChild( p )
	}

	if (definitions) {
		//definitions
		let ol = document.createElement("ol")
		for ( let definition of definitions ) {

			// last min change: p is misnamed-
			let p = document.createElement("li")

			// let t = popup.createTextNode( definition.definition )
			// p.appendChild(t)
			p.innerHTML += strip_tags(definition.definition)

			ol.appendChild(p)

			if ( definition.examples ) {
				let ul = document.createElement("ul")
				
				//definition used in a sentence
				for ( let example of definition.examples ) {
					let li = document.createElement("li")

					li.innerHTML += strip_tags(example)
					// let t = popup.createTextNode( example )
					// li.appendChild( t )
					ul.appendChild( li )
				}
			
				ol.appendChild( ul )
			}
		}
		popup.appendChild( ol )

	}
}

//http://locutus.io/php/strings/strip_tags/
function strip_tags (input) { // eslint-disable-line camelcase
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
  let allowed = ALLOWED_TAGS
  allowed = (((allowed || '') + '').toLowerCase().match(/<[a-z][a-z0-9]*>/g) || []).join('')
  var tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi
  var commentsAndPhpTags = /<!--[\s\S]*?-->|<\?(?:php)?[\s\S]*?\?>/gi
  var before = input
  var after = input
  // recursively remove tags to ensure that the returned string doesn't contain forbidden tags after previous passes (e.g. '<<bait/>switch/>')
  while (true) {
    before = after
    after = before.replace(commentsAndPhpTags, '').replace(tags, function ($0, $1) {
      return allowed.indexOf('<' + $1.toLowerCase() + '>') > -1 ? $0 : ''
    })
    // return once no more tags are removed
    if (before === after) {
      return after
    }
  }
}


