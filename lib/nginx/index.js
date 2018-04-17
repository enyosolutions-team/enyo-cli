const fs = require('fs');
const _ = require('lodash');
const shell = require('shelljs');
const net = require('net');
const checkForConfig = require('../utils').checkForConfig;
const colors = require('colors');



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

function initNginxSite(name, options, config){
    checkForConfig();
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
                console.log('SAVING');
                console.log(fs.writeFileSync(__dirname + '/../../config.json', JSON.stringify(config)));
            }
            content = require('./templates/proxy');
            content = content.replace(/{{app_name}}/g,app_name).replace(/{{app_port}}/g,app_port);
            console.log('');
            console.log('');
            console.log('YOUR APP PORT');
            console.log('*****************************'.blue)
            console.log('******      %s       ******'.blue, app_port)
            console.log('*****************************'.blue)
            console.log('');
            console.log('');
            console.log('');
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
                shell.exec(`cd ${config.projectFolder}/${app_name} yarn i && pm2 start app.js --name ${app_name}
                           --merge-logs --log-date-format="YYYY-MM-DD HH:mm Z" -o /var/log/apps/${app_name}.log
                           -e /var/log/apps/${app_name}.log -- --port ${app_port} && pm2 save`);
                console.log("pm2 done. You might need to ajust the local server config ".cyan);
            }


        }
        if(options.reload){
            shell.exec('sudo service nginx configtest');
            shell.exec('sudo service nginx reload');
            console.log("ALL DONE ".green);
            return;
        }
        console.log("ALL DONE, YOU CAN CHECK THE CONFIG AND RELOAD NGINX NOW ".green);

    })



}


module.exports = initNginxSite;
