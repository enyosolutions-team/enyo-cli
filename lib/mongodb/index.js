const colors = require('colors'); // eslint-disable-line no-unused-vars
const MongoClient = require('mongodb');


const createDatabase = function (dbName, options, config) {
  if (!config.mongoUrl) {
    console.error('Missing mongodb config, please run enyo init');
    return;
  }

  // Use connect method to connect to the server

  console.log(`Creating database for ${dbName}`);
  MongoClient.connect(config.mongoUrl, { useNewUrlParser: true }, (err, client) => {
    if (err) {
      console.warn(err);
      return;
    }
    console.log('Connected successfully to server');
    const user = options.name || dbName;
    const password = options.user || dbName;
    const authDb = options['auth-db'] || 'admin';
    client.db(dbName);

    const db = client.db(authDb);

    db.addUser(
      user,
      password,
      {
        roles: [{ role: 'dbOwner', db: dbName }]
      },
      () => {
        console.log('Created user %s with password %s'.green, user, password);
        client.close();
      }
    );
  });
};


module.exports = createDatabase;

