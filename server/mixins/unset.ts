/*
Note: 
1.can only unset direct property, indirect "habit.counterUp" property is not working.
in model json file, enable mixins by:

  "mixins": {
    "Unset":{
      "properties":["value","history","createdAt"]
    }
  }

2.to skip the unset, set skipUnsetProperties flag:
 instance.save({skipUnsetProperties:true});

*/

class UnsetMixin {

  constructor(Model: any, options: any) {

    var UNSET_PROPERTIES = Array.isArray(options.properties)?options.properties:null;

    Model.observe('before save', function(ctx:any, next:Function) {
      if (!UNSET_PROPERTIES) return next();
      if (ctx.options && ctx.options.skipUnsetProperties) return next();
      if (ctx.instance) {
        UNSET_PROPERTIES.forEach(function(p:string) {
          ctx.instance.unsetAttribute(p);
        });
      } else {
        UNSET_PROPERTIES.forEach(function(p:string) {
          delete ctx.data[p];
        });
      }
      next();
    });

  }
}

module.exports = UnsetMixin;
