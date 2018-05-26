// const homeDir = require('os').homedir();

module.exports = {
  /*
  checkForConfig() {
    // LOADING CONFIG
    try {
      global.config = require(`${homeDir}/.enyo.json`);
    } catch (ex) {
      console.log('This is your first install, please exec <enyo init> to set up your env'.cyan);
      process.exit();
    }
  },
  loadConfig() {
    try {
      userConfig = fs.readFileSync(`${homeDir}/.enyo.json`);
      config = _.merge(defaultConfig, JSON.parse(userConfig));
    } catch (err) {
      config = defaultConfig;
    }
    return new Promise((resolve, reject) => {
      getNextAvailablePort(config.portStartRange, (port) => {
        if (!port) {
          reject();
          return;
        }
        resolve(config.portStartRange);
      });
    });
  }
  */
};
