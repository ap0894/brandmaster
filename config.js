var Config = {
  // Contents of this file will be send to the client
  //"domain":     process.env.OPENSHIFT_APP_DNS || '127.0.0.1',

  "serverip":   process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0',
  "serverport": process.env.PORT || 5000,
  //"serverip":   process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1',
  //"serverport": process.env.OPENSHIFT_NODEJS_PORT || '8080',
  
  "clientport": (process.env.OPENSHIFT_NODEJS_PORT) ? '8443':'8080',
  "protocol":   'wss://',

  "heartbeattmo": 1000, // milliseconds 
  
  "wsclientopts": { reconnection: true, 
                    reconnectionDelay: 2000,
                    reconnectionAttempts: 100,
                    secure: true
                  }
};

module.exports = Config;