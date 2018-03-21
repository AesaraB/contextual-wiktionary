configs.$loaded.then(({style, ...customs}) => {
	if (style !== "custom") {
		let link = document.createElement('link')
		link.rel = "stylesheet"
		link.type = "text/css"
		link.href = style + ".css"
		document.head.appendChild(link)
	} else {
		let styleEl = document.createElement('style')
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

