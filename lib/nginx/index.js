const fs = require('fs');
const shell = require('shelljs');
const net = require('net');
// const checkForConfig = require('../utils').checkForConfig;
const colors = require('colors'); // eslint-disable-line no-unused-vars
const homeDir = require('os').homedir();

shell.config.verbose = true;

function getNextAvailablePort(startPort, cb) {
  console.log('Check port %s for availability', startPort);
  const port = startPort;
  const server = net.createServer();
  server.listen(port, (err) => {
    console.error(err);
    server.once('close', () => {
      cb(port);
    });
    server.close();
  });
  server.on('error', () => {
    startPort += 1;
    getNextAvailablePort(startPort, cb);
  });
}

function findPort() {
  console.log('Searching next port');
  return new Promise((resolve, reject) => {
    getNextAvailablePort(config.portStartRange || 3001, (port) => {
      if (!port) {
        reject();
        return;
      }
      resolve(port);
    });
  });
}

function initNginxSite(name, options, config) {
  console.log('CREATING A NEW VHOST IN NGINX'.green);
  return new Promise((resolve, reject) => {
    console.log('Checking vhost parameters');
    global.config = config;
    // checkForConfig();
    if (options.verbose) console.log(`Creating nginx for ${name} [${options.type}]`);

    console.log('*');
    console.log('*');
    let content = '';
    const appName = name;
    // const hostName = config.nginxHost || '';
    let appPort;
    findPort().then((port) => {
      console.log('Using port ', port);

      if (options.verbose) console.log('creating template for type %s', options.type);
      switch (options.type) {
        case 'proxy':
        case 'node':
        if (options.port) {
          appPort = options.port;
        } else {
          appPort = port;
          config.portStartRange = appPort + 1;
          console.log('SAVING config');
          const out = fs.writeFileSync(`${homeDir}/.enyo.json`, JSON.stringify(config));
          console.log(out);
        }
        content = require('./templates/proxy'); // eslint-disable-line global-require
        content = content.replace(/{{appName}}/g, appName).replace(/{{appPort}}/g, appPort);
        console.log('');
        console.log('');
        console.log('YOUR APP PORT');
        console.log('*****************************'.blue);
        console.log('******      %s         ******'.blue, appPort);
        console.log('*****************************'.blue);
        console.log('');
        console.log('');
        console.log('');
        break;
        case 'html':
        content = require('./templates/html'); // eslint-disable-line global-require
        content = content.replace(/{{appName}}/g, appName);
        break;
        case 'php':
        default:
        content = require('./templates/php'); // eslint-disable-line global-require
        content = content.replace(/{{appName}}/g, appName);
        break;
      }

      if (options.verbose) console.log('config created', content);

      if (options.remote) {
        if (options.verbose) console.log('writing to FS', `/tmp/${appName}`, content);
        fs.writeFileSync(`/tmp/${appName}`, content);

        if (options.verbose) console.log('sending to remote');
        shell.exec(`scp /tmp/${appName} ${options.remote}:/tmp`);
        shell.exec(`ssh ${options.remote} sudo cp /tmp/${appName} && mdkir ${options['remote-project']}/${appName}`);

        if (options.verbose) console.log('%s DONE'.green);
      } else {
        if (options.verbose) console.log('writing to FS', `${config.nginxConfigFolder}/${appName}`);
        fs.writeFileSync(`/tmp/${appName}`, content);
        shell.exec(`sudo cp /tmp/${appName} ${config.nginxConfigFolder}/${appName}`);

        // create app folder if required

        try {
          if (options.verbose) console.log('Creating target folder');
          fs.mkdirSync(`${config.projectFolder}/${appName}`);
        } catch (err) {
          if (options.verbose) console.log('Target folder exists');
        }

        // if we have a git repo clone into the folder which will create it at the same time
        if (options.git) {
          if (options.verbose) console.log('Cloning data from git');
          shell.exec(`git clone ${options.git} ${config.projectFolder}/${appName}`);
          console.log('Cloning done. You might need to ajust the branch'.cyan);
          shell.exec('tput bel');
        }

        if (options.type === 'php') {
          shell.exec(`cd ${config.projectFolder}/${appName} && composer install &` );
        }

        if (options.pm2 || options.type === 'node') {
          shell.exec(`cd ${config.projectFolder}/${appName} && yarn install &` );
        }

        if (options.pm2 || options.type === 'node') {
          if (options.verbose) console.log('Cloning data from git');
          shell.exec(`cd ${config.projectFolder}/${appName} yarn i && pm2 start app.js --name ${appName}
                     --merge-logs --log-date-format="YYYY-MM-DD HH:mm Z" -o /var/log/apps/${appName}.log
                     -e /var/log/apps/${appName}.log -- --port ${appPort} && pm2 save`);
          console.log('pm2 done. You might need to ajust the local server config '.cyan);
        }

      }
      if (options.reload) {
        shell.exec('sudo service nginx configtest');
        shell.exec('sudo service nginx reload');
        console.log('RELOADED NGINX'.blue);
        console.log('ALL DONE '.green);
        resolve('ALL DONE');
        return;
      }
      resolve('ALL DONE');
      console.log('ALL DONE, YOU CAN CHECK THE CONFIG AND RELOAD NGINX NOW '.green);
    }).catch(err => {
      reject(err);
      console.log('error while getting next free port'.red, err);
    });
  });
}


module.exports = initNginxSite;
