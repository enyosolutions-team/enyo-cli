const shell = require('shelljs');
// const request = require("supertest");
// const request = require("axios");



var initRemote = function (repoName, options, config) {

    if (!config.gitGroupId || !config.gitApiAuth) {
        console.error('Git config elements are missing, please run enyo init');
        return;
    }

    console.log(`Creating repository for ${repoName}`);
    let repoId;

    return new Promise((resolve, reject) => {
        request()
        .post(`https://gitlab.com/api/v3/projects`, {name: repoName, namespace_id: options.group || config.gitGroupId })
        .set("PRIVATE-TOKEN", config.gitApiAuth)
        .then(response => {
            console.log('Repository created', response.body);
            repoId = response.body.id;
            console.log('Creating staging and develop branches');
            const p1 = request()
            .post(`https://gitlab.com/api/v3/projects/${repoId}/repository/branches?branch=develop&ref=master"`)
            .set("PRIVATE-TOKEN", config.gitApiAuth)
            .send({branch: 'develop', ref: 'master'})

            const p2 = request()
            .post(`https://gitlab.com/api/v3/projects/${repoId}/repository/branches?branch=staging&ref=master"`)
            .set("PRIVATE-TOKEN", config.gitApiAuth)
            .send({branch: 'staging', ref: 'master'})

            return Promise.all([p1, p2]);
        })
        .then(response => {
            resolve(response.body);
            console.log(response.body);
        })
        .catch(err => console.error(err) && reject(err));


    });
}

module.exports  = {initRemote};



