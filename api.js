const screenshot = require('./lib/screenshot');
const sitemap = require('./lib/sitemap');
const initNginx = require('./lib/nginx');
const createDatabase = require('./lib/mongodb');
const git = require('./lib/git');


module.exports = { nginx: { init: initNginx }, git, mongo: { create: createDatabase } };
