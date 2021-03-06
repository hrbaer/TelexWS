/*
  T E L E X   W S

  A most simple teleprinter Web app.

  Author
  H. R. Baer
  hansruedi.baer@bluewin.ch

  Version 0.1
  18/10/2016
*/

window.addEventListener('load', function(evt) {

  console.log('Telex JS', new Date());

  const SERVER = 'ws://www.ursamedia.ch:8080';
  // const SERVER = 'ws://localhost:8080';

  const SCRIPT = 'telex.js';

  // Helper functions
  function $(selector) {
    return document.querySelector(selector);
  }


  // Place text cursor at end
  function placeCaretAtEnd(el) {
    el.focus();
    if (typeof window.getSelection != 'undefined' && typeof document.createRange != 'undefined') {
      var range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }
    else if (typeof document.body.createTextRange != 'undefined') {
      var textRange = document.body.createTextRange();
      textRange.moveToElementText(el);
      textRange.collapse(false);
      textRange.select();
    }
  }


  // Populate the participant list
  function fillParticipantList(list) {
    var panel = $('#participant-list');
    while (panel.hasChildNodes()) {
      panel.removeChild(panel.lastChild);
    }
    list.forEach(function(entry) {
      var div = document.createElement('div');
      div.textContent = entry;
      panel.appendChild(div);
    })
  }


  // Show statistics of transmitted bytes
  function Statistics() {
    var labelSent = $('#label-sent');
    var labelReceived = $('#label-received');
    var labelElapsed = $('#label-elapsed');
    return function(sent, received, elapsed) {
      labelSent.textContent = sent;
      labelReceived.textContent = received;
      if (elapsed != undefined) {
        labelElapsed.textContent = elapsed;
      }
    }
  }
  var showStatistics = Statistics();


  var telexId = localStorage.getItem('telex-id');
  if (telexId) {
    $('#telex-id').textContent = telexId;
  }


  var display = $('#display');
  var result = $('#result');
  var viewer = $('#viewer');


  // Telex id changed
  $('#telex-id').addEventListener('input', function(event) {
    localStorage.setItem('telex-id', $('#telex-id').textContent);
  });


  // Fullscreen button
  $('#fullscreen-button').addEventListener('click', function(event) {
    var isFullScreen = toggleFullScreen();
    this.classList[isFullScreen ? 'add' : 'remove']('on');
  });


  // Connect button
  $('#connect-button').addEventListener('click', function(event) {
    this.classList.toggle('connected');
    this.classList.toggle('disconnected');
    if (this.classList.contains('connected')) {
      this.value = 'Disconnect';
      var id = $('#telex-id').textContent;
      wsClient = WSClient(SERVER + '/' + SCRIPT + '?project=' + id, receiver, showStatistics);
      wsClient.start();
      display.focus();
    }
    else {
      this.value = 'Connect';
      wsClient.stop();
    }
  });


  // Clear display
  $('#clear-button').addEventListener('click', function(event) {
    display.textContent = '';
  });


  // Reset statistics
  $('#reset-button').addEventListener('click', function(event) {
    if (wsClient) {
      wsClient.reset();
    }
  });


  // Who are you button
  $('#wry-button').addEventListener('click', function(event) {
    if (wsClient) {
      wsClient.send(JSON.stringify({ cmd: 'wry' }));
    }
  });


  $('#viewer').addEventListener('click', function(evt) {
    display.focus();
  })

  $('#viewer').addEventListener('touchstart', function(evt) {
    display.focus();
  })


  display.addEventListener('keydown', function(evt) {
    if (wsClient && evt.keyCode == 0x08 && display.textContent.length > 0) {
      wsClient.send(JSON.stringify({ key: evt.keyCode }));
      evt.preventDefault();
      evt.stopPropagation();
    }
  })

  display.addEventListener('keypress', function(evt) {
    if (wsClient && evt.ctrlKey == false && evt.metaKey == false) {
      wsClient.send(JSON.stringify({ key: evt.keyCode }));
      evt.preventDefault();
      evt.stopPropagation();
    }
  })

  display.addEventListener('paste', function(evt) {
    if (!wsClient) { return }
    var text = evt.clipboardData.getData('text/plain');
    wsClient.send(JSON.stringify({ txt: text }));
    evt.preventDefault();
    evt.stopPropagation();
  });


  viewer.addEventListener('dragover', function(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    evt.dataTransfer.dropEffect = 'copy';
  });

  viewer.addEventListener('dragenter', function(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    // document.getElementById('dropScript').classList.add('hilite');
  });

  viewer.addEventListener('dragleave', function(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    // document.getElementById('dropScript').classList.remove('hilite');
  });

  viewer.addEventListener('drop', function(evt) {
    if (!wsClient) { return }
    evt.stopPropagation();
    evt.preventDefault();
    var files = evt.dataTransfer.files;
    if (files.length > 0) {
      for (var i = 0, file; file = files[i]; i++) {
        if (file.type.match(/text/)) {
          console.log(file);
          var reader = new FileReader();
          reader.onload = function(e) {
            wsClient.send(JSON.stringify({ txt: e.target.result }));
          }
          reader.readAsText(file);
        }
        else {
          alert('Type "' + file.type + '" not supported!');
        }
      }
    }
    else {
      var text = evt.dataTransfer.getData('text');
      if (text) {
        wsClient.send(JSON.stringify({ txt: text }));
      }
    }
  });


  // Receive data from Web socket server
  function receiver(data) {
    var msg = JSON.parse(data);
    var text = display.textContent;
    if (msg.key !== undefined) {
      switch (msg.key) {
      case 0x08:
        display.textContent = text.substr(0, text.length - 1);
        break;
      case 0x0d:
        display.textContent = text + '\n';
        break;
      default:
        display.textContent = text + String.fromCharCode(msg.key);
        break;
      }
    }
    else if (msg.txt) {
      display.textContent = text + msg.txt;
    }
    else if (msg.origin) {
      fillParticipantList(msg.origin);
    }
    placeCaretAtEnd(display);
  }

});