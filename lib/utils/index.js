modules.exports ={
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
