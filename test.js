

/*let net = require('net');
let hostname = "";

let Hjson = require('hjson');
const fs = require('fs');

function firstFunction(_callback){
  console.log('1.' + hostname)
  fs.readFile('.ftpconfg2', "utf8", (err, data) => {
      if (err) throw err;
      let obj = Hjson.parse(data);
      hostname =  obj.host
      console.log(obj.host)
      console.log('2.' + hostname)
      _callback();
  });
}


firstFunction(function functionName() {
  console.log('3.' + hostname);
})

setTimeout(function(){console.log('4.' + hostname)}, 100);*/
/*
var client = new net.Socket();
client.setTimeout(5e3, () => client.destroy());
client.once('connect', () => client.setTimeout(0));
client.connect(4303, this.hostname, function() {
	console.log('Connected' + hostname);
	setTimeout(function(){client.write('login sdfsf geheim77');}, 100);
	//client.write('ls ');
});

client.on('data', function(data) {
	//console.log('Received: ' + data);
	var jsondata = JSON.parse(data);
	console.log(jsondata.form);
	console.log(jsondata.content);
	//client.destroy();
});

client.on('close', function() {
	console.log('Connection closed');
});

setTimeout(function(){console.log('fick mein leben');
											client.write('cd ecer19');}, 500);

setTimeout(function(){client.write('run');}, 500);

setTimeout(function(){client.write('kill');}, 5000);
*/
