const shell = require('shelljs'); // eslint-disable-line no-unused-vars
// const request = require("supertest");
// const request = require("axios");


const initJob = function () {};

/*
function (jobName, gitRepository, options, config) {
  // if (!config.gitGroupId || !config.gitApiAuth) {
  //     console.error('Jenkins config elements are missing, please run enyo init');
  //     return;
  // }

  console.log(`Creating job for ${jobName}`);
  const template = options.template || 'default';

  return new Promise((resolve, reject) => {
    shell.exec(`jenkins-cli new-job ${template} `);
  });
};
*/

module.exports = { initJob };

