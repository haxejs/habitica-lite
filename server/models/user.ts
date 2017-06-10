/**
 * Created by kshi on 17-4-2.
 */

import { Model } from '@mean-expert/model';
var rest = require("restler");
var querystring = require("querystring");
var WXBizDataCrypt = require('../libs/WXBizDataCrypt')

const MAX_HP = 50;
var JSCODE2SESSION_URL = "https://api.weixin.qq.com/sns/jscode2session";
var WXAPP_APPID = "wx34802d486ed1d395";
var WXAPP_SECRET = "235f97cf9faec2fa14f967ab8421a846";
var FAKE_UNIONID = "obg64uPiiH7JAWlw6iPqFedEmrRg";//for me

@Model({
  hooks: {
    beforeSave: { name: 'before save', type: 'operation' },
    afterSave: { name: 'after save', type: 'operation' },
    beforeDelete: { name: 'before delete', type: 'operation' }
  },
  remotes: {
  	"wxAppLogin": {
      accepts: [
        {
          arg: 'payload',
          type: 'object',
          description: '{"code":"from wx.login","encryptedData":"from wx.getUserInfo","iv":"from wx.getUserInfo"}',
          http: {source: 'body'}
        }
      ],
      accessType: 'WRITE',
      description: 'weixin small app login or create user',
      returns : { arg: 'result', type: 'user', root:true },
      http    : { path: '/wxAppLogin', verb: 'post' }
    }
  }
})
class User {
  // LoopBack model instance is injected in constructor
  constructor(public model:any) {
    this.setupPrototypeMethods();
    this.registerPrototypeMethods();
    this.disableRemoteMethods();
  }

  setupPrototypeMethods(){
    this.model.prototype.profile = function(next:Function){
      //calculate some kinds of stats
      var habits = this.tasks().filter((task:any)=>{return task.category==='habit'});
      var counterUpSum = habits.reduce((sum:number,habit:any)=>{return sum+habit.counterUp;},0);
      var counterDownSum = habits.reduce((sum:number,habit:any)=>{return sum+habit.counterDown;},0);

      var dailies = this.tasks().filter((task:any)=>{return task.category==='daily'});
      var minStreak = dailies.length>0?dailies[0].streak:0;
      var maxStreak = minStreak;
      dailies.forEach((daily:any)=>{
        minStreak = Math.min(minStreak,daily.streak);
        maxStreak = Math.max(maxStreak,daily.streak);
      });

      var todos = this.tasks().filter((task:any)=>{return task.category==='todo'});

      var stats:any = {
        habits:habits.length,
        counterUpSum:counterUpSum,
        counterDownSum:counterDownSum,
        dailies:dailies.length,
        minStreak:minStreak,
        maxStreak:maxStreak,
        todos:todos.length
      };
      this.setAttribute("stats",stats);

      this.unsetAttribute("apiToken");
      this.unsetAttribute("tasks");
      this.unsetAttribute("awards");
      this.unsetAttribute("email");
      this.unsetAttribute("username");
      next(null,this);
    };

    this.model.prototype.healthPotion = function(next:Function){
      if (this.growth.gp<25) return next(new Error("Need at least 25 golden coins!"));
      this.growth.gp -= 25;
      this.growth.hp = Math.max(this.growth.hp+15,MAX_HP);
      this.save({skipUnsetProperties:true},(err:any)=>next(err,{growth:this.growth}));
    };

    this.model.prototype.bidVacation = function(next:Function){
      if (this.growth.gp<20) return next(new Error("Need at least 20 golden coins!"));
      this.growth.gp -= 20;
      this.vacations += 1;
      this.save({skipUnsetProperties:true},(err:any)=>next(err,{growth:this.growth,vacations:this.vacations}));
    };

    this.model.prototype.onVacation = function(on:boolean,next:Function){
      this.startVacation = on;
      this.save({skipUnsetProperties:true},(err:any)=>next(err,on));
    };
  }

  registerPrototypeMethods(){
    this.model.remoteMethod('profile', {
      isStatic:false,
      description: 'get public profile of player',
      accessType: 'READ',
      http: [
        {verb: 'get', path: '/profile'}
      ],
      returns: {arg: 'data', type: 'user',root: true}
    });

    this.model.remoteMethod('healthPotion', {
      isStatic:false,
      description: 'recover 15 health points by 25 golden coins(instant use)',
      accessType: 'WRITE',
      http: [
        {verb: 'put', path: '/healthPotion'}
      ],
      returns: {arg: 'score', type: 'Score',root: true}
    });

    this.model.remoteMethod('bidVacation', {
      isStatic:false,
      description: 'get 1 day vacation by 20 golden coins',
      accessType: 'WRITE',
      http: [
        {verb: 'put', path: '/bidVacation'}
      ],
      returns: {arg: 'score', type: 'Score',root: true}
    });

    this.model.remoteMethod('onVacation', {
      isStatic:false,
      description: 'start vacation or not',
      accessType: 'WRITE',
      accepts: [
        {
          arg: 'on',
          type: 'boolean',
          description: 'true to start vacation, false to go back to work',
          http: {source: 'query'}
        }
      ],
      http: [
        {verb: 'put', path: '/onVacation'}
      ],
      returns: {arg: 'on', type: 'boolean'}
    });
  }

