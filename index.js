#!/usr/bin/env node
const screenshot = require('./lib/screenshot');
const sitemap = require('./lib/sitemap');
const async = require('async');
const argsList = require('yargs')
.usage('Usage: $0  \n screenshot \n nginx ')
.command('screenshot website', 'take a screen shot of an url', (yargs) => {
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

