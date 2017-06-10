import { Model } from '@mean-expert/model';
var Agenda:any = require('agenda');
var Agendash:any = require('agendash');

@Model({
  hooks: {
  },
  remotes: {
  }
})
class AgendaJobs {
  // LoopBack model instance is injected in constructor
  constructor(public model:any) {
  	model.getApp(function(err:any,app:any){
      model.dataSource.connect(function(err:any,db:any){
        var agenda = app.agenda;
        if (db){
        	agenda.mongo(db);
        }else{
        	//agenda.database('localhost:27017/agenda');
        	console.error("can not get mongo db connection!");
        }

        agenda.define('taskRemind',(job:any,done:Function)=>{
          app.models.Task.findById(job.attrs.data.taskId,function(err:any,task:any){
            if (err || !task) return done();
          	console.log('taskRemind on taskId:' + task.id);
          	if (task.completed) return done();//do not remind if completed
          	//send weixin message or send notification
	      	  done();
          });	      
	      });
        
        agenda.define('dailyCheckout', function(job:any, done:Function) {
    		  app.models.user.findById(job.attrs.data.userId,function(err:any,user:any){
            if (err || !user) return done();
    		  	console.log('dailyCheckout on userId:' + user.id);
    		  	if (user.startVacation && user.vacations>0){
              user.vacations--;
              user.save({skipUnsetProperties:true});
              return done();//the uncompleted dailies do not harm if taking vacation
            } 
    		  	//check uncompleted dailies,punish harm on user's blood
            let latestGrowth = user.growth;
            let uncompletedDailyTasks:any[] = [];
            user.tasks.forEach((task:any)=>{
              if (task.category==='daily'){
                if (!task.completed){
                  uncompletedDailyTasks.push(task);
                  task.punishDailyTask((err:any,score:any)=>{latestGrowth = score.growth});//punish
                }else{
                  task.completed = false;//reset
                  task.save({skipUnsetProperties:true});
                }
              }
            });
    		  	//send weixin message or send notification of the harm summary?
    	      done();
    		  });
    		});

    		agenda.on('ready', function() {		  
    		  agenda.start();

    		  var baseUrl = (app.get('httpMode')? 'http://' : 'https://') + app.get('host') + ':' + app.get('port');
    		  console.log("Agenda started,check agenda jobs at %s/agendash/", baseUrl);
    		});
      });
    });
  }
}

module.exports = AgendaJobs;
