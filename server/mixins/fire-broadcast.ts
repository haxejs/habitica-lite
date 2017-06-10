class FireBroadcastMixin {

  constructor(Model: any, options: any) {

    Model.afterRemote('**', function(ctx:any, remoteMethodOutput: any, next: Function) {
      //why Model.app.mx.FireLoop is undefined? 
      //Fix: add "return FireLoop;" in line 27 of modules/FireLoop.js
      if(ctx.method.accessType==="WRITE"){
        console.log(ctx.method.stringName + ' broadcast fireloop change and stats events');
        //anounce change      
        Model.app.mx.FireLoop.broadcast({modelName:Model.sharedClass.name},"change");
        //anounce stats
        Model.app.mx.FireLoop.broadcast({modelName:Model.sharedClass.name},"stats");
      }
      next();
    });
  }
}

module.exports = FireBroadcastMixin;
