'use babel';

/*
  LIBS
*/
import { CompositeDisposable } from 'atom';

let Hjson = require('hjson');
const fs = require('fs');
const path = require('path');
let net = require('net');

let wait = ms => new Promise((r, j)=>setTimeout(r, ms))
let client = new net.Socket();

/*
  GLOBAL VARS / SINS
*/
let hostname = "";              // hostname read form config file
let rcuser = "";                // username read form config file
let rcpassword = "";            // server password read form config file
let jsondata = null;            // parsed json string from rccp
let connected = false;          // connectivity status
let lastFunc = 'init';          // declares latest function
let curproj = '';               // declares latest function
let done = false;               // check if command is done
let configfile = ".ftpconfig";  // name of configfile

/*
  CHECK IF WIN
*/
let isWin = process.platform === "win32";
let slash = null;
if(isWin){
  slash = "\\";
}else{
  slash = "/";
}

/*
  SETTING UP TELNET CLIENT
*/
client.setTimeout(5e3, () => client.destroy());
client.once('connect', () => client.setTimeout(0));

/*
  Event that handles rccps output and outputs a corresponding notification
*/
client.on('data', function(data) {
  // Trying to parse (Server sometimes returns 2 strings in a row)
  try {
    jsondata = JSON.parse(data);
  }
  catch(err) {
    atom.notifications.addWarning('🗿 JSON Parsing Error. Client too fast for server. ', {
      detail: err,
      true,
    });
  }
  /*
    JSONDATA Handling
  */
  if(lastFunc == 'init'){
    lastFunc = '';
    return;
  }
  if(jsondata.form == 'connected'){
    atom.notifications.addSuccess('remote-compile: Connected to ' + hostname)
  }else if(jsondata.form == 'exit'){
    //
  }else if(jsondata.form == 'unprotected'){
    atom.notifications.addWarning("Server is not Password Protected!");
  }else if(jsondata.form == 'protected'){
    //
  }
  else if(jsondata.from == 'syntax'){
    atom.notifications.addWarning("Some Sort of Syntax Rrror Ocurred!");
  }else if(jsondata.form == 'wrongpasswd'){
    atom.notifications.addWarning("Wrong Password.");
  }else if(jsondata.form == 'usernametaken'){
    atom.notifications.addWarning("Username is taken.");
  }else if(jsondata.form == 'userconnect'){
    atom.notifications.addInfo("Client connected with Name: " + jsondata.content + ".");
  }else if(jsondata.form == 'userdisconnect'){
    atom.notifications.addInfo("Client disconnected with Name: " + jsondata.content + ".");
  }else if(jsondata.form == 'kick'){
    atom.notifications.addWarning("You were kicked from the server.");
  }
  /*
    PROCOUT - tmp fix
  */
  else if(jsondata.form == 'progout'){
    atom.notifications.addInfo(jsondata.content);

  }
  /*
    MESSAGE
  */
  else if(jsondata.form == 'message'){
    let tmp = jsondata.content
    atom.notifications.addInfo("Message from " + tmp.sender + ": " + tmp.message + ".");
  }else if(jsondata.form == 'notonline'){
    atom.notifications.addWarning("User not online.");
  }else if(jsondata.form == 'delivered'){
    atom.notifications.addInfo("Delivered Message.");
  }
  /*
    Change Project
  */
  else if(jsondata.form == 'notfound'){
    atom.notifications.addError("Project not Found!");
  }else if(jsondata.form == 'granted'){
    let tmp = jsondata.content
    atom.notifications.addSuccess("Changed Project: " + tmp.name + " | " + tmp.desc + "\n | Lang: " + tmp.lang)
  }
  /*
    RUN
  */
  else if(jsondata.form == 'notinaproject'){
    atom.notifications.addError("Currently not in a Project!");
  }else if(jsondata.form == 'makefail'){
    atom.notifications.addError("Make unable to build!");
    let pathy = path.dirname(atom.workspace.getActiveTextEditor().getPath());
    pathy = path.join(pathy + "/..")
    pathy = path.join(pathy += "/error-log.txt")
    setTimeout(function(){atom.workspace.open(pathy); }, 1000);
  }else if (jsondata.form == 'cmakefail'){
    atom.notifications.addError("CMake unable to build!");
  }else if (jsondata.form == 'alreadyrunning'){
    atom.notifications.addError("Something is already Running!");
  }else if (jsondata.form == 'startprogram'){
    let tmp = jsondata.content
    atom.notifications.addSuccess(tmp.issuer + " started " + tmp.exec + " with PID " + tmp.pid + ".");
  }else if (jsondata.form == 'stopprogram' && lastFunc != "kill"){
    let tmp = jsondata.content
    atom.notifications.addSuccess("Done with: " + tmp.exec + " with PID " + tmp.pid + ".");
  }
  /*
    KILL
  */
  else if(jsondata.form == 'notinproject'){
    atom.notifications.addError("Currently not in a Project!");
  }else if(jsondata.form == 'nothingtokill'){
    atom.notifications.addError("Nothing to Kill!");
  }else if(jsondata.form == 'cantkill'){
    atom.notifications.addError("Unable to kill Process.");
  }else if(jsondata.form == 'stopprogram'){
    let tmp = jsondata.content
    atom.notifications.addSuccess("Stopped " + tmp.exec + " with PID " + tmp.pid) + ".";
  }
  /*
    RELOAD
  */
  else if(jsondata.form == "updateprojects"){
    atom.notifications.addInfo("Done Reloading.");
  }else if(jsondata.form == "reloaderror"){
    atom.notifications.addError("Error Occured while reloading!");
  }
  else{
    atom.notifications.addWarning("Undefinded Condition: " + jsondata.form + " " + jsondata.content);
  }

  /*
    Reseting Variables
  */
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
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'remote-compile:reload': () => this.reload()
    }));
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'remote-compile:message': () => this.message()
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
        fs.readFile((atom.project.getPaths() + slash + configfile), "utf8", (err, data) => {
            if (err) atom.notifications.addWarning(err);
            let obj = Hjson.parse(data);
            /*
              Trying to set hostname
            */
            try{
              hostname = obj.host
            }catch(err) {
              atom.notifications.addError("Error Reading hostname from file.")
              return;
            }

            /*
              Trying to set username
            */
            try{
              rcuser = obj.rcuser
            }catch(err) {
              atom.notifications.addError("Error Reading username from file.")
              return;
            }

            /*
              Trying to set password
            */
            try{
              rcpassword = obj.rcpassword
            }catch(err) {
              atom.notifications.addError("Error Reading password from file.")
              return;
            }

            _callback();
        });
      }

      readFile(function functionName() {
        client.connect(4303, hostname, function() {
          console.log('Connected');
          connected = true;
          setTimeout(function(){client.write('login ' + rcuser + ' ' + rcpassword);}, 100);
        })
        lastFunc = 'connect';
      });
  }else{
    client.write('exit');
    lastFunc = 'init';
    running = false;
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
    curproj = projname;

    client.write("cd " + curproj.replace(" ", "-"))
    lastFunc = 'changeproject';
    running = true;
  },

  /*
    Runs the current project
  */
  run() {
    /*function readPath(_callback){
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

      if(curproj != projname){
        client.write("cd " + curproj.replace(" ", "-"))
      }
      _callback();
    }
    readPath(function functionName() {*/
    console.log('rc run');
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
    //}
  },

  /*
    Kills the current process
  */
  kill() {
    console.log('rc kill');
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
  },

  /*
    Reloads Project Config
  */
  reload() {
    console.log('rc reload');
    if(!connected){
      atom.notifications.addError('Not Connected.');
      return;
    }
    if(running){
      atom.notifications.addWarning("Something else is currently Running");
      return;
    }
    client.write("reload");
    atom.notifications.addInfo("Reloading Project Config...");
    running = true;
    lastFunc = 'reload';
  },

  /*
    Message someone david hallo
  */
  message() {
    console.log('rc message');
    if(!connected){
      atom.notifications.addError('Not Connected.');
      return;
    }
    if(running){
      atom.notifications.addWarning("Something else is currently Running");
      return;
    }
    var words = atom.clipboard.read().split(' . ');
    client.write("msg " + words[0] + ' \"' + words[1] + '\"');
    atom.notifications.addInfo("Sending Message... " + words[0] + " " + words[1]);
    running = true;
    lastFunc = 'message';
  }

};
