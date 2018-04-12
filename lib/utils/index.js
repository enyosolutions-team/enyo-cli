module.exports ={
    checkForConfig: function(){
        // LOADING CONFIG
        try{
            config = require(__dirname + '../../config.json');
      }
      catch (ex){
          console.log('This is your first install, please exec <enyo init> to set up your env'.cyan);
          process.exit();
          return;
      }

  },
  loadConfig(){

    try{
        userConfig = fs.readFileSync( __dirname + '/../../config.json');
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
}
