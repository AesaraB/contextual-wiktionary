// Was gonna add this to wiktionary.org popup, but decided against that.
// That's why this was put in a separate file.
function csrunner() {
    /**
     * Adds the anchor gimmick to language headings
     */

    const els = document.querySelectorAll('#content h2[id]');

    const listener = e => {
        e.preventDefault();
        const x = document.querySelector('.auto-scrolled');
        if (x) {
            x.classList.remove('auto-scrolled')
        }
        if (e.target.id === configs._anchor) {
            configs._anchor = '';
            e.target.classList.remove('auto-scrolled')
        } else {
            configs._anchor = e.target.id;
            e.target.classList.add('auto-scrolled')
        }
        console.log('set anchor', e.target.id, configs)
    }
    els.forEach(el => {
        el.addEventListener('click', listener)
    })

}