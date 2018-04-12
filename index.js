#!/usr/bin/env node
'use strict';
const screenshot = require('./lib/screenshot');
const sitemap = require('./lib/sitemap');
const initNginx = require('./lib/nginx');
const async = require('async');
const colors = require('colors');
const fs = require('fs');
const prompt = require('prompt');
let config;

function initConfig(){
  prompt.get([
  {
   name: 'projectFolder',
   description: 'Where is the base folder for your apps code ?',
   default: '/apps',
   type: 'string'
 },
 {
   name: 'nginxConfigFolder',
   description: 'Where is the base folder for your nginx virtual hosts ?',
   type: 'string',
   default: '/etc/nginx/sites-enabled',
 },
 {
   name: 'portStartRange',
   description: 'What is the lowest number we should start scanning for free port ?',
   type: 'integer',
   default: 5000,
 },
 ], function (err, result) {
  console.log('YOUR CONFIG IS NOW', result);
  if(result){
    fs.writeFileSync( process.cwd() + '/config.json', JSON.stringify(result));
  }
});
}

// LOADING CONFIG
try{
  config = fs.readFileSync( process.cwd() + '/config.json');
}
catch (ex){
  console.log('This is your first install, please take a few seconds to configure your install'.cyan);
  initConfig()
}


const argsList = require('yargs')
.help('help').alias('-h','help')
.command('init', 'Set the config for a better app generation', (yargs) => {

}, (args) =>{
  initConfig()
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
  initNginx(argv.name, argv);
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

  screenshot(argv.website, argv).then((res)=> {
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

