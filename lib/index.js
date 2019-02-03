'use babel';

/*
  LIBS
*/
let Hjson = require('hjson');
const fs = require('fs');
let net = require('net');

let wait = ms => new Promise((r, j)=>setTimeout(r, ms))
let client = new net.Socket();

/*
  GLOBAL VARS
*/
let hostname = "";        // hostname read form config file
let jsondata = null;      // parsed json string from rccp
let connected = false;    // connectivity status
let lastFunc = 'init';    // declares latest function
let done = false;         // check if command is done

client.setTimeout(5e3, () => client.destroy());
client.once('connect', () => client.setTimeout(0));

/*atom.notifications.addError("error")
atom.notifications.addInfo("inf")
atom.notifications.addSuccess("succ")
atom.notifications.addWarning("warning")*/

/*
  Function that handles rccps output and outputs a corresponding notification
*/
client.on('data', function(data) {
  // Trying to parse (Server sometimes returns 2 strings in a row)
  try {
    jsondata = JSON.parse(data);
  }
  catch(err) {
    atom.notifications.addError("🗿 JSON Parsing Error. Client too fast for server. " + err)
    return;
  }
  if(lastFunc == ''){
    if(jsondata.form == 'connected'){
      //connected
    }else{
      atom.notifications.addWarning(jsondata.form + " " + jsondata.content);
    }

  }else if(lastFunc == 'changeproject'){
    if(jsondata.form == 'notfound'){
      atom.notifications.addError("Project not Found!");
    }else if(jsondata.form == 'granted'){
      let tmp = jsondata.content
      atom.notifications.addSuccess("Changed Project: " + tmp.name + " | " + tmp.desc + "\n | Lang: " + tmp.lang)
    }else{
      atom.notifications.addWarning("Unknown Error");
    }

  }else if(lastFunc == 'run'){
    if(jsondata.form == 'makefail'){
      atom.notifications.addError("Make unable to build!");
    }else if (jsondata.form == 'cmakefail'){
      atom.notifications.addError("CMake unable to build!");
    }else if (jsondata.form == 'alreadyrunning'){
      atom.notifications.addError("Something is already Running!");
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
  lastFunc = '';
  running = false;
});

/*
  DC
*/
client.on('close', function() {
  console.log('Connection closed');
  if(connected){
    connected = false;
    atom.notifications.addWarning('remote-compile: Closed Connection to ' + hostname + ".")
  } else {
    require('dns').resolve(hostname, function(err) {
      if (err) {
        atom.notifications.addError("remote-compile: " + hostname + " is Offline.")
      }else{
        atom.notifications.addError("remote-compile is probably not running on " + hostname + ".")
      }
    });
  }
  running = true;
  lastFunc = '';
});

export default {
  subscriptions: null,

  activate(state) {
    this.subscriptions = new CompositeDisposable();

    /*
      uff
    */
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
  },

  deactivate() {
    client.destroy();
  },

  serialize() {
    // uff
  },

  /*
    Toggles Connection - Reads hostname from file, attempts to connect / disconnects.
  */
  toggle() {
  if(!connected){
    console.log('rc toggle');
      function readFile(_callback){
        fs.readFile((atom.project.getPaths() + "/.ftpconfig2"), "utf8", (err, data) => {
            if (err) atom.notifications.addWarning(err);
            let obj = Hjson.parse(data);
            hostname =  obj.host
            console.log(obj.host)
            console.log(hostname)
            _callback();
        });
      }

      readFile(function functionName() {
        client.connect(4303, hostname, function() {
          console.log('Connected');
          atom.notifications.addSuccess('remote-compile: Connected to ' + hostname)
          connected = true;
          setTimeout(function(){client.write('login skip geheim77');}, 100);
        })
        lastFunc = 'connect';
      });
  }else{
    client.write('exit');
  }
  },

  /*
    Changes the current project folder corresponding to the current file.
  */
  changeproject() {
    console.log('rc changeproject');
    if(!connected){
      atom.notifications.addError('Not Connected.');
      return;
    }
    if(running){
      atom.notifications.addWarning("Something else is currently Running");
      return;
    }
    let isWin = process.platform === "win32";
    let cond = null;

    if(isWin){
      cond = /([^\\]*)\\*$/
    }else{
      cond = /([^\/]*)\/*$/
    }

    let projname = ""
    let pathy = path.dirname(atom.workspace.getActiveTextEditor().getPath());
    pathy = path.join(pathy + "/..")
    let name = null;
    name = pathy.match(cond)[1]
    projname = "-" + name;
    pathy = path.join(pathy + "/..")
    name = pathy.match(cond)[1]
    projname = name + projname;

    //client.write("cd " + projname.replace(" ", "-"))
    client.write("cd ecer19")
    lastFunc = 'changeproject';
    running = true;
  },

  /*
    Runs the current project
  */
  run() {

    /*
      TODO: Auto Proj.Change - cant rn need to test on wallaby
    */
    console.log('RemoteCompile was toggled!');
    if(!connected){
      atom.notifications.addError('Not Connected.');
      return;
    }
    if(running){
      atom.notifications.addWarning("Something else is currently Running");
      return;
    }
    client.write("run");
    atom.notifications.addInfo("Starting...")
    lastFunc = 'run';
    running = true;
  },

  /*
    Kills the current process
  */
  kill() {
    console.log('RemoteCompile was toggled!');
    if(!connected){
      atom.notifications.addError('Not Connected.');
      return;
    }
    if(running){
      atom.notifications.addWarning("Something else is currently Running");
      return;
    }
    client.write("kill");
    atom.notifications.addInfo("Killing Process...");
    running = true;
    lastFunc = 'kill';
  }

};
