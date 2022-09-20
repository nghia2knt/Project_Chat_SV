//auth
module.exports.loginVal = [
  {
    field: "username",
    type: "string",
  },
  {
    field: "password",
    type: "string",
  },
];

module.exports.registerVal = [
  {
    field: "username",
    type: "string",
  },
  {
    field: "password",
    type: "string",
  },
  {
    field: "email",
    type: "string",
  },
  {
    field: "name",
    type: "string",
  },
  {
    field: "birthDay",
    type: "string",
  },
  {
    field: "gennder",
    type: "number",
  },
  {
    field: "deviceToken",
    type: "string",
  },
];

module.exports.activeUserVal = [
  {
    field: "username",
    type: "string",
  },
  {
    field: "code",
    type: "string",
  },
];

module.exports.forgotPassVal = [
  {
    field: "username",
    type: "string",
  },
];

module.exports.resetPassVal = [
  {
    field: "username",
    type: "string",
  },
  {
    field: "password",
    type: "string",
  },
  {
    field: "code",
    type: "string",
  },
];

module.exports.updatePassVal = [
  {
    field: "username",
    type: "string",
  },
  {
    field: "oldpassword",
    type: "string",
  },
  {
    field: "newpassword",
    type: "string",
  },
];

module.exports.updateProfileVal = [
  {
    field: "name",
    type: "string",
  },
  {
    field: "gennder",
    type: "number",
  },
  {
    field: "birthDay",
    type: "string",
  },
  {
    field: "avatar",
    type: "string",
  },
  {
    field: "background",
    type: "string",
  },
];

module.exports.findUserbyUsernameVal = [
  {
    field: "usernameFind",
    type: "string",
  },
];


module.exports.findUserbyNameVal = [
  {
    field: "nameFind",
    type: "string",
  },
];


module.exports.findMultiUserbyUsernameVal = [
  {
    field: "listUser",
    type: "object",
  },
];

module.exports.addFriendVal = [
  {
    field: "usernameFriend",
    type: "string",
  },
];

module.exports.acceptFriendVal = [
  {
    field: "usernameAccept",
    type: "string",
  },
];

module.exports.deleteFriendVal = [
  {
    field: "usernameDelete",
    type: "string",
  },
];

module.exports.deleteRequestFriendVal = [
  {
    field: "usernameDelete",
    type: "string",
  },
];

module.exports.updateDeviceTokenVal = [
  {
    field: "deviceToken",
    type: "string",
  },
];

//chat

module.exports.sendNewMessVal = [
  {
    field: "type",
    type: "number",
  },
  {
    field: "content",
    type: "string",
  },
  {
    field: "receiver",
    type: "object",
  },
];

module.exports.sendMessByRoomIDVal = [
  {
    field: "type",
    type: "number",
  },
  {
    field: "content",
    type: "string",
  },
  {
    field: "roomID",
    type: "string",
  },
];

module.exports.changeRoomNameVal = [

  {
    field: "roomID",
    type: "string",
  },
  {
    field: "name",
    type: "string",
  },
];


module.exports.seederVal = [
  {
    field: "roomID",
    type: "string",
  },
  {
    field: "index",
    type: "number",
  },
];

module.exports.recallVal = [
  {
    field: "roomID",
    type: "string",
  },
  {
    field: "index",
    type: "number",
  },
];


module.exports.addMemberVal = [
  {
    field: "roomID",
    type: "string",
  },
  {
    field: "username",
    type: "string",
  },
];

module.exports.deleteMemberVal = [
  {
    field: "roomID",
    type: "string",
  },
  {
    field: "username",
    type: "string",
  },
];


module.exports.deleteRoomVal = [
  {
    field: "roomID",
    type: "string",
  }
];