  disableRemoteMethods(){
     this.model.disableRemoteMethod('__count__accessTokens', false);
     this.model.disableRemoteMethod('__create__accessTokens', false);
     this.model.disableRemoteMethod('__delete__accessTokens', false);
     this.model.disableRemoteMethod('__destroyById__accessTokens', false);
     this.model.disableRemoteMethod('__findById__accessTokens', false);
     this.model.disableRemoteMethod('__get__accessTokens', false);
     this.model.disableRemoteMethod('__updateById__accessTokens', false);

     this.model.disableRemoteMethod('__count__tasks', false);
     this.model.disableRemoteMethod('__create__tasks', false);
     this.model.disableRemoteMethod('__delete__tasks', false);
     this.model.disableRemoteMethod('__destroyById__tasks', false);
     this.model.disableRemoteMethod('__findById__tasks', false);
     this.model.disableRemoteMethod('__get__tasks', false);
     this.model.disableRemoteMethod('__updateById__tasks', false);

     this.model.disableRemoteMethod('__count__awards', false);
     this.model.disableRemoteMethod('__create__awards', false);
     this.model.disableRemoteMethod('__delete__awards', false);
     this.model.disableRemoteMethod('__destroyById__awards', false);
     this.model.disableRemoteMethod('__findById__awards', false);
     this.model.disableRemoteMethod('__get__awards', false);
     this.model.disableRemoteMethod('__updateById__awards', false);
  }


  reScheduleDailyCheckout(data:any,instance:any){
    if (data.checkoutTime && data.checkoutTime != instance.checkoutTime){
      this.model.app.agenda.cancel({'name': 'dailyCheckout','data.userId':instance.id.toString()},()=>{
        var job = this.model.app.agenda.create('dailyCheckout', {userId: instance.id.toString()});
        job.repeatAt(data.checkoutTime);
        job.save();
      });
    }
  }

  beforeSave(ctx: any, next: Function): void {
    if (!ctx.isNewInstance && ctx.data && ctx.currentInstance){//object is updating
      this.reScheduleDailyCheckout(ctx.data,ctx.currentInstance);
    }
    next();
  }

  afterSave(ctx: any, next: Function): void {
    if (ctx.isNewInstance){//object is new created      
      var job = this.model.app.agenda.create('dailyCheckout', {userId: ctx.instance.id.toString()});
      job.repeatAt(ctx.instance.checkoutTime);
      job.save();

      //create a 100 years long token
      ctx.instance.createAccessToken(3600*24*365*100,(err:any,token:any)=>{
        if (err) return next(err);
        ctx.instance.apiToken = token.id;
        ctx.instance.save({skipUnsetProperties:true},next);
      });
    }else{
      next();
    }
  }

  beforeDelete(ctx: any, next: Function): void {
    if(ctx.where && ctx.where.id){
      this.model.app.agenda.cancel({'name': 'dailyCheckout','data.userId':ctx.where.id});
    }
    next();
  }

  wxAppLogin(payload:any,next:Function):void{
    let that = this;
    let code:string = payload.code;
    let encryptedData:string = payload.encryptedData;
    let iv:string = payload.iv;
    if (!code || !encryptedData || !iv) return next(new Error("code,encryptedData or iv is missed!"));
    var params = querystring.stringify({appid:WXAPP_APPID,secret:WXAPP_SECRET,js_code:code,grant_type:"authorization_code"});
    rest.get(JSCODE2SESSION_URL+'?'+params).on('complete', function(data:any) {
      data = JSON.parse(data);      
      if (data.errcode){
        next(data);
      }else{
        //var openid = data.openid;//it is openid
        //var session_key = data.session_key;
        var pc = new WXBizDataCrypt(WXAPP_APPID, data.session_key);
        var userInfo = pc.decryptData(encryptedData , iv);
        userInfo.unionId = FAKE_UNIONID;//here is openId and unionId
 
        that.model.findOrCreate(
          {where: {username:userInfo.unionId}},
          {
            email:userInfo.unionId+'@haxejs.com',
            username:userInfo.unionId,
            password:userInfo.unionId
          },
          function(err: any, createdUser: any, created:boolean){
            createdUser.gender = userInfo.gender;
            createdUser.nickName = userInfo.nickName;
            createdUser.avatarUrl = userInfo.avatarUrl;
            createdUser.country = userInfo.country;
            createdUser.province = userInfo.province;
            createdUser.city = userInfo.city;

            createdUser.weixin = createdUser.weixin || {
              unionId:userInfo.unionId,
              openIds:{}
            };
            createdUser.weixin.openIds[WXAPP_APPID]={
              openId:userInfo.openId,
              sessionKey:data.session_key
            };
            createdUser.save({skipUnsetProperties:true},next);
          }
        );
      }      
    });
  }
}

module.exports = User;
