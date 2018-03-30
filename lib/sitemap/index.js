const Crawler = require('crawler');

let foundUrlsDb = {};
let crawledUrlsDb = {};
let host;
let argv;
var crawler = new Crawler({
    maxConnections : 10,
    // This will be called for each crawled page
    callback : function (error, res, done) {
        if(error){
            console.log(error);
        }else{
            var $ = res.$;
            // $ is Cheerio by default
            //a lean implementation of core jQuery designed specifically for the server

            let urls=[]
        }
        done();
    }
});

function recursiveCrawl(url, options){
    if(!options ||  options.depth < 0){
      if (argv.verbose)  console.log('NEGATIVE DEPTH','skipping urls', url);
        return;
    }

    if(url.endsWith('/')){
        url = url.substr(0, url.length - 1);
    }

    // if it's an absolute url
    if(url.indexOf('http') === 0){
        // and its not hours
        if(url.indexOf(host)  === -1){
            return;
        }
    }
    else {
        // add the host and continue
        url = host + (url.startsWith('/') ? "" : "/" ) + url;
    }

    let lowerCaseUrl = url.toLowerCase();
    if(foundUrlsDb[url] || url.indexOf(host) === -1 || lowerCaseUrl.endsWith('.jpg') || lowerCaseUrl.endsWith('.gif') || lowerCaseUrl.endsWith('.png')){
       if (argv.verbose) console.log('EXISTING URL','skipping url', url);
        return;
    }
    foundUrlsDb[url] = 1;
    crawler.queue([{
        uri: url,

        // The global callback won't be called
        callback: function (error, res, done) {
            if(error){
                console.log(error);
            }else{
                res.options = options;
                crawledUrlsDb[url] = 1;
                crawlCallback(error, res, done);
            }
            done();
        }
    }]);
}

function crawlCallback (error, res, done) {
    if(error){
        console.log(error);
    }else{
        var $ = res.$;
        let urls=$("a");

        urls  = urls.filter(
                           (idx, u) => {
                                       return u.attribs && u.attribs.href && u.attribs.href  !== "#" ? true : false;
                                   }
                           );

        let urls2 = [];
        urls.map((i, u)=>{
            recursiveCrawl(u.attribs.href, {depth: res.options.depth -1 });
        });

    }
    done();
}

function websiteCrawl(url, options = {}){
    argv = options;
    if(!options.depth){
        options.depth = 1;
    }
    host = url;
    let idx =  url.indexOf('/', 9);
    if(idx > -1){
        host = url.substr(0, idx);
    }
    console.log("crawling host : ", host);


    return new Promise((resolve, reject) => {
        try{
            recursiveCrawl(url, argv);
            crawler.on('drain',function(){
               if (argv.verbose) console.log('drain', Object.keys(foundUrlsDb).length);
                resolve(Object.keys(foundUrlsDb));
            });
        }
        catch(err){
            reject(err);
        }
    });

}


module.exports = websiteCrawl;
