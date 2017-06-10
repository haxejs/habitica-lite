/**
 * Created by kshi on 17-4-2.
 */

import { Model } from '@mean-expert/model';

@Model({
  hooks: {
  },
  remotes: {
  	customCreate: {
      accessType: 'WRITE',
      description: 'user creates a new private award',
      returns : { arg: 'result', type: 'Award',root:true},
      accepts: [
	      {
	        arg: 'userId',
	        type: 'string',
	        http: function(ctx:any) {
	          // HTTP request object as provided by Express.js
	          var request = ctx.req;
	          return request.accessToken.userId.toString();
	        }
	      },
	      {
	      	arg: 'data', 
	      	type:'Award',
	      	http: {source: 'body'}
	      }
	  ],
      http    : { path: '/create', verb: 'post' }
    }
  }
})
class Award {
  // LoopBack model instance is injected in constructor
  constructor(public model:any) {
  	this.disableRemoteMethods();
    this.setupPrototypeMethods();
    this.registerPrototypeMethods();
  }

  disableRemoteMethods(){
     this.model.disableRemoteMethod('__get__user', false);
  }

  setupPrototypeMethods(){
    this.model.prototype.exchange = function(next:Function){
      this.user((err:any,user:any)=>{
        if (err || !user) return next(err,user);
        if (user.growth.gp<this.value){
          next(new Error("No enough golden points to exchange!"));
        }else{
          user.growth.gp = user.growth.gp - this.value;
          user.save({skipUnsetProperties:true},(err:any)=>{
            next(err,{growth:user.growth});
          });
        }        
      });
    };
  }

  registerPrototypeMethods(){
    this.model.remoteMethod('exchange', {
      isStatic:false,
      description: 'exchange this award by golden points or gems',
      accessType: 'WRITE',
      http: [
        {verb: 'put', path: '/exchange'}
      ],
      returns: {arg: 'score', type: 'Score',root: true}
    });
  }

  customCreate(userId:string,data:any,next: Function): void {
    data = data || {};
    data.userId = userId;
    this.model.create(data,next);
  }
}

module.exports = Award;
