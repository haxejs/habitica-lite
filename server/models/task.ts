/**
 * Created by kshi on 17-4-2.
 */

import { Model } from '@mean-expert/model';
var moment = require('moment');

const MAX_TASK_VALUE = 21.27;
const MIN_TASK_VALUE = -47.27;
const CLOSE_ENOUGH = 0.00001;

function _getTaskValue (taskValue:number) {
  if (taskValue < MIN_TASK_VALUE) {
    return MIN_TASK_VALUE;
  } else if (taskValue > MAX_TASK_VALUE) {
    return MAX_TASK_VALUE;
  } else {
    return taskValue;
  }
}

// Calculates the next task.value based on direction
// Uses a capped inverse log y=.95^x, y>= -5
function _calculateDelta (task:any, direction:string) {
  // Min/max on task redness
  let currVal = _getTaskValue(task.value);
  let nextDelta = Math.pow(0.9747, currVal) * (direction === 'down' ? -1 : 1);

  // Checklists
  if (task.checklist && task.checklist.length > 0) {
    // If the Daily, only dock them a portion based on their checklist completion
    if (direction === 'down' && task.category === 'daily') {
      nextDelta *= 1 - task.checklist.reduce((m:number, i:any) => m + (i.completed ? 1 : 0), 0) / task.checklist.length;
    }

    // If To-Do, point-match the TD per checklist item completed
    if (task.category === 'todo') {
      nextDelta *= 1 + task.checklist.reduce((m:number, i:any) => m + (i.completed ? 1 : 0), 0);
    }
  }

  return nextDelta;
}

// Approximates the reverse delta for the task value
// This is meant to return the task value to its original value when unchecking a task.
// First, calculate the value using the normal way for our first guess although
// it will be a bit off
function _calculateReverseDelta (task:any) {
  let currVal = _getTaskValue(task.value);
  let testVal = currVal + Math.pow(0.9747, currVal);

  // Now keep moving closer to the original value until we get "close enough"
  // Check how close we are to the original value by computing the delta off our guess
  // and looking at the difference between that and our current value.
  while (true) { // eslint-disable-line no-constant-condition
    let calc = testVal + Math.pow(0.9747, testVal);
    let diff = currVal - calc;

    if (Math.abs(diff) < CLOSE_ENOUGH) break;

    if (diff > 0) {
      testVal -= diff;
    } else {
      testVal += diff;
    }
  }

  // When we get close enough, return the difference between our approximated value
  // and the current value.  This will be the delta calculated from the original value
  // before the task was checked.
  let nextDelta = testVal - currVal;

  // Checklists - If To-Do, point-match the TD per checklist item completed
  if (task.checklist && task.checklist.length > 0 && task.category === 'todo') {
    nextDelta *= 1 + task.checklist.reduce((m:number, i:any) => m + (i.completed ? 1 : 0), 0);
  }

  return nextDelta;
}

// HP modifier
// ===== CONSTITUTION =====
// TODO Decreases HP loss from bad habits / missed dailies by 0.5% per point.
function _subtractPoints (user:any, task:any, delta:number) {
  let conBonus = 1 - user.growth.con / 250;
  if (conBonus < 0.1) conBonus = 0.1;

  let hpMod = delta * conBonus * task.priority * 2; // constant 2 multiplier for better results
  user.growth.hp += Math.round(hpMod * 10) / 10; // round to 1dp
  return user.growth.hp;
}

function _addPoints (user:any, task:any, delta:number) {
  // Exp Modifier
  // ===== Intelligence =====
  // TODO Increases Experience gain by .2% per point.
  let intBonus = 1 + user.growth.int * 0.025;
  user.growth.exp += Math.round(delta * intBonus * task.priority  * 6);

  // GP modifier
  // ===== PERCEPTION =====
  // TODO Increases Gold gained from tasks by .3% per point.
  let perBonus = 1 + user.growth.per * 0.02;
  let gpMod = delta * task.priority  * perBonus;

  if (task.streak) {
    let streakBonus = task.streak / 100 + 1; // eg, 1-day streak is 1.01, 2-day is 1.02, etc
    let afterStreak = gpMod * streakBonus;
    user.growth.gp += afterStreak;
  } else {
    user.growth.gp += gpMod;
  }
}


