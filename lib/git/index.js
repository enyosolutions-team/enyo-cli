const colors = require('colors'); // eslint-disable-line no-unused-vars
const axios = require('axios');


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

  const gitApi = axios.create({
    baseURL: 'https://gitlab.com/api/v3/',
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

      console.log('Creating master branch and readme commit'.blue, repoId);

      return gitApi.post(
                         `/projects/${repoId}/repository/commits`,
                         {
                          branch_name: 'master',
                          start_branch: 'master',
                          commit_message: 'some commit message',
                          actions: [
                          {
                            action: 'create',
                            file_path: 'readme.md',
                            content: `# Project ${repoName}`
                          }]
                        }
                        );
    })
    .then(() => {
      console.log('Creating staging and develop branches for repo'.blue, repoId);
      const p1 = gitApi
      .post(`/projects/${repoId}/repository/branches`, { branch_name: 'develop', ref: 'master' });

      const p2 = gitApi
      .post(`/projects/${repoId}/repository/branches`, { branch_name: 'staging', ref: 'master' });

      return Promise.all([p1, p2]);
    })
    .then((promiseResults) => {
      console.log('Branches created'.green, Object.keys(promiseResults));
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
      console.log('Branches Protected'.green);
      if (options.ci) {
        return gitApi.post(`/projects/${repoId}/hooks`, { url: `https://ci.dev.enyosolutions.com/project/${repoName}.dev`, push_events: true, tag_push_events: true, merge_requests_events: true });
      }
      return true:
    })
    .then(res => resolve(res))
    .catch((err) => {
      reject(err);
      if (repoId) {
        gitApi
        .delete(`/projects/${repoId}`);
      }
      console.error('Repository error '.red, err.response && err.response.statusText.red, JSON.stringify(err.response && err.response.data, null, 2));
    });
  }); // promise end
};

module.exports = { initRemote };

