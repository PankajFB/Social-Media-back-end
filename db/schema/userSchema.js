const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema({
  from: {
    type: String,
    index: { unique: true },
  },
  to: {
    type: String,
    index: { unique: true },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const friendsSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const chatSchema = new mongoose.Schema({
  from: {
    type: String,
  },
  to: {
    type: String,
  },
  message: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

const userSchema = new mongoose.Schema({
  displayName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true, // this will make sure that no two users can have the same email address
  },
  photoURL: {
    type: String,
    required: true,
  },

  //   this will hold the requests sent to the user
  request:{
    type: [requestSchema],
  },

  friends: {
    type: [friendsSchema],
  },

  chats : {
    type: [chatSchema],
  },

  dateOfJoining: {
    type: Date,
    default: Date.now,
  },
});

const User = new mongoose.model("user", userSchema);

module.exports = User;
