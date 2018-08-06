const colors = require('colors'); // eslint-disable-line no-unused-vars
const axios = require('axios');
const {createJob}  = require('../jenkins');




const initRemote = function (repoName, options, config) {
  if (!config.gitGroupId || !config.gitApiAuth) {
    console.error('Git config elements are missing, please run enyo init');
    return;
  }

  if (!repoName) {
    console.error('Repository name is missing');
    return;
  }
  console.log(`Creating gitlab repository for ${repoName}`);
  let repoId;
  let repoUrl;

  const gitApi = axios.create({
    baseURL: 'https://gitlab.com/api/v4/',
    timeout: 20000,
    headers: { 'PRIVATE-TOKEN': config.gitApiAuth }
  });


  return new Promise((resolve, reject) => {
    gitApi
    .post('/projects', { name: repoName, namespace_id: options.group || config.gitGroupId })
    .then((response) => {
      console.log('Repository created'.green, response.data.ssh_url_to_repo);
      console.log('Repository ID : '.green, response.data.id);
      console.log('Repository URL: '.green, response.data.http_url_to_repo);
      console.log('Repository SSL: '.green, response.data.ssh_url_to_repo);
      if (options.verbose) {
        console.log(JSON.stringify(response && response.data, null, 2));
      }
      repoId = response.data.id;
      repoUrl = response.data.ssh_url_to_repo;

      return gitApi.post(
                         `/projects/${repoId}/repository/commits`,
                         {
                          start_branch: 'master',
                          branch: 'master',
                          branch_name: 'master',
                          commit_message: 'chore: repo init',
                          actions: [
                          {
                            action: 'create',
                            file_path: 'readme.md',
                            content: `# Project ${repoName}\n
                            ${options.type ? 'jenkins-template: ' + options.type : ''}
                            `
                          }]
                        }
                        );
    })
    .then(() => {
      console.log('Creating staging and develop branches for repo'.blue, repoId);
      const p1 = gitApi
      .post(`/projects/${repoId}/repository/branches`, { branch: 'develop', ref: 'master' });

      const p2 = gitApi
      .post(`/projects/${repoId}/repository/branches`, { branch: 'staging', ref: 'master' });

      return Promise.all([p1, p2]);
    })
    .then((promiseResults) => {
      console.log('Branches created'.green);
      if (options.secure) {
        const promiseArray = [];
        promiseResults.forEach((response) => {
          const p = gitApi
          .post(`/projects/${repoId}/protected_branches`, { name: response.data.name });
          promiseArray.push(p);
        });
        return Promise.all(promiseArray);
      }
      return true;
    })
    .then((promiseResults) => {
      if (promiseResults) {
      console.log('Branches Protected'.green, options);
      }
      if (options.ci) {
        return  Promise.all([

        gitApi.post(`/projects/${repoId}/hooks`, { url: `https://ci.dev.enyosolutions.com/project/${repoName}.dev`, push_events: true, tag_push_events: true, merge_requests_events: true }),
        gitApi.post(`/projects/${repoId}/hooks`, { url: `https://ci.dev.enyosolutions.com/project/${repoName}.staging`, push_events: true, tag_push_events: true, merge_requests_events: true }),
        createJob(`${repoName}.dev`, {gitUrl: repoUrl, gitProjectId: repoId}, {jenkinsUrl: options.jenkinsUrl || config.jenkinsUrl, gitApiAuth: config.gitApiAuth}),
        createJob(`${repoName}.staging`, {gitUrl: repoUrl, gitProjectId: repoId}, {jenkinsUrl: options.jenkinsUrl || config.jenkinsUrl, gitApiAuth: config.gitApiAuth})
        ])
        console.log('Hook created'.green);
      }
      return true;
    })
    .then(res => {


    })
    .then(res => {resolve(res) && console.log('Hook created'.green) })
    .catch((err) => {
      console.error('Repository error, Deleting repository '.red);
      reject(err);
      if (repoId) {
        gitApi
        .delete(`/projects/${repoId}`);
      }
      console.error('Error '.red, err.response && err.response.statusText.red, JSON.stringify(err.response && err.response.data, null, 2));
    });
  }); // promise end
};


const addWebhook = function (repoName, hookUrl, options, config) {
  if (!config.gitGroupId || !config.gitApiAuth) {
    console.error('Git config elements are missing, please run enyo init');
    return;
  }

  if (!repoName) {
    console.error('Repository name is missing');
    return;
  }
  console.log(`Adding gitlab webhook ${hookUrl} for repository ${repoName}`);
  let repoId;

  const gitApi = axios.create({
    baseURL: 'https://gitlab.com/api/v4/',
    timeout: 20000,
    headers: { 'PRIVATE-TOKEN': config.gitApiAuth }
  });


  return new Promise((resolve, reject) => {
    gitApi
    .get('/projects', {params: { name: repoName, namespace_id: options.group || config.gitGroupId } })
    .then((response) => {
      response.data = Array.isArray(response.data) ? response.data[0] : response.data;
      console.log('Repository created'.green, response.data.ssh_url_to_repo);
      console.log('Repository ID : '.green, response.data.id);
      console.log('Repository URL: '.green, response.data.http_url_to_repo);
      console.log('Repository SSL: '.green, response.data.ssh_url_to_repo);

      repoId = response.data.id;

      console.log('Creating jenkins hook'.blue, repoId);

      return gitApi.post(`/projects/${repoId}/hooks`, { url: `https://ci.dev.enyosolutions.com/project/${repoName}.dev`, push_events: true, tag_push_events: true, merge_requests_events: true });

    })
    .then(res => resolve(res))
    .catch((err) => {
      reject(err);
      console.error('Repository creating hook error '.red, err.response && err.response.statusText.red, JSON.stringify(err.response && err.response.data, null, 2));

    });
  }); // promise end
};

module.exports = { initRemote, addWebhook };

