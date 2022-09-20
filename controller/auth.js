const {
  validate,
  verifyPass,
  createDefaultUser,
  hashPass,
  generateCode,
} = require("../base/until");
const {
  loginVal,
  registerVal,
  activeUserVal,
  forgotPassVal,
  resetPassVal,
  updateProfileVal,
  findUserbyUsernameVal,
  findMultiUserbyUsernameVal,
  addFriendVal,
  acceptFriendVal,
  deleteFriendVal,
  updateDeviceTokenVal,
  findUserbyNameVal,
  updatePassVal,
  deleteRequestFriendVal
} = require("../base/validate");
const { signToken } = require("../config/jwt");
const { sendCode } = require("../config/nodemail");
const {
  valHasExistDB,
  createUser,
  activeUser,
  createCode,
  updateProfile,
  updateFriendRequest,
  addFriend,
  deleteFriend,
  updateDeviceToken,
  findUserByName,
  updatePass,
  deleteRequestFriend
} = require("../service/auth");

const handleLogin = async (req, res, next) => {
  try {
    const body = req.body;
    const valBody = validate(body, loginVal);

    //validate body data
    if (!valBody) {
      return next(new Error(`${400}:${"Validate data fail !"}`));
    }

    //validate user data
    const find = await valHasExistDB("username", valBody.username, "User");
    if (!find) {
      return next(new Error(`${404}:${"Not found user !"}`));
    }

    //validate password
    const valPass = await verifyPass(valBody.password, find.password);
    if (!valPass) {
      return next(new Error(`${400}:${"Password wrong !"}`));
    }

    //validate active account
    if (!find.active) {
      return next(new Error(`${400}:${"Account not active !"}`));
    }

    //delete field private
    delete find.password;
    delete find.active;
    delete find.createAt;
    delete find.block;
    delete find.code;
    delete find._id;
    delete find.chatsList;
    delete find.friendsList;

    //generate token with payload is user data
    const accessToken = signToken(find);

    //send result
    return res.send({
      status: true,
      data: {
        accessToken: accessToken,
      },
    });
  } catch (e) {
    return next(new Error(`${400}:${e.message}`));
  }
};

const handleRegister = async (req, res, next) => {
  try {
    const body = req.body;
    const valBody = validate(body, registerVal);

    //validate body data
    if (!valBody) {
      return next(new Error(`${400}:${"Validate data fail !"}`));
    }

    //validate user data
    const find = await valHasExistDB("username", valBody.username, "User");
    if (find) {
      return next(new Error(`${404}:${"Username has exist !"}`));
    }

    //hash password
    valBody.password = await hashPass(valBody.password);

    //create default user
    const defaultUser = createDefaultUser(valBody);

    //send code active account
    var code = await sendCode(defaultUser.email, defaultUser.code);

    if (!code) {
      return next(
        new Error(
          `${400}:${"Send code active to account fail, Pls check log !"}`
        )
      );
    }

    //create user on db
    var user = await createUser(defaultUser);
    if (!user) {
      return next(
        new Error(`${400}:${"Create new user fail, Pls check log !"}`)
      );
    }

    //delete field private
    delete defaultUser.password;
    delete defaultUser.active;
    delete defaultUser.createAt;
    delete defaultUser.block;
    delete defaultUser.code;
    delete defaultUser._id;

    return res.send({
      status: true,
      data: defaultUser,
    });
  } catch (e) {
    return next(new Error(`${400}:${e.message}`));
  }
};

const handleActiveUser = async (req, res, next) => {
  try {
    const body = req.body;
    const valBody = validate(body, activeUserVal);

    //validate body data
    if (!valBody) {
      return next(new Error(`${400}:${"Validate data fail !"}`));
    }

    //validate user data
    const find = await valHasExistDB("username", valBody.username, "User");
    if (!find) {
      return next(new Error(`${404}:${"Username has not exist !"}`));
    }

    //verifycode
    if (find.code != valBody.code) {
      return next(new Error(`${400}:${"Code active wrong !"}`));
    }

    //active user
    var active = await activeUser(find.username);
    if (!active) {
      return next(new Error(`${400}:${"Active fail, Pls check log!"}`));
    }

    return res.send({
      status: true,
    });
  } catch (e) {
    return next(new Error(`${400}:${e.message}`));
  }
};

