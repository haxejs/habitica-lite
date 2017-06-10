import { BootScript } from '@mean-expert/boot-script';
var Agenda:any = require('agenda');
var Agendash:any = require('agendash');


@BootScript()
class Root {
    constructor(app: any) {
        app.agenda = new Agenda({processEvery: '1 minute'});

        function index(req:any,res:any) {
	  var path = __dirname + '/../../' + 'client/dist/index.html';
	  var fs   = require("fs");
    	  var input = fs.readFileSync(path, 'utf-8');
	  res.send(input);
	}
        
        var router = app.loopback.Router();
        router.get('/status', app.loopback.status());
        router.use('/agendash', Agendash(app.agenda));

        router.get('/',index);
  	router.get('/map',index);
	router.get('/todos',index);
  	router.get('/donor',index);
  	router.get('/donor/*',index);
        app.use(router); 

        function graceful() {
	  app.agenda.stop(function() {
	    process.exit(0);
	  });
	}
	process.on('SIGTERM', graceful);
	process.on('SIGINT' , graceful);
    }
}

module.exports = Root;
