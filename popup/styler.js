configs.$loaded.then(({style, fsize, spacing, margin, ...customs}) => {

	const globalStyle = document.createElement('style')
	globalStyle.innerHTML = `
	body {
		font-size: ${fsize}em;
	}
	li {
		line-height: ${spacing};
	}
	ol > li {
		margin-top: ${margin}em;
	}
	`
	document.head.appendChild(globalStyle);

	if (style !== 'custom') {
		const link = document.createElement('link')
		link.rel = 'stylesheet'
		link.type = 'text/css'
		link.href = style + '.css'
		document.head.appendChild(link)
	} else {
		const styleEl = document.createElement('style')
		styleEl.innerHTML = `
			body { 
				color: #${customs.text};
				background-color: #${customs.background};
			}
			a:any-link {
				color: #${customs.link};
			}
			`
		document.head.appendChild(styleEl)
	}
})

