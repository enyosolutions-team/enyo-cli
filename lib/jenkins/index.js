
const atob = require('atob');
const axios = require('axios');

const createJob = (name, options, config) => {
  console.log(name, options, config);
  if (!name || !options || !options.gitUrl || !options.gitProjectId || !(options.jenkinsUrl || config.jenkinsUrl) || !config.gitApiAuth) {
    console.error('Cannot create job, some options are missing: name, gitUrl, jenkinsUrl, gitApiAuth and gitProjectId are required'.red);
    return Promise.reject({message: 'Cannot create job, some options are missing: name, gitUrl, jenkinsUrl, gitApiAuth and gitProjectId are required'});
  }

  const Gitlab = axios.create({
    baseURL: 'https://gitlab.com/api/v4/',
    timeout: 20000,
    headers: { 'PRIVATE-TOKEN': config.gitApiAuth }
  });

  const jenkins = init(config);
  console.log("sending create job request for ", name)

  return new Promise((resolve, reject) => {

    jenkins.job.get(name).then(
                               (data) => { // try to find and existing job
                                console.log('Job already exists');
                                resolve({errors:[{message: 'Job already exits'}]});
                              }).catch( err => {
                                return  Gitlab.get(`/projects/${options.gitProjectId}/repository/files/readme.md?ref=master`);
                              })
                              .then(function(output){
                                const readme = atob(output.data.content);
                                let templateType = readme.match(/jenkins-template: \[.+\]/);
                                if (templateType && templateType[0]) {
                                  templateType = templateType[0];
                                  templateType = templateType.replace('jenkins-template: ', '').replace('[', '').replace(']', '');
                                  if (templateType.indexOf('-template') === -1) {
                                    templateType += '-template';
                                  }
                                }
                                else {
                                  templateType = 'ci-template';
                                }
                                console.log("Getting config of template", templateType);
                                return jenkins.job.config(options.template || templateType) // create a new job from template
                              })
                              .then((xml) => { // change the configuration to point to the right repository.
                                console.log('XML TEMPLATE');
                                const xml2 = xml.replace(/GIT_REPOSITORY/g, options.gitUrl).replace(/PROJECT_NAME/g, name);
                                return jenkins.job.create({name: name, xml: xml});
                              })
                              .then((data)=> {
                                return jenkins.job.build(name);
                              })
                              .then((data)=> {
                                console.log("POST BUILD HOOK", data);
                                resolve(data);
                              })
                              .catch( err => {  // gitlab get config end.
                                debugger;
                                console.error(err);
                                reject(err);
                              });

                            });


};



function init(config) {
  return require('jenkins')({ baseUrl: config.jenkinsUrl, crumbIssuer: true , promisify:true});
};


module.exports = { createJob };

