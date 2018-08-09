#!/usr/bin/env node


const screenshot = require('./lib/screenshot');
const sitemap = require('./lib/sitemap');
const initNginx = require('./lib/nginx');
const createDatabase = require('./lib/mongodb');
const git = require('./lib/git');
const async = require('async');
const colors = require('colors'); // eslint-disable-line no-unused-vars
const fs = require('fs');
const homeDir = require('os').homedir();
const prompt = require('prompt');
const api = require('./api');


global.config = {};
const defaultConfig = {
  projectFolder: '/apps',
  nginxConfigFolder: '/etc/nginx/sites-enabled',
  nginxHost: '',
  portStartRange: 5000,
  mongoUrl: 'mongodb://root:toor@localhost:27017/admin',
  gitGroupId: null,
  gitApiAuth: null,
  jenkinsUrl: null,
};


function initConfig() {
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
      description: 'what\'s the host name of this server ? if provided all virtualhosts will be ' +
    'subdomains of this one. If you want to create absolute urls, dont provide it.',
      type: 'string',
      default: config.nginxHost,
    },
    {
      name: 'gitApiAuth',
      description: 'What\s the api key for gitlab ? ',
      type: 'string',
      default: config.gitApiAuth,
    },
    {
      name: 'gitGroupId',
      description: 'What default group for created repository ?',
      type: 'string',
      default: config.gitGroupId,
    },
    {
      name: 'portStartRange',
      description: 'What is the lowest number we should start scanning for free port ?',
      type: 'integer',
      default: config.portStartRange,
    },
    {
      name: 'mongoUrl',
      description: 'What is the mongo url for db connexion (mongodb://user:pass@host:27017/<authentication-database>)',
      type: 'string',
      default: config.mongoUrl,
    },
    {
      name: 'jenkinsUrl',
      description: 'What is the jenkins url for continuous (https://{username}:{password}@ci.dev.enyosolutions.com)',
      type: 'string',
      default: config.jenkinsUrl,
    }
  ], (err, result) => {
    if (result) {
      fs.writeFileSync(`${homeDir}/.enyo.json`, JSON.stringify(result));

      console.log('YOUR CONFIG IS NOW', result);
    }
  });
}

// LOADING CONFIG
try {
  const url = `${homeDir}/.enyo.json`;
  config = require(url); // eslint-disable-line global-require, import/no-dynamic-require
} catch (ex) {
  console.log('This is your first install, please take a few seconds to configure your install'.cyan);
  config = defaultConfig;
  initConfig();
}

const yargsCommand = require('yargs');

yargsCommand.help('help').alias('-h', 'help') // eslint-disable-line no-unused-expressions
  .command('init', 'Set the config for a better app generation', () => {
  }, () => {
    initConfig();
  })

/*
MONGO DB
*/
  .command(
    ['mongocreate <dbName>', 'mongo create <dbName>', 'mongo add <dbName>'], 'create a database and user in mongo', (yargs) => {
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
    , (argv) => {
      createDatabase(argv.dbName, argv, config);
    }
  )

  /*
  JEKINS
  */
  .command(
    ['jenkins-create <jobName>', 'jenkins create <jobName>', 'jeknis add <jobName>'], 'create a job in jenkins', (yargs) => {
      yargs.positional('jobName', {
        describe: '- the job name',
      })
        .option('git', {
          describe: 'the git repository'
        })
        .option('type', {
          alias: 't',
          describe: 'the template ofr the repository'
        });
    }
    , (argv) => {
      createDatabase(argv.dbName, argv, config);
    }
  )

/*
GIT
*/
  .command(
    ['git-init <repoName>', 'git init <repoName>'], 'create a database and user in mongo', (yargs) => {
      yargs.positional('repoName', {
        describe: '- the repository name',
      })
        .option('group', {
          describe: 'the group id of the repoName created',
          default: config.gitGroupId,
        })
        .option('ci', {
          describe: 'Add jenkins branches',
          default: true
        })
        .option('secure', {
          describe: 'protect branches',
          default: true
        })
        .option('type', {
          describe: 'the project type (front|angular|node|php)',
          choices: ['front', 'angular', 'node', 'php'],
          default: true
        });
    }
    , (argv) => {
      git.createRepository(argv.repoName, argv, config);
    }
  )

  .command(
    ['git-add-webhook <repoName> <webhookUrl>', 'git add-webhook <repoName> <webhookUrl>', 'git webhook add <repoName> <webhookUrl>'], 'Add a webhook to an existing repository', (yargs) => {
      yargs.positional('repoName', {
        describe: '- the repository name',
      })
        .option('group', {
          describe: 'the group id of the repoName created',
          default: config.gitGroupId,
        });
    }
    , (argv) => {
      git.addWebhook(argv.repoName, argv.webhookUrl, argv, config);
    }
  )


/*
NGINX
*/
  .command(
    'nginx <name>', 'init a nginx repo', (yargs) => {
      yargs.positional('name', {
        describe: '- the subdomain name',
      })
        .option('type', {
          describe: 'the type of app (php / html / proxy / node). use html for bundled angular projects, proxy for profixied projects and node for node projects',
          choices: ['php', 'html', 'proxy', 'node'],
          required: true
        })
        .option('port', {
          describe: 'the port of the app (only for types proxy and node)'
        })
        .option('git', {
          describe: 'The url of the remote repository',
          required: true
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
        });
    }
    , (argv) => {
      initNginx(argv.name, argv, config);
    }
  )

/*
SCREENSHOT
*/
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
      });
  }, (argv) => {
    if (argv.output.endsWith('/')) {
      argv.output = argv.output.substr(0, argv.output.length - 1);
    }
    if (argv.recursive) {
      console.log('recurse');
      sitemap(argv.website, argv).then((parsedUrls) => {
        console.log('found', parsedUrls.length, 'urls');
        argv.output = `${argv.output}/${argv.website.replace(/\ /g, '-').replace(/\//g, '_').replace(/:/g, '')}`;
        async.eachLimit(
          parsedUrls, 1, (url, cb) => {
            screenshot(url, argv).then(() => cb()).catch(err => cb(err));
          },
          (err) => {
            if (err) {
              console.log(err);
            }
            //   process.exit(0);
          }
        );
      });
      return;
    }

    screenshot(argv.website, argv, config).then(() => {
      console.log('Screenshot saved');
      setTimeout(() => {
        process.exit(0);
      }, 200);
    });
  })
  .option('verbose', {
    alias: 'v',
    default: false
  })
  .argv;

module.exports = api;
