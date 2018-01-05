var Config = {
  // Contents of this file will be send to the client
  //"domain":     process.env.OPENSHIFT_APP_DNS || '127.0.0.1',
  //"domain":		'brandmaster.herokuapp.com',

 // "serverip":   process.env.OPENSHIFT_NODEJS_IP || process.env.OPENSHIFT_INTERNAL_IP || 'localhost',
  //"serverport": process.env.OPENSHIFT_NODEJS_PORT ||  process.env.OPENSHIFT_INTERNAL_PORT || process.env.PORT || '3000',
  
  //"clientport": (process.env.OPENSHIFT_NODEJS_PORT) ? '8443':'8080',
  //"clientport": '8443',
  //"protocol":   'wss://',

  "heartbeattmo": 1000, // milliseconds 
  
  "wsclientopts": { reconnection: true, 
                    reconnectionDelay: 2000,
                    reconnectionAttempts: 100,
                    secure: true
                  }
};

module.exports = Config;