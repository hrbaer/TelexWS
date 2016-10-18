/*
  W E B   S O C K E T   C L I E N T

  Communicate with a Web socket server.

  Author
  H. R. Baer
  hansruedi.baer@bluewin.ch

  Version 0.1
  18/10/2016
*/

function WSClient(ws, callback, statistics) {

  var connection;
  var sentBytes, receivedBytes;

  function send(msg) {
    if (connection) {
      connection.send(msg);
      sentBytes += msg.length;
      if (statistics) {
        statistics(sentBytes, receivedBytes);
      }
    }
  }

  function start() {
    if (connection) {
      connection.close(3001);
    }
    else {
      sentBytes = receivedBytes = 0;
      if (statistics) {
        statistics(sentBytes, receivedBytes);
      }
      connection = new WebSocket(ws);
      connection.onopen = function () {
        console.log('Connection is open');
      };

      connection.onclose = function(evt) {
        if (evt.code == 3001) {
          console.log('WS closed');
        }
        else {
          if (!evt.wasClean) {
            alert('WS connection error\nError code: ' + evt.code + '\nReason: ' + (evt.reason ? evt.reason : '?'));
            console.log('WS connection error', evt);
          };
        }
        connection = null;
      };

      // Log errors
      connection.onerror = function (evt) {
        if (connection.readyState == 1) {
          console.log('WS other error: ' + evt.type);
        }
      };

      // Log messages from the server
      connection.onmessage = function (e) {
        callback(e.data);
        receivedBytes += e.data.length;
        if (statistics) {
          statistics(sentBytes, receivedBytes);
        }
      };
    }
  }

  function stop() {
    if (connection) {
      connection.close();
    }
  }

  return {
    start: function() {
      if (ws) {
        start();
      }
    },
    stop: function() {
      stop();
    },
    send: function(msg) {
      send(msg);
    }
  }

}
