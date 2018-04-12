const fs = require('fs');
const _ = require('lodash');
const shell = require('shelljs');
const net = require('net');
const colors = require('colors');

let config;


const defaultConfig = {
    projectFolder: '/apps',
    nginxConfigFolder: '/etc/nginx/sites-enabled',
    portStartRange: 2000,
    remoteUrl: 'develop'
};


shell.config.verbose = true;

function getNextAvailablePort (startPort, cb) {
  var port = startPort;
  var server = net.createServer()
  server.listen(port, function (err) {
    server.once('close', function () {
      cb(port)
    })
    server.close()
  })
  server.on('error', function (err) {
    startPort += 1;
    getNextAvailablePort(startPort, cb)
  })
}

function loadConfig(){
    try{
        userConfig = fs.readFileSync( process.cwd() + '/config.json');
        config = _.merge(defaultConfig, JSON.parse(userConfig));
    }
    catch(err){
        config = defaultConfig;
    }
    return new Promise((resolve, reject) => {
    getNextAvailablePort(config.portStartRange, function(port){
        if(!port){
            reject();
            return;
        }
        resolve(config.portStartRange);
    });
    });

}

function initNginxSite(name, options){
    console.log('hello'.green);
    if(options.verbose) console.log(`Creating nginx for ${name} [${options.type}]`, new Date());
    console.log("*");
    console.log("*");
    let content = '';
    let app_name = options.name;

    loadConfig().then( port => {
        switch(options.type){
            case 'proxy':
            let app_port;
            if(options.port){
                app_port = options.port;
            } else {
                app_port = config.port;
                config.portStartRange += 1;
                fs.writeFileSync( process.cwd() + '/config.json', JSON.stringify(config));
            }
            content = require('./templates/proxy');
            content = content.replace(/{{app_name}}/g,app_name).replace(/{{app_port}}/g,app_port);
            case 'html':
            content = require('./templates/html');
            content = content.replace(/{{app_name}}/g,app_name);
            case 'php':
            default:
            content = require('./templates/php');
            content = content.replace(/{{app_name}}/g,app_name);
            break
        }

        if(options.verbose) console.log(new Date(), `config created`, content);

        if(options.remote){
            if(options.verbose) console.log(new Date(), 'writing to FS', "/tmp/" + app_name, content);
            fs.writeFileSync("/tmp/" + app_name, content);

            if(options.verbose) console.log(new Date(), 'sending to remote');
            shell.exec("scp /tmp/" + app_name + ' ' + options.remote + ':/tmp');
            shell.exec('ssh ' + options.remote + ' sudo cp /tmp/' + app_name + ' ' + options.nginxConfigFolder + ' && mdkir ' + options['remote-project'] + '/' + app_name);

            if(options.verbose) console.log('%s DONE'.green, new Date());
        }
        else {

            if(options.verbose) console.log(new Date(), 'writing to FS', config.nginxConfigFolder + '/' + app_name);
            fs.writeFileSync(config.nginxConfigFolder + '/' + app_name, content);

            // create app folder if required
            let stats = fs.fstatSync(config.projectFolder + '/' + app_name);
            if(!stats.isFile()){
                if(options.verbose) console.log(new Date(), 'No target folder, creating one');
                if(options.git){
                    if(options.verbose) console.log(new Date(), 'Cloning data from git');
                    shell.exec("git clone " + options.git + " " + config.projectFolder + '/' + app_name);
                }
                else {
                    fs.mkdirSync(config.projectFolder + '/' + app_name);
                }
            }
        }


    })



}


module.exports = initNginxSite;