const handleForgotPass = async (req, res, next) => {
  try {
    const body = req.body;
    const valBody = validate(body, forgotPassVal);

    //validate body data
    if (!valBody) {
      return next(new Error(`${400}:${"Validate data fail !"}`));
    }

    //validate user data
    const find = await valHasExistDB("username", valBody.username, "User");
    if (!find) {
      return next(new Error(`${404}:${"Username has not exist !"}`));
    }

    //send code forgotpass account
    var genCode = generateCode();
    var code = await sendCode(find.email, genCode);
    if (!code) {
      return next(
        new Error(
          `${400}:${"Send code active to account fail, Pls check log !"}`
        )
      );
    }

    //save code in db
    var saveCode = await createCode(valBody.username, genCode);
    if (!saveCode) {
      return next(
        new Error(
          `${400}:${"Save code active to account fail, Pls check log !"}`
        )
      );
    }

    return res.send({
      status: true,
    });
  } catch (e) {
    return next(new Error(`${400}:${e.message}`));
  }
};

const handleResetPass = async (req, res, next) => {
  try {
    const body = req.body;
    const valBody = validate(body, resetPassVal);

    //validate body data
    if (!valBody) {
      return next(new Error(`${400}:${"Validate data fail !"}`));
    }

    //validate user data
    const find = await valHasExistDB("username", valBody.username, "User");
    if (!find) {
      return next(new Error(`${404}:${"Username has not exist !"}`));
    }

    //check code
    if (valBody.code != find.code) {
      return next(new Error(`${400}:${"Code wrong !"}`));
    }

    //create new pass
    var newPass = await hashPass(valBody.password);

    //save pass in db
    var pass = await updatePass(valBody.username, newPass);
    if (!pass) {
      return next(new Error(`${400}:${"Update pass fail, Pls check log !"}`));
    }

    return res.send({
      status: true,
    });
  } catch (e) {
    return next(new Error(`${400}:${e.message}`));
  }
};


const handleUpdatePass = async (req, res, next) => {
  try {
    const body = req.body;
    const valBody = validate(body, updatePassVal);

    //validate body data
    if (!valBody) {
      return next(new Error(`${400}:${"Validate data fail !"}`));
    }

    //validate user data
    const find = await valHasExistDB("username", valBody.username, "User");
    if (!find) {
      return next(new Error(`${404}:${"Username has not exist !"}`));
    }

    //check pass
    const valPass = await verifyPass(valBody.oldpassword, find.password);
    if (!valPass) {
      return next(new Error(`${400}:${"Password wrong !"}`));
    }

    //create new pass
    var newPass = await hashPass(valBody.newpassword);

    //save pass in db
    var pass = await updatePass(valBody.username, newPass);
    if (!pass) {
      return next(new Error(`${400}:${"Update pass fail, Pls check log !"}`));
    }

    return res.send({
      status: true,
    });
  } catch (e) {
    return next(new Error(`${400}:${e.message}`));
  }
};


const handleUpdateProfile = async (req, res, next) => {
  try {
    const body = req.body;
    const valBody = validate(body, updateProfileVal);

    //validate body data
    if (!valBody) {
      return next(new Error(`${400}:${"Validate data fail !"}`));
    }

    //validate user data
    const find = await valHasExistDB("username", req.user.username, "User");
    if (!find) {
      return next(new Error(`${404}:${"Username has not exist !"}`));
    }

    //update user in db
    const update = await updateProfile(req.user.username, valBody);
    if (!update) {
      return next(new Error(`${400}:${"Save update fail, Pls check log !"}`));
    }

    return res.send({
      status: true,
      data: valBody,
    });
  } catch (e) {
    return next(new Error(`${400}:${e.message}`));
  }
};

