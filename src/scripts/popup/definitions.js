'use strict';
export { EDITURL, SEARCHURL, WIKTIONARYURL, WORDURL, HOMEPAGE, MYEMAIL };
export { normalize, humanize };
export { main, search, searchInput, link };

// Wiktionary URLs
const EDITURL = (word) => `https://en.wiktionary.org/w/index.php?title=${word}&action=edit`;
const SEARCHURL = (word) => `https://en.wiktionary.org/w/api.php?action=opensearch&search=${word}&profile=engine_autoselect`; // This is used to find alternative searchText spellings
const WIKTIONARYURL = (word) => `https://en.wiktionary.org/api/rest_v1/page/definition/${word}`;
const WORDURL = (word) => `https://en.wiktionary.org/wiki/${word}`;

// User-agent information
const HOMEPAGE = `https://github.com/AesaraB/Contextual-Wiktionary`;
const MYEMAIL = `aesara@mailbox.org`;

// query string modification 
const normalize = (word) => word.normalize().trim().replace(/ /g, '_'); // Convert string to become compatible with the Wiktionary API. Don't conflate this with "humanize".
const humanize = (word) => word.trim().replace(/_/g, ' '); // This converts a Wiktionary API URL to format better suited for reading.

// elements
const main = document.getElementById("main");
const search = document.getElementById('search');
const searchInput = document.getElementById('searchInput');
const link = document.getElementById('externalLink');
