// This script loads the theme chosen in the config.
configs.$loaded.then(({style, fsize, spacing, margin, popupWidth, popupHeight, ...customs}) => {
	const globalStyle = new CSSStyleSheet();
	globalStyle.replaceSync(`
	body {
		font-size: ${fsize}em;
		max-width: ${popupWidth}px;
		max-height: ${popupHeight}px;
	}
	li {
		line-height: ${spacing};
	}
	ol > li {
		margin-top: ${margin}em;
	`);
	document.adoptedStyleSheets.push(globalStyle);

	if (style !== 'custom') {
		const link = document.createElement('link')
		link.rel = 'stylesheet'
		link.type = 'text/css'
		link.href = '/resources/stylesheet/themes/' + style + '.css'
		document.head.appendChild(link)
	} /* else {
		const styleEl = new CSSStyleSheet();
		styleEl.replaceSync(`
			body { 
				color: #${customs.text};
				background-color: #${customs.background};
			}
			a:any-link {
				color: #${customs.link};
			}
			`);
		document.adoptedStyleSheets.push(styleEl);
	} */
})