const handleFindUserByUsername = async (req, res, next) => {
  try {
    const body = req.body;
    const valBody = validate(body, findUserbyUsernameVal);

    //validate body data
    if (!valBody) {
      return next(new Error(`${400}:${"Validate data fail !"}`));
    }

    //validate user data
    const find = await valHasExistDB("username", valBody.usernameFind, "User");
    if (!find) {
      return next(new Error(`${404}:${"Username has not exist !"}`));
    }

    //delete field private
    delete find.password;
    delete find.active;
    delete find.createAt;
    delete find.block;
    delete find.code;
    delete find._id;
    delete find.chatsList;
    delete find.friendsList;

    return res.send({
      status: true,
      data: find,
    });
  } catch (e) {
    return next(new Error(`${400}:${e.message}`));
  }
};


const handleFindMultiUserByName = async (req, res, next) => {
  try {
    const body = req.body;
    const valBody = validate(body, findUserbyNameVal);
    var result = [];


    if (!valBody) {
      return next(new Error(`${400}:${"Validate data fail !"}`));
    }


  
    let tempUser = await findUserByName(valBody.nameFind);
    for (var i = 0; i < tempUser.length; i++)
      if (tempUser) {
        //delete field private
        delete tempUser[i].password;
        delete tempUser[i].active;
        delete tempUser[i].createAt;
        delete tempUser[i].block;
        delete tempUser[i].code;
        delete tempUser[i]._id;
        delete tempUser[i].chatsList;
        delete tempUser[i].friendsList;
        result.push(tempUser[i]);
      }
    

    return res.send({
      status: true,
      data: result,
    });
  } catch (e) {
    return next(new Error(`${400}:${e.message}`));
  }
};

const handleFindMultiUserByUsername = async (req, res, next) => {
  try {
    const body = req.body;
    const valBody = validate(body, findMultiUserbyUsernameVal);
    var result = [];

    //validate body data
    if (!valBody) {
      return next(new Error(`${400}:${"Validate data fail !"}`));
    }

    //find user by list user
    for (var i = 0; i < valBody.listUser.length; i++) {
      let tempUser = await valHasExistDB(
        "username",
        valBody.listUser[i],
        "User"
      );

      if (tempUser) {
        //delete field private
        delete tempUser.password;
        delete tempUser.active;
        delete tempUser.createAt;
        delete tempUser.block;
        delete tempUser.code;
        delete tempUser._id;
        delete tempUser.chatsList;
        delete tempUser.friendsList;

        result.push(tempUser);
      }
    }

    return res.send({
      status: true,
      data: result,
    });
  } catch (e) {
    return next(new Error(`${400}:${e.message}`));
  }
};

const handleGetProfileUser = async (req, res, next) => {
  try {
    //validate user data
    const find = await valHasExistDB("username", req.user.username, "User");
    if (!find) {
      return next(new Error(`${404}:${"Username has not exist !"}`));
    }

    delete find.password;
    delete find.active;
    delete find.createAt;
    delete find.block;
    delete find.code;
    delete find._id;

    return res.send({
      status: true,
      data: find,
    });
  } catch (e) {
    return next(new Error(`${400}:${e.message}`));
  }
};

