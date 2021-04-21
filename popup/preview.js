configs.$loaded.then(({style, ...customs}) => {
	if (style !== 'custom') {
		const link = document.createElement('link')
		link.rel = 'stylesheet'
		link.type = 'text/css'
		link.href = '/resources/stylesheet/themes/' + style + '.css'
		document.head.appendChild(link)
	} else {
		const styleEl = document.createElement('style')
		styleEl.innerHTML = `
			body { 
				color: #${customs.text};
				background-color: #${customs.background};
			}
			a {
				color: #${customs.link};
			}
			`
		document.head.appendChild(styleEl)
	}
})