@Model({
  hooks: {
    beforeSave: { name: 'before save', type: 'operation' },
    afterSave: { name: 'after save', type: 'operation' },
    beforeDelete: { name: 'before delete', type: 'operation' }
  },
  remotes: {
  	createHabit: {
      accessType: 'WRITE',
      description: 'create new habit task',
      returns : { arg: 'result', type: 'Task',root:true},
      accepts: [
	      {
	        arg: 'userId',
	        type: 'string',
	        http: function(ctx:any) {
	          // HTTP request object as provided by Express.js
	          var request = ctx.req;
	          return request.accessToken?request.accessToken.userId.toString():null;
	        }
	      },
	      {
	      	arg: 'data', 
	      	type:'Habit',
	      	http: {source: 'body'}
	      }
	    ],
      http    : { path: '/createHabit', verb: 'post' }
    },
    createDaily: {
      accessType: 'WRITE',
      description: 'create new daily task',
      returns : { arg: 'result', type: 'Task',root:true},
      accepts: [
        {
          arg: 'userId',
          type: 'string',
          http: function(ctx:any) {
            // HTTP request object as provided by Express.js
            var request = ctx.req;
            return request.accessToken?request.accessToken.userId.toString():null;
          }
        },
        {
          arg: 'data', 
          type:'Daily',
          http: {source: 'body'}
        }
      ],
      http    : { path: '/createDaily', verb: 'post' }
    },
    createTodo: {
      accessType: 'WRITE',
      description: 'create new todo task',
      returns : { arg: 'result', type: 'Task',root:true},
      accepts: [
        {
          arg: 'userId',
          type: 'string',
          http: function(ctx:any) {
            // HTTP request object as provided by Express.js
            var request = ctx.req;
            return request.accessToken?request.accessToken.userId.toString():null;
          }
        },
        {
          arg: 'data', 
          type:'Todo',
          http: {source: 'body'}
        }
      ],
      http    : { path: '/createTodo', verb: 'post' }
    }
  }
})
class Task {
  // LoopBack model instance is injected in constructor
  constructor(public model:any) {
  	this.disableRemoteMethods();
    this.setupPrototypeMethods();
    this.registerPrototypeMethods();
  }

  setupPrototypeMethods(){
    this.model.prototype.scoreUp = function(next:Function){
      if (this.category !== 'habit' && this.completed) return next(new Error('Task already marked done'));
      this.user((err:any,user:any)=>{
        if (err || !user) return next(err,{});

        _addPoints(user,this,_calculateDelta(this,'up'));
        user.save({skipUnsetProperties:true});

        if (this.category === 'habit') this.counterUp++;
        if (this.category === 'daily') {
          this.streak++;
          this.completed = true;
        }
        if (this.category === 'todo') {
          this.completed = true;
        }
        this.save({skipUnsetProperties:true});       
        
        next(null,{growth:user.growth,task:this});
      });
    };
    this.model.prototype.scoreDown = function(next:Function){
      if (this.category !== 'habit' && !this.completed) return next(new Error('Task already marked not done'));
      this.user((err:any,user:any)=>{
        if (err || !user) return next(err,{});
        if (this.category === 'habit') {
          this.counterDown++;
          _subtractPoints(user,this,_calculateDelta(this,'down'));
        }
        if (this.category === 'daily') {
          this.completed = false;          
          this.streak--;
          _addPoints(user,this,_calculateReverseDelta(this));
        }
        if (this.category === 'todo' && !this.completed) {
          this.completed = false;
          _addPoints(user,this,_calculateReverseDelta(this));
        }
        this.save({skipUnsetProperties:true});       
        user.save({skipUnsetProperties:true}); 
        next(null,{growth:user.growth});
      });
    };
    this.model.prototype.punishDailyTask = function(next:Function){
      if (this.category !== 'daily' || this.completed) return next();//ignore
      this.user((err:any,user:any)=>{
        if (err || !user) return next(err,{});
        _subtractPoints(user,this,_calculateDelta(this,'down'));
        user.save({skipUnsetProperties:true}); 
        next(null,{growth:user.growth});
      });
    };
  }

