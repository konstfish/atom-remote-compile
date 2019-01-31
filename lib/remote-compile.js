'use babel';

import RemoteCompileView from './remote-compile-view';
import { CompositeDisposable } from 'atom';
let Hjson = require('hjson');
const fs = require('fs');
var net = require('net');
var wait = ms => new Promise((r, j)=>setTimeout(r, ms))
var client = new net.Socket();
let hostname = "";
let jsondata = null;
let connected = false;
let lastFunc = 'init';

client.setTimeout(5e3, () => client.destroy());
client.once('connect', () => client.setTimeout(0));

/*atom.notifications.addError("error")
atom.notifications.addInfo("inf")
atom.notifications.addSuccess("succ")
atom.notifications.addWarning("warning")*/

client.on('data', function(data) {
  //console.log('Received: ' + data);
  jsondata = JSON.parse(data);
  if(lastFunc == ''){
    atom.notifications.addWarning(jsondata.form + " " + jsondata.content);

  }else if(lastFunc == 'changeproject'){
    if(jsondata.form == 'notfound'){
      atom.notifications.addError("Project not Found!");
    }else if(jsondata.form == 'granted'){
      let tmp = jsondata.content
      atom.notifications.addSuccess("Changed Project: " + tmp.name + "\n" + tmp.desc + "\nLang: " + tmp.lang)
    }else{
      atom.notifications.addWarning("Unknown Error");
    }

  }else if(lastFunc == 'run'){
    if(jsondata.form == 'cmakefail'){
      atom.notifications.addError("CMake unable to build!");
    }else if (jsondata.form == 'alreadyrunning'){
      atom.notifications.addError("CMake unable to build!");
    }else if (jsondata.form == 'startprogram'){
      let tmp = jsondata.content
      atom.notifications.addSuccess("Started " + tmp.exec + " with PID " + tmp.pid);
    }else{
      atom.notifications.addWarning("Unknown Error");
    }

  }else if(lastFunc == 'kill'){
    if(jsondata.form == 'nothingtokill'){
      atom.notifications.addError("Nothing to Kill!");
    }else if(jsondata.form == 'stopprogram'){
      let tmp = jsondata.content
      atom.notifications.addSuccess("Stopped " + tmp.exec + " with PID " + tmp.pid);
    }else{
      atom.notifications.addWarning("Unknown Error");
    }
  }
  if(lastFunc != 'init'){
    lastFunc = 'bin retard lass mich';
  }else{
    lastFunc = '';
  }
});

client.on('close', function() {
  console.log('Connection closed');
  atom.notifications.addWarning('remote-compile: Closed Connection to ' + hostname)
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
  if(!connected){
    console.log('RemoteCompile was toggled!');
      function readFile(_callback){
        fs.readFile((atom.project.getPaths() + "/.ftpconfig2"), "utf8", (err, data) => {
            if (err) atom.notifications.addWarning(err);
            let obj = Hjson.parse(data);
            hostname =  obj.host
            console.log(obj.host)
            console.log(hostname)
            //atom.notifications.addInfo(hostname);
            _callback();
        });
      }

      readFile(function functionName() {
        client.connect(4303, hostname, function() {
          console.log('Connected');
          atom.notifications.addSuccess('remote-compile: Connected to ' + hostname)
          connected = true;
          setTimeout(function(){client.write('login huso geheim77');}, 100);
          //client.write('ls ');
        })
        lastFunc = 'connect';
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
        client.write("cd ecer19")
        atom.notifications.addInfo(atom.workspace.getActiveTextEditor().getPath());
        lastFunc = 'changeproject';
        /*wait.for.value(dataRec, 'value', 'true');
        dataRec.value = 'false';
        atom.notifications.addSuccess(jsondata.form + " " + jsondata.content);*/
    }else{
      atom.notifications.addError('Not Connected')
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
        atom.notifications.addInfo("Starting...")
        lastFunc = 'run';
        //setTimeout(function(){atom.notifications.addSuccess(jsondata.form + " " + jsondata.content);}, 5000);
    }else{
      atom.notifications.addError('Not Connected')
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
      client.write("kill");
      atom.notifications.addInfo("Killing Process...")
      lastFunc = 'kill';
      //setTimeout(function(){atom.notifications.addSuccess(jsondata.form + " " + jsondata.content);}, 5000);
    }else{
      atom.notifications.addError('Not Connected')
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
    }else{
      atom.notifications.addError('Not Connected')
    }

    return (
      //this.modalPanel.isVisible() ?
      this.modalPanel.hide() //:
      //this.modalPanel.show()
    );
  }


};
