const shell = require('shelljs');
const net = require('net');
const colors = require('colors');
const fs = require('fs');
const MongoClient = require('mongodb');
const config = require('../../config.json');

if(!config.mongoUrl){
    console.error('Missing mongodb config, please run enyo init');
    return;
}

console.log(config);


var createDatabase = function (dbName, options) {
    // Use connect method to connect to the server

    console.log(`Creating database for ${dbName}`);
    MongoClient.connect(config.mongoUrl, function(err, client) {
        if(err) {
            console.warn(err);
            return;
        }
        console.log("Connected successfully to server");
        const user = options['name'] || dbName;
        const password = options['user'] || dbName;
        const authDb = options['auth-db'] || 'admin';
        client.db(dbName);

        db = client.db(authDb);

        console.log("Creating user ", { user: user,
            pwd: password,
            roles: [ { role: "dbOwner", db: dbName}]
        });
        db.addUser(user,
                   password,
                   {
                    roles: [ { role: "dbOwner", db: dbName}]
                },
                function(){
                    console.log("Created user %s with password %s".green, user, password);
                    client.close();
                }
                );
    });
}



module.exports  = createDatabase;


