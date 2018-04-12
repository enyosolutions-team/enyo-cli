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
    if(options.verbose) console.log(`Creating nginx for ${name} [${options.type}]`);

    console.log("*");
    console.log("*");
    let content = '';
    let app_name = options.name;

    loadConfig().then( port => {

        if(options.verbose) console.log(config);
        switch(options.type){
            case 'proxy':
            let app_port;
            if(options.port){
                app_port = options.port;
            } else {
                app_port = config.portStartRange;
                config.portStartRange += 1;
                fs.writeFileSync( process.cwd() + '/config.json', JSON.stringify(config));
            }
            content = require('./templates/proxy');
            content = content.replace(/{{app_name}}/g,app_name).replace(/{{app_port}}/g,app_port);
            console.log('VOTRE PORT', app_port);
            console.log('*****************************'.blue)
            console.log('******      %s       ******'.blue, app_port)
            console.log('*****************************'.blue)
            break
            case 'html':
            content = require('./templates/html');
            content = content.replace(/{{app_name}}/g,app_name);
            break
            case 'php':
            default:
            content = require('./templates/php');
            content = content.replace(/{{app_name}}/g,app_name);
            break
        }

        if(options.verbose) console.log(`config created`, content);

        if(options.remote){
            if(options.verbose) console.log('writing to FS', "/tmp/" + app_name, content);
            fs.writeFileSync("/tmp/" + app_name, content);

            if(options.verbose) console.log('sending to remote');
            shell.exec("scp /tmp/" + app_name + ' ' + options.remote + ':/tmp');
            shell.exec('ssh ' + options.remote + ' sudo cp /tmp/' + app_name +  ' && mdkir ' + options['remote-project'] + '/' + app_name);

            if(options.verbose) console.log('%s DONE'.green);
        }
        else {

            if(options.verbose) console.log('writing to FS', config.nginxConfigFolder + '/' + app_name);
            fs.writeFileSync("/tmp/" + app_name, content);
            shell.exec("sudo cp /tmp/" + app_name + ' ' + config.nginxConfigFolder + "/" + app_name);

            // create app folder if required

            try{
                if(options.verbose) console.log('Creating target folder');
                fs.mkdirSync(config.projectFolder + '/' + app_name);
            }
            catch(err){
                if(options.verbose) console.log('Target folder exists');
            }

            // if we have a git repo clone into the folder which will create it at the same time
            if(options.git){
                if(options.verbose) console.log('Cloning data from git');
                shell.exec("git clone " + options.git + " " + config.projectFolder + '/' + app_name);
                console.log("Cloning done. You might need to ajust the branch".cyan);
                shell.exec('tput bel');
            }

            if(options.pm2){
                if(options.verbose) console.log('Cloning data from git');
                shell.exec(`cd ${config.projectFolder}/${app_name} yarn i && pm2 start app.js --name ${app_name} -- --port ${app_port} && pm2 dump`);
                console.log("pm2 done. You might need to ajust the local server config ".cyan);
            }


        }


        console.log("ALL DONE, YOU CAN CHECK THE CONFIG AND RELOAD NGINX NOW ".green);

    })



}


module.exports = initNginxSite;
