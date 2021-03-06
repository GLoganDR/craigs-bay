'use strict';

var bcrypt  = require('bcrypt'),
    _       = require('lodash'),
    Message = require('./message'),
    Mongo   = require('mongodb');

function User(){
}

Object.defineProperty(User, 'collection', {
  get: function(){return global.mongodb.collection('users');}
});

User.findById = function(id, cb){
  var _id = Mongo.ObjectID(id);
  User.collection.findOne({_id:_id}, function(err, obj){
    cb(err, _.create(User.prototype, obj));
  });
};

User.register = function(o, cb){
  User.collection.findOne({email:o.email}, function(err, user){
    if(user){return cb();}
    o.password = bcrypt.hashSync(o.password, 10);
    o.loc = {};
    User.collection.save(o, cb);
  });
};

User.prototype.save = function(o, cb){
  var properties = Object.keys(o),
      self       = this;

  properties.forEach(function(property){
    switch(property){
      case 'loc':
        self.loc = {name:o.loc[0], lat:o.loc[1], lng:o.loc[2]};
        break;
      default:
        self[property] = o[property];
    }
  });

  delete this.unread;
  User.collection.save(this, cb);
};

User.authenticate = function(o, cb){
  User.collection.findOne({email:o.email}, function(err, user){
    if(!user){return cb();}
    var isOk = bcrypt.compareSync(o.password, user.password);
    if(!isOk){return cb();}
    cb(user);
  });
};

User.all = function(cb){
  User.collection.find().toArray(function(err, users){
    cb(err, users.map(function(o){return _.create(User.prototype, o);}));
  });
};

User.prototype.send = function(receiver, obj, cb){
  console.log('>>>>>>>>>> USER - #SEND -- receiver: ', receiver);
  console.log('>>>>>>>>>> USER - #SEND -- obj.message: ', obj.message);
  Message.send(this._id, receiver._id, obj.message, cb);
};

module.exports = User;

