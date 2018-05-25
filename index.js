#!/usr/bin/env node
'use strict';
const screenshot = require('./lib/screenshot');
const sitemap = require('./lib/sitemap');
const initNginx = require('./lib/nginx');
const createDatabase = require('./lib/mongodb');
const async = require('async');
const colors = require('colors');
const fs = require('fs');
var homeDir =  require('os').homedir();
const prompt = require('prompt');
let config;
let defaultConfig = {
  projectFolder :'/apps',
  nginxConfigFolder: '/etc/nginx/sites-enabled',
  nginxHost: '',
  portStartRange: 5000,
  mongoUrl: 'mongodb://root:toor@localhost:27017/admin'
}

// LOADING CONFIG
try{
  config = require(homeDir + '/.enyo.json');
}
catch (ex){
  console.log('This is your first install, please take a few seconds to configure your install'.cyan);
  config = defaultConfig;
  initConfig();

}


function initConfig(){
  prompt.get([
  {
    name: 'projectFolder',
    description: 'Where is the base folder for your apps code ?',
    default: config.projectFolder,
    type: 'string'
  },
  {
   name: 'nginxConfigFolder',
   description: 'Where is the base folder for your nginx virtual hosts ?',
   type: 'string',
   default: config.nginxConfigFolder,
 },
  {
   name: 'nginxHost',
   description: 'what\'s the host name of this server ? if provided all virtualhosts will be subdomains of this one. If you want to create absolute urls, dont provide it.',
   type: 'string',
   default: config.nginxHost,
 },
 {
   name: 'portStartRange',
   description: 'What is the lowest number we should start scanning for free port ?',
   type: 'integer',
   default: config.portStartRange,
 },
 {
   name: 'mongoUrl',
   description: 'What is the mongo url for db connexion (mongodb://user:pass@host:27017/<authentication-database>',
   type: 'string',
   default: config.mongoUrl,
 }
 ], function (err, result) {
  if(result){
    fs.writeFileSync(homeDir + '/.enyo.json', JSON.stringify(result));

    console.log('YOUR CONFIG IS NOW', result);
  }
});
}



const argsList = require('yargs')
.help('help').alias('-h','help')
.command('init', 'Set the config for a better app generation', (yargs) => {
}, (args) =>{
  initConfig()
})



.command('mongocreate <dbName>', 'create a database and user in mongo', (yargs) => {
  yargs.positional('dbName', {
    describe: '- the database name',
  })
  .option('user', {
    describe: 'the username of the database created'
  })
  .option('pass', {
    alias: 'p',
    describe: 'the password of the database created'
  });
}
, argv => {
  createDatabase(argv.dbName, argv, config);
})


.command('nginx <name>', 'init a nginx repo', (yargs) => {

  yargs.positional('name', {
    describe: '- the subdomain name',
  })
  .option('type', {
    default: 'php',
    describe: 'the type of app (php / html / proxy). use html for buidled angular projects, and proxy for nodejs projects'
  })
  .option('port', {
    describe: 'the port of the app (only for type proxy)'
  })
  .option('git', {
    describe: 'The url of the remote repository',
  })
  .option('pm2', {
    describe: 'create an pm2 process on the app an pass along the <name> and the <port>',
  })
  .option('reload', {
    describe: 'reload nginx configuration at the end of the process',
  })
  .option('remote', {
    describe: 'ssh like url to use for setting up the config',
  })
  .option('remote-nginx', {
    describe: 'path of the nginx on the remote for setting up the subdomain',
  })
  .option('remote-project', {
    describe: 'path of the folder where all the projects are stored',
  })
  .option('verbose', {
    alias: 'v',
    default: false
  })
}
, argv => {
  initNginx(argv.name, argv, config);
})
.command('screenshot <website>', 'take a screen shot of an url', (yargs) => {
  yargs
  .usage('Usage: $0  screenshot [website] -R [recursive] -o [output]')
  .positional('website', {
    describe: 'website or url to screenshot'
  })
  .option('recursive', {
    alias: 'R',
    default: false
  })
  .option('sitemap', {
    alias: 'x',
    default: false
  })
  .option('output', {
    alias: 'o',
    default: '/tmp'
  })
  .option('depth', {
    alias: 'd',
    default: 1
  })
  .option('pdf', {
    alias: 'p',
    describe: 'Save the screenshots in pdf instead of images. This can be significantly slower, but allows you to get a full page pdf.',
    default: false
  })

}, (argv) => {
  if(argv.output.endsWith('/')){
    argv.output = argv.output.substr(0, argv.output.length - 1 );
  }
  if(argv.recursive){
    console.log('recurse');
    sitemap(argv.website, argv).then(parsedUrls=>{
      console.log('found', parsedUrls.length, 'urls');
      argv.output = argv.output + '/' + argv.website.replace(/\ /g,'-').replace(/\//g,'_').replace(/:/g,'');
      async.eachLimit(parsedUrls, 1, (url, cb)=>{
        screenshot(url, argv).then(()=>cb()).catch(err => cb(err));
      },
      (err)=> {
        if(err){
          console.log(err)
        }
        //   process.exit(0);
      });
    }

    );
    return;
  }

  screenshot(argv.website, argv, config).then((res)=> {
    console.log('Screenshot saved');
    setTimeout(()=>{
      process.exit(0);
    },200);
  });
})
.option('verbose', {
  alias: 'v',
  default: false
})
.argv;