const handleAddFriend = async (req, res, next) => {
  try {
    const body = req.body;
    const valBody = validate(body, addFriendVal);

    //validate body data
    if (!valBody) {
      return next(new Error(`${400}:${"Validate data fail !"}`));
    }

    //check username it your
    if (valBody.usernameFriend === req.user.username) {
      return next(
        new Error(`${400}:${"You can`t add friend with yourself !"}`)
      );
    }

    //find user
    const user = await valHasExistDB("username", req.user.username, "User");
    if (!user) {
      return next(new Error(`${404}:${"Username with token has not exist !"}`));
    }

    // check is friend
    const userFriend = user.friendsList.some(
      (item) => item.username === valBody.usernameFriend
    );
    if (userFriend) {
      return next(new Error(`${404}:${"Username friend in your friend!"}`));
    }

    // check is requestFriend
    const userFriend2 = user.requestsFriendList.some(
      (item) => item.username === valBody.usernameFriend
    );
    if (userFriend2) {
      return next(
        new Error(`${404}:${"Username friend in your request friend!"}`)
      );
    }

    //find user add friend
    const find = await valHasExistDB(
      "username",
      valBody.usernameFriend,
      "User"
    );
    if (!find) {
      return next(new Error(`${404}:${"Not found username friend !"}`));
    }

    //check request has exist !
    const hasExist = find.requestsFriendList.some(
      (item) => item.username === req.user.username
    );
    if (hasExist) {
      return next(new Error(`${400}:${"Request has exist !"}`));
    }

    //send friend request
    find.requestsFriendList.push({
      username: req.user.username,
      createAt: new Date().toString(),
    });
    const sendRequest = await updateFriendRequest(
      valBody.usernameFriend,
      find.requestsFriendList
    );
    if (!sendRequest) {
      return next(new Error(`${400}:${"Send request fail !"}`));
    }

    //send notification to device to usernameFriend
    //code here !

    res.send({
      status: true,
    });
  } catch (e) {
    return next(new Error(`${400}:${e.message}`));
  }
};

const handleAcceptFriend = async (req, res, next) => {
  try {
    const body = req.body;
    const valBody = validate(body, acceptFriendVal);

    //validate body data
    if (!valBody) {
      return next(new Error(`${400}:${"Validate data fail !"}`));
    }

    //find user
    const user = await valHasExistDB("username", req.user.username, "User");
    if (!user) {
      return next(new Error(`${404}:${"Username with token has not exist !"}`));
    }

    //find user accept friend
    const find = await valHasExistDB(
      "username",
      valBody.usernameAccept,
      "User"
    );
    if (!find) {
      return next(new Error(`${404}:${"Not found username accept friend !"}`));
    }

    //find request friend has exist
    var requestHasExist = user.requestsFriendList.some(
      (item) => item.username === valBody.usernameAccept
    );
    if (!requestHasExist) {
      return next(new Error(`${404}:${"Not found request friend !"}`));
    }

    //add friend to user
    user.friendsList.push({
      username: valBody.usernameAccept,
      createAt: new Date().toString(),
    });

    //add friend to useraccept
    find.friendsList.push({
      username: req.user.username,
      createAt: new Date().toString(),
    });

    //remove request add friend in user
    user.requestsFriendList = user.requestsFriendList.filter(
      (item) => item.username != valBody.usernameAccept
    );

    //save add friend to db
    const add = addFriend(
      req.user.username,
      valBody.usernameAccept,
      user.friendsList,
      find.friendsList,
      user.requestsFriendList
    );
    if (!add) {
      return next(
        new Error(`${400}:${"Save add friend to db fail, Pls check log !"}`)
      );
    }

    return res.send({
      status: true,
    });
  } catch (e) {
    return next(new Error(`${400}:${e.message}`));
  }
};

const handleDeleteFriend = async (req, res, next) => {
  try {
    const body = req.body;
    const valBody = validate(body, deleteFriendVal);

    //validate body data
    if (!valBody) {
      return next(new Error(`${400}:${"Validate data fail !"}`));
    }

    //check user === usernameDelete?
    if (req.user.username === valBody.usernameDelete) {
      return next(new Error(`${400}:${"You not unfriend with yourself !"}`));
    }

    //find user
    const user = await valHasExistDB("username", req.user.username, "User");
    if (!user) {
      return next(new Error(`${404}:${"Username with token has not exist !"}`));
    }

    //find user accept friend
    const find = await valHasExistDB(
      "username",
      valBody.usernameDelete,
      "User"
    );
    if (!find) {
      return next(new Error(`${404}:${"Not found username delete friend !"}`));
    }

    //find friend has exist
    const userFriend = user.friendsList.some(
      (item) => item.username === valBody.usernameDelete
    );
    if (!userFriend) {
      return next(
        new Error(`${404}:${"Not found username friend in your friend!"}`)
      );
    }
    const findFriend = find.friendsList.some(
      (item) => item.username === req.user.username
    );
    if (!findFriend) {
      return next(
        new Error(
          `${404}:${"Not found username friend in username delete friend!"}`
        )
      );
    }

    //delete friend to user
    user.friendsList = user.friendsList.filter(
      (item) => item.username != valBody.usernameDelete
    );

    //delete friend to usernameDelete
    find.friendsList = find.friendsList.filter(
      (item) => item.username != req.user.username
    );

    //save delete friend to db
    const del = await deleteFriend(
      req.user.username,
      valBody.usernameDelete,
      user.friendsList,
      find.friendsList
    );

    if (!del) {
      return next(
        new Error(`${404}:${"Save delete friend to db fail, Pls check log !"}`)
      );
    }

    return res.send({
      status: true,
    });
  } catch (e) {
    return next(new Error(`${400}:${e.message}`));
  }
};


const handleDeleteRequestFriend = async (req, res, next) => {
  try {
    const body = req.body;
    const valBody = validate(body, deleteRequestFriendVal);

    //validate body data
    if (!valBody) {
      return next(new Error(`${400}:${"Validate data fail !"}`));
    }

    //check user === usernameDelete?
    if (req.user.username === valBody.usernameDelete) {
      return next(new Error(`${400}:${"You not unacept with yourself !"}`));
    }

    //find user
    const user = await valHasExistDB("username", req.user.username, "User");
    if (!user) {
      return next(new Error(`${404}:${"Username with token has not exist !"}`));
    }

    //find user request friend
    const find = await valHasExistDB(
      "username",
      valBody.usernameDelete,
      "User"
    );
    if (!find) {
      return next(new Error(`${404}:${"Not found username delete reques tfriend !"}`));
    }

    //find friend has exist
    const userFriend = user.requestsFriendList.some(
      (item) => item.username === valBody.usernameDelete
    );
    if (!userFriend) {
      return next(
        new Error(`${404}:${"Not found username friend in your Request friend!"}`)
      );
    }
  
    

    //delete friend to user
    user.requestsFriendList = user.requestsFriendList.filter(
      (item) => item.username != valBody.usernameDelete
    );

  // console.log( user.requestsFriendList);

    //save delete friend to db
    const del = await deleteRequestFriend(
      req.user.username,
      user.requestsFriendList,
    );

    if (!del) {
      return next(
        new Error(`${404}:${"Save delete friend to db fail, Pls check log !"}`)
      );
    }

    return res.send({
      status: true,
    });
  } catch (e) {
    return next(new Error(`${400}:${e.message}`));
  }
};


const handleUpdateDeviceToken = async (req, res, next) => {
  try {
    const body = req.body;
    const valBody = validate(body, updateDeviceTokenVal);

    //validate body data
    if (!valBody) {
      return next(new Error(`${400}:${"Validate data fail !"}`));
    }

    //validate user data
    const find = await valHasExistDB("username", req.user.username, "User");
    if (!find) {
      return next(new Error(`${404}:${"Username has not exist !"}`));
    }

    //check token not empty
    if (valBody.deviceToken == "") {
      return next(new Error(`${400}:${"Token is empty !"}`));
    }

    //save devicetoken in db
    const deviceToken = await updateDeviceToken(
      req.user.username,
      valBody.deviceToken
    );
    if (!deviceToken) {
      return next(
        new Error(`${404}:${"Save device token fail, Pls check log !"}`)
      );
    }

    return res.send({
      status: true,
    });
  } catch (e) {
    return next(new Error(`${400}:${e.message}`));
  }
};

module.exports = {
  handleLogin,
  handleRegister,
  handleActiveUser,
  handleForgotPass,
  handleResetPass,
  handleUpdateProfile,
  handleFindUserByUsername,
  handleFindMultiUserByUsername,
  handleGetProfileUser,
  handleAddFriend,
  handleAcceptFriend,
  handleDeleteFriend,
  handleUpdateDeviceToken,
  handleFindMultiUserByName,
  handleUpdatePass,
  handleDeleteRequestFriend
};
