'use babel';

import RemoteCompileView from './remote-compile-view';
import { CompositeDisposable } from 'atom';
let Hjson = require('hjson');
const fs = require('fs');
var net = require('net');
var client = new net.Socket();
let hostname = "";
let connected = false;

client.setTimeout(5e3, () => client.destroy());
client.once('connect', () => client.setTimeout(0));

client.on('data', function(data) {
  //console.log('Received: ' + data);
  var jsondata = JSON.parse(data);
  console.log(jsondata.form);
  console.log(jsondata.content);
  //client.destroy();
});

client.on('close', function() {
  console.log('Connection closed');
  atom.notifications.addWarning('remote-compile: Closed connection to ' + hostname)
  connected = false;
});


export default {

  remoteCompileView: null,
  modalPanel: null,
  subscriptions: null,

  activate(state) {
    this.remoteCompileView = new RemoteCompileView(state.remoteCompileViewState);
    this.modalPanel = atom.workspace.addModalPanel({
      item: this.remoteCompileView.getElement(),
      visible: false
    });

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'remote-compile:toggle': () => this.toggle()
    }));
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'remote-compile:changeproject': () => this.changeproject()
    }));
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'remote-compile:run': () => this.run()
    }));
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'remote-compile:kill': () => this.kill()
    }));
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'remote-compile:disconnect': () => this.kill()
    }));
  },

  deactivate() {
    this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.remoteCompileView.destroy();
    client.destroy();
  },

  serialize() {
    return {
      remoteCompileViewState: this.remoteCompileView.serialize()
    };
  },

  toggle() {
    console.log('RemoteCompile was toggled!');
    atom.notifications.addSuccess('Loading...')
    if(!connected){
      /*function readFile(_callback){
        atom.notifications.addSuccess(__filename + 'Reading File...')

        fs.readFile((__dirname + '../.ftpconfig2'), "utf8", (err, data) => {
            if (err) atom.notifications.addSuccess(err);
            let obj = Hjson.parse(data);
            hostname =  obj.host
            console.log(obj.host)
            console.log('2.' + hostname)
            atom.notifications.addSuccess('Hostname: ' + hostname)
            _callback();
        });
      }

      atom.notifications.addSuccess('Opening File...')
      readFile(function functionName() {
        client.connect(4303, hostname, function() {
        console.log('Connected');
        connected = true;
        atom.notifications.addSuccess('remote-compile: Connected to ' + hostname)
        setTimeout(function(){client.write('login huso geheim77');}, 100);
        //client.write('ls ');
      })*/
      client.connect(4303, hostname, function() {
      console.log('Connected');
      connected = true;
      atom.notifications.addSuccess('remote-compile: Connected to ' + hostname)
      setTimeout(function(){client.write('login huso geheim77');}, 100);
      });
    }else{
      client.destroy();
    }
    return (
      //this.modalPanel.isVisible() ?
      this.modalPanel.hide() //:
      //this.modalPanel.show()
    );
  },

  changeproject() {
    console.log('RemoteCompile was toggled!');
    if(connected){
        client.write("cd ecer19");
        atom.notifications.addSuccess('Changed dir');
    }else{
      atom.notifications.addWarning('Not Connected');
    }

    return (
      //this.modalPanel.isVisible() ?
      this.modalPanel.hide() //:
      //this.modalPanel.show()
    );
  },

  run() {
    console.log('RemoteCompile was toggled!');
    if(connected){
        client.write("run");
        atom.notifications.addSuccess('run')
    }else{
      atom.notifications.addWarning('Not Connected')
    }

    return (
      //this.modalPanel.isVisible() ?
      this.modalPanel.hide() //:
      //this.modalPanel.show()
    );
  },

  kill() {
    console.log('RemoteCompile was toggled!');
    if(connected){
        client.write("kill")
        atom.notifications.addSuccess('kill')
    }else{
      atom.notifications.addWarning('Not Connected')
    }

    return (
      //this.modalPanel.isVisible() ?
      this.modalPanel.hide() //:
      //this.modalPanel.show()
    );
  },

  disconnect() {
    console.log('RemoteCompile was toggled!');
    if(connected){
        client.destroy();
        atom.notifications.addSuccess('Disconnected')
    }else{
      atom.notifications.addWarning('Not Connected')
    }

    return (
      //this.modalPanel.isVisible() ?
      this.modalPanel.hide() //:
      //this.modalPanel.show()
    );
  }


};
