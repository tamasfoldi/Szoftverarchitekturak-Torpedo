/// <reference path="../../references.ts" />

var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var cryptoNode = require("crypto");

var UserSchema = new Schema({
  username: {
    type: String,
    unique: true,
    required: true
  },
  about: {
    type: String,
    default: ""
  },
  gender: {
    type: String,
    default: "NONE"
  },
  picUrl: {
    type: String,
    default: "http://lorempixel.com/100/100/abstract/1"
  },
  nofGames: {
    type: Number,
    default: 0
  },
  nofWons: {
    type: Number,
    default: 0
  },
  avgGameTime: {
    type: Number,
    default: 0
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  hashedPassword: String,
  salt: String
});

/**
 * virtuals
 */

UserSchema
  .virtual("password")
  .set(function(password) {
    this._password = password;
    this.salt = this.makeSalt();
    this.hashedPassword = this.encryptPassword(password);
  })
  .get(function() {
    return this._password;
  });

UserSchema
  .virtual("user_info")
  .get(function () {
    return { "_id": this._id, "username": this.username };
  });

/**
 * Validations
 */

var validatePresenceOf = function (value) {
  return value && value.length;
};

UserSchema.path("username").validate(function(value, respond) {
  mongoose.models["User"].findOne({username: value}, function(err, user) {
    if (err) {
      throw err;
    }
    if (user) {
      return respond(false);
    }
    respond(true);
  });
}, "The specified username is already in use.");

/**
 * pre-save hook
 */

UserSchema.pre("save", function(next) {
  if (!this.isNew) {
    return next();
  }
  if (!validatePresenceOf(this.password)) {
    next(new Error("Invalid password"));
  } else {
    next();
  }
});

/**
 * methods
 */

UserSchema.methods = {

  /**
   * authenticate - check if the passwords are the same
   */

  authenticate: function(plainText) {
    return this.encryptPassword(plainText) === this.hashedPassword;
  },

  /**
   * make salt
   */

  makeSalt: function() {
    return cryptoNode.randomBytes(16).toString("base64");
  },

  /**
   * encrypt password
   */

  encryptPassword: function(password) {
    if (!password || !this.salt) {
      return "";
    }
    var salt = new Buffer(this.salt, "base64");
    return cryptoNode.pbkdf2Sync(password, salt, 10000, 64).toString("base64");
  }
};

module.exports = mongoose.model("User", UserSchema);
