/*
  W E B   S O C K E T   S E R V E R

  A Web Socket Server for Node.js.

  Author:
  H. R. Baer
  hansruedi.baer@bluewin.ch

  Version history:
  0.1.0 02/10/2016
  1.0.0 18/10/2016
*/

const MAXCONS = 20;
const PORT = 8080;

var WebSocketServer = require('ws').Server,
    wss = new WebSocketServer({ port: PORT });

var resources = {};
var counter = 0;

function log(headers, clientID, state, wss) {
  console.log(headers.origin + '\t' + (new Date()) + '\t' + state + '\t' + clientID + '\t' + wss.clients.length + '\t' + headers['user-agent']);
}

function getParams(query) {
  var params = {};
  var plist = query.split('&');
  plist.forEach(function(p) {
    var pair = p.split('=');
    params[pair[0]] = pair[1];
  });
  return params;
}

wss.on('connection', function(client) {

  var clientID = 1000 + counter;
  var headers = client.upgradeReq.headers;
  
  if (wss.clients.length > MAXCONS) {
    log(headers, clientID, 'refused', wss);
    client.close(1011, 'Too many connections. Try later.');
    return;
  }
  
  log(headers, clientID, 'connect', wss);
  counter += 1;

  var url = client.upgradeReq.url.split('?');
  var params = {};
  if (url.length > 1) {
    params = getParams(url[1]);
  }
  var id = params['id'];
  var key = url[0].substr(1);
  if (id) {
    key = key + ' ' + id;
  }

  var resource = resources[key];
  if (!resource) {
    var file = '.' + url[0];
    var Resource = require(file).Resource;
    resources[key] = resource = Resource(params);
  }
  resource.connect(client, clientID);

  client.on('message', function incoming(msg) {
    resource.message(msg, client, clientID);
  });
  
  client.on('close', function() {
    resource.close(client, clientID);
    log(headers, clientID, 'disconnect', wss);
  });
  
});
