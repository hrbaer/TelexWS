/*
  T E L E X

  A Web socket server script implementing a telewriter.

  Author:
  H. R. Baer
  hansruedi.baer@bluewin.ch

  Version history:
  1.0.0 18/10/2016
*/

(function() {

  function Client(params) {

    // List of all participants
    var clients = [];

    return {
      connect: function(client, clientID) {
        clients.push(client);
      },
      message: function(msg, client, clientID) {
        var jso = JSON.parse(msg);
        // Send key code back
        if (jso.key || jso.txt) {
          clients.forEach(function(c) {
            c.send(msg);
          });
        }
        // Send list of participants back
        else if (jso.cmd == 'wry') {
          var wry = { origin: [] };
          clients.forEach(function(c) {
            if (c !== client) {
              wry.origin.push(c.upgradeReq.headers.origin);
            }
          });
          client.send(JSON.stringify(wry));
        }
      },
      close: function(client, clientID) {
        clients = clients.filter(function(c) {
          return c != client;
        });
      }
    }

  };

  exports.Resource = Client;

})();
