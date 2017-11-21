
const normalize = word => word.trim().replace(/ /g, "_").toLowerCase()
const WIKTIONARYURL = word => `https://en.wiktionary.org/api/rest_v1/page/definition/${normalize(word)}`



const HOMEPAGE = `https://github.com/losnappas/Context-menu-dictionary`
const MYEMAIL = `hanu6@hotmail.com`
// const HOMEPAGE = `testing`
// const MYEMAIL = `testing`
const ALLOWED_TAGS = "<b><i><u><strong>"

browser.contextMenus.create({
  id: "Wiktionary",
  title: "Wiktionary",//browser.i18n.getMessage("contextMenuItem"),
  contexts: ["selection"]
})

/*
	Fetches Wiki dictionary (Wiktionary) meaning for selected word.
	Wiktionary gives <b> and <i> etc tags too.
*/
function translate ( onClickData, tab ) {
	
	let selectionText = onClickData.selectionText
	/*
		If Wiktionary had 0 ping this addon could glitch out by trying to append the translation before
		the popup is open.
	*/
	// let wait = ms => new Promise(resolve => setTimeout(resolve, ms))

	let translations

	//Start by opening popup to make sure it is open when it is needed.
	//This is FF57+.
	browser.browserAction.openPopup()


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
		if (res.en) {
			translations = res.en
		} else {
			throw new Error("No English translation found.")
		}
	})
	.catch( e => {
		console.error(e, e.name, e.message )
		translations = [
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
	// .then( () => wait(100) )
	// Grab reference to the popup
	.then( () => browser.extension.getViews({type: "popup"}) )
	.then( popup => {

		popup = popup[0].document

		//Heading3: the selected word Capitalized Like This
		let heading = popup.createElement("h3")

		//https://stackoverflow.com/questions/2332811/capitalize-words-in-string
		let headingText = popup.createTextNode( selectionText.replace(/(^|\s)\S/g, l => l.toUpperCase()) )

		heading.appendChild( headingText )
		popup.body.appendChild( heading )

		// translation is an array like [{partofspeect{},definitions:[definition:{},definition:{}]}] 
		for (let translation of translations) {

			let definitions = translation.definitions

				

			let partOfSpeech = translation.partOfSpeech

			// noun/verb/etc
			if (partOfSpeech) {
				let p = popup.createElement("p")
				let t = popup.createTextNode( partOfSpeech )
				p.appendChild( t )
				popup.body.appendChild( p )
			}

			if (definitions) {
				//definitions
				let ol = popup.createElement("ol")
				for ( let definition of definitions ) {

					// last min change: p is misnamed-
					let p = popup.createElement("li")

					// let t = popup.createTextNode( definition.definition )
					// p.appendChild(t)
					p.innerHTML += strip_tags(definition.definition)

					ol.appendChild(p)

					if ( definition.examples ) {
						let ul = popup.createElement("ul")
						
						//definition used in a sentence
						for ( let example of definition.examples ) {
							let li = popup.createElement("li")

							li.innerHTML += strip_tags(example)
							// let t = popup.createTextNode( example )
							// li.appendChild( t )
							ul.appendChild( li )
						}
					
						ol.appendChild( ul )
					}
				}
				popup.body.appendChild( ol )

			}
		}

	})
	.catch( e => console.error(`error in fetch chain wiktionary: ${e}`) )



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



browser.contextMenus.onClicked.addListener(translate)


