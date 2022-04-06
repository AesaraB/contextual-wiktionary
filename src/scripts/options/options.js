var options = new Options(configs)

const reloadIFrame = () => document.querySelector('iframe').contentWindow.location.reload()

configs.$addObserver(reloadIFrame)