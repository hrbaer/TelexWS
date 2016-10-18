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
    if (typeof window.getSelection != "undefined" && typeof document.createRange != "undefined") {
      var range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }
    else if (typeof document.body.createTextRange != "undefined") {
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
    return function(sent, received) {
      labelSent.textContent = sent;
      labelReceived.textContent = received;
    }
  }
  var showStatistics = Statistics();


  var telexId = localStorage.getItem('telex-id');
  if (telexId) {
    $('#telex-id').textContent = telexId;
  }


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
      wsClient = WSClient(SERVER + '/' + SCRIPT + '?id=' + id, receiver, showStatistics);
      wsClient.start();
      $('#display').focus();
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


  // Who are you button
  $('#wry-button').addEventListener('click', function(event) {
    wsClient.send(JSON.stringify({ cmd: 'wry' }));
  });


  $('#viewer').addEventListener('click', function(evt) {
    $('#display').focus();
  })

  $('#viewer').addEventListener('touchstart', function(evt) {
    $('#display').focus();
  })


  $('#display').addEventListener('keydown', function(evt) {
    if (evt.keyCode == 0x08 && display.textContent.length > 0) {
      wsClient.send(JSON.stringify({ key: evt.keyCode }));
      evt.preventDefault();
      evt.stopPropagation();
    }
  })

  $('#display').addEventListener('keypress', function(evt) {
    if (evt.ctrlKey == false && evt.metaKey == false) {
      wsClient.send(JSON.stringify({ key: evt.keyCode }));
      evt.preventDefault();
      evt.stopPropagation();
    }
  })


  var display = document.querySelector('#display');
  var result = document.querySelector('#result');


  // Receive data from Web socket server
  function receiver(data) {
    var msg = JSON.parse(data);
    console.log(msg);
    if (msg.key !== undefined) {
      var text = display.textContent;
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
      placeCaretAtEnd(display);
    }
    else if (msg.origin) {
      console.log(msg.origin);
      fillParticipantList(msg.origin);
    }
    
  }

});