  registerPrototypeMethods(){
    this.model.remoteMethod('scoreUp', {
      isStatic:false,
      description: 'mark the task completed or increase positive counter',
      accessType: 'WRITE',
      http: [
        {verb: 'put', path: '/scoreUp'}
      ],
      returns: {arg: 'score', type: 'Score',root: true}
    });
    this.model.remoteMethod('scoreDown', {
      isStatic:false,
      description: 'mark the task uncompleted or increase negative counter',
      accessType: 'WRITE',
      http: [
        {verb: 'put', path: '/scoreDown'}
      ],
      returns: {arg: 'score', type: 'Score',root: true}
    });
  }

  disableRemoteMethods(){
     this.model.disableRemoteMethod('__get__user', false);
  }

  reScheduleDailyRemindTimes(data:any,instance:any){
    if (data.remindTimes && JSON.stringify(data.remindTimes.sort()) != JSON.stringify(instance.remindTimes.sort())){
      this.model.app.agenda.cancel({'name': 'taskRemind','data.taskId':instance.id.toString()},()=>{
        data.remindTimes.forEach((time:string)=>{
          var job = this.model.app.agenda.create('taskRemind', {taskId: instance.id.toString(),text:data.text || instance.text});
          job.repeatAt(time);
          job.save();
        });
      });
    }       
  }

  reScheduleTodoReminders(data:any,instance:any){
    if (data.reminders && JSON.stringify(data.reminders.sort()) != JSON.stringify(instance.reminders.sort())){
      this.model.app.agenda.cancel({'name': 'taskRemind','data.taskId':instance.id.toString()},()=>{
        data.reminders.forEach((d:string)=>{
          var job = this.model.app.agenda.create('taskRemind', {taskId: instance.id.toString(),text:data.text || instance.text});
          job.schedule(moment(d,"YYYY-MM-DD HH:mm").toDate());
          job.save();
        });
      });
    }    
  }

  beforeSave(ctx: any, next: Function): void {
    if (!ctx.isNewInstance){//object is updating
      if (ctx.currentInstance.category=='daily'){
        this.reScheduleDailyRemindTimes(ctx.data,ctx.currentInstance);
      }
      if (ctx.currentInstance.category=='todo'){
        this.reScheduleTodoReminders(ctx.data,ctx.currentInstance);
      }
    }
    next();
  }

  afterSave(ctx: any, next: Function): void {
    if (!ctx.isNewInstance) return next();
    //object is new created
    if (ctx.instance.category=='daily'){
      ctx.instance.remindTimes.forEach((time:string)=>{
        var job = this.model.app.agenda.create('taskRemind', {taskId: ctx.instance.id.toString(),text:ctx.instance.text});
        job.repeatAt(time);
        job.save();
      });
    }
    if (ctx.instance.category=='todo'){
      ctx.instance.reminders.forEach((d:string)=>{
        var job = this.model.app.agenda.create('taskRemind', {taskId: ctx.instance.id.toString(),text:ctx.instance.text});
        job.schedule(moment(d,"YYYY-MM-DD HH:mm").toDate());
        job.save();
      });
    }
    next();
  }

  beforeDelete(ctx: any, next: Function): void {
    if(ctx.where && ctx.where.id){
      this.model.app.agenda.cancel({'name': 'taskRemind','data.taskId':ctx.where.id});
    }
    next();
  }

  //attention: different type mapping, need hack to use __data property
  //TODO:maybe should try setAttribute function
  createHabit(userId:string,data:any,next: Function): void {
    data.__data.userId = userId;
    data.__data.category = 'habit';
    this.model.create(data.__data,{skipUnsetProperties:true},next);
  }

  createDaily(userId:string,data:any,next: Function): void {
    data.__data.userId = userId;
    data.__data.category = 'daily';
    this.model.create(data.__data,{skipUnsetProperties:true},next);
  }

  createTodo(userId:string,data:any,next: Function): void {
    data.__data.userId = userId;
    data.__data.category = 'todo';
    this.model.create(data.__data,{skipUnsetProperties:true},next);
  }
}

module.exports = Task;
