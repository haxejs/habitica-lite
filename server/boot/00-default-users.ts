import { BootScript } from '@mean-expert/boot-script';
var log = require('debug')('boot:00-default-users');

class ROLES {
  public static SU ='su';
  public static TEST ='test';
}

@BootScript()
class DefaultUsersAndRoles {
	private roles = [
		{
	      name: ROLES.SU,
	      users: [{
	        name: 'Root',
	        email: 'root@haxejs.com',
	        username: 'root',
	        nickName: 'root',
	        password: 'root11'
	      }]
	    },
	    {
	      name: ROLES.TEST,
	      users: [{
	        name: 'Test',
	        email: 'test@haxejs.com',
	        username: 'test',
	        nickName: 'test',
	        password: 'test11'
	      }]
	    }
    ];

    constructor(app: any) {
    	var User = app.models.user;
    	var Role = app.models.Role;
    	var RoleMapping = app.models.RoleMapping;

    	this.roles.forEach(function(role: any) {
    	  Role.registerResolver(role.name,function(roleName:string, context:any, cb:Function){
    	  	var userId = context.accessToken.userId;
		    if (!userId) {
		      //A: No, user is NOT logged in: callback with FALSE
		      return process.nextTick(() => cb(null, false));
		    }
		    User.findById(userId, {}, function (err:any, user:any) {
		      if (err || !user) return cb(null,false);
		      //why user.roles(...) not work here?
		      cb(null,(user.username==='root' && roleName===ROLES.SU));
		    });
    	  });

	      Role.findOrCreate(
	        {where: {name: role.name}}, // find
	        {name: role.name}, // create
	        function(err: any, createdRole: any, created:boolean) {
	          if (err) {
	            console.error({err:err},'error running findOrCreate('+role.name+')');
	            return;
	          }
	          (created) ? log('created role', createdRole.name)
	                    : log('found role', createdRole.name);
	          role.users.forEach(function(roleUser:any) {
	            User.findOrCreate(
	              {where: {username: roleUser.username}}, // find
	              roleUser, // create
	              function(err: any, createdUser: any, created:boolean) {
	                if (err) {
	                  console.error({err:err},'error creating roleUser');
	                  return;
	                }
	                (created) ? log('created user', createdUser.username)
	                          : log('found user', createdUser.username);
	                if (created){
	                  createdRole.principals.create({
	                    principalType: RoleMapping.USER,
	                    principalId: createdUser.id
	                  }, function(err: any, rolePrincipal: any) {
	                    if (err) {
	                      console.error({err:err},'error creating rolePrincipal');
	                    }
	                  });
	                }
	              });
	          });
	        });
	    });
    }
}

module.exports = DefaultUsersAndRoles;