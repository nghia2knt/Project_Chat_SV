const { createDefaultMess, sendNotifi, returnType } = require("../base/until");
const { io } = require("../config/socket");
const db = require("../config/mongodb").db("MegaTalk");

const createBoxChat = async (boxChat, member, sender) => {
  var result = true;

  //insert boxchat on collection Boxchat
  var insertCollection = await db
    .collection("BoxChat")
    .insertOne(boxChat)
    .catch((e) => {
      console.log(e);
      result = false;
    });
  if (!insertCollection) {
    return result;
  }

  //insert box chat on list member
  for (var i = 0; i < member.length; i++) {
    //Find user member
    let find = await db.collection("User").findOne({
      username: member[i].username,
    });
    if (!find) {
      return false;
    }

    //Insert boxchat on collection boxchat
    find.chatsList.push(boxChat);
    await db
      .collection("User")
      .updateOne(
        {
          username: member[i].username,
        },
        {
          $set: {
            chatsList: find.chatsList,
          },
        }
      )
      .catch((e) => {
        console.log(e);
        result = false;
      });
    if (!result) {
      return result;
    }

    //send notifi and socket all member != sender
  //  if (member[i].username != sender) {
      //send notifi with fcm
      if (find.deviceToken != "") {
        var mess = boxChat.messagesList[0];
        var title = `${member[i].username} vừa gửi tin nhắn cho bạn`;
        var body = returnType(mess.type, mess.content);
        await sendNotifi(title, body, mess, find.deviceToken);
      }

      //send mess with socket
      var action = {
        type: "newBoxChat",
        data: JSON.stringify(boxChat),
      };
      io.emit(`${member[i].username}`, action);
   // }
  }

  return result;
};

const validateMemberBoxChat = async (member) => {
  var result = true;
  //Validate member group
  for (var i = 0; i < member.length; i++) {
    let findMember = await db.collection("User").findOne({
      username: member[i].username,
    });
    if (!findMember) {
      return false;
    }
  }
  return result;
};

const insertMessByRoomID = async (boxChat, sender, type, content) => {
  var result = true;
  var receiver = boxChat.member.filter((item) => item != sender);
  var createMess = createDefaultMess(
    sender,
    receiver,
    type,
    content,
    boxChat.messagesList.length,
    boxChat.roomID
  );

  //insert mess to boxchat collection
  boxChat.messagesList.push(createMess);
  await db.collection("BoxChat").updateOne(
    {
      roomID: boxChat.roomID,
    },
    {
      $set: {
        messagesList: boxChat.messagesList,
      },
    }
  );

  //insert mess to boxchat user
  const member = boxChat.member;
  for (var i = 0; i < member.length; i++) {
    //find user memberS
    const findUser = await db.collection("User").findOne({
      username: member[i].username,
    });
    if (!findUser) {
      return false;
    }

    //find boxchat in user and insert mess
    const findBoxChat = findUser.chatsList.some(
      (item) => item.roomID === boxChat.roomID
    );
    if (findBoxChat) {
      //find box chat
      findUser.chatsList.map((cur) => {
        if (cur.roomID === boxChat.roomID) {
          cur.messagesList.push(createMess);
        }
      });
    } else {
      //not find box chat insert cloneboxchat on user
      var cloneBoxChat = { ...boxChat, messagesList: [] };
      findUser.chatsList.push(cloneBoxChat);
      findUser.chatsList.map((cur) => {
        if (cur.roomID === boxChat.roomID) {
          cur.messagesList.push(createMess);
        }
      });
    }

    await db
      .collection("User")
      .updateOne(
        {
          username: member[i].username,
        },
        {
          $set: {
            chatsList: findUser.chatsList,
          },
        }
      )
      .catch((e) => {
        console.log(e);
        result = false;
      });
    if (!result) {
      return result;
    }

    //send notifi and socket all member != sender
  //  if (member[i].username != sender) {
      //send notifi with fcm
      if (findUser.deviceToken != "") {
        var mess = createMess;
        var title = `${member[i].username} vừa gửi tin nhắn cho bạn`;
        var body = returnType(mess.type, mess.content);
        await sendNotifi(title, body, mess, findUser.deviceToken);
      }

      //send mess with socket
      var action = {
        type: "newMess",
        data: JSON.stringify(createMess),
      };
      io.emit(`${member[i].username}`, action);
  //  }
  }

  return result;
};

const findChatHasExist = async (member) => {
  var result = false;
  const find = await db
    .collection("BoxChat")
    .find({
      type: 0,
    })
    .toArray();
  await find.map((cur, i) => {
    var sender = cur.member.some((item) => item.username === member[0]);
    var receiver = cur.member.some((item) => item.username === member[1]);
    if (sender && receiver) {
      delete cur._id;
      result = cur;
    }
  });

  return result;
};


const changeRoomName = async (roomID, name) => {
  var result = true;
  const boxChat = await db.collection("BoxChat").findOne({
    roomID: roomID,
  });
  if (!boxChat) {
    console.log("fail find box chat");
    return false;
  }
  await db.collection("BoxChat").updateOne(
    {
      roomID: roomID,
    },
    {
      $set: {
        roomName: name,
      },
    }
  ).catch((e) => {
    console.log("fail update box chat");
    return false;
  });

  const member = boxChat.member;
  for (var i = 0; i < member.length; i++) {
    //find user member
    const findUser = await db.collection("User").findOne({
      username: member[i].username,
    });
    if (!findUser) {
      return false;
    }

    //find boxchat in user and insert mess
    const findBoxChat = findUser.chatsList.some(
      (item) => item.roomID === boxChat.roomID
    );
    if (findBoxChat) {
      //find box chat
      findUser.chatsList.map((cur) => {
        if (cur.roomID === boxChat.roomID) {
          cur.roomName = name;
        }
      });
    } else {
      return false;
    }

    await db
      .collection("User")
      .updateOne(
        {
          username: member[i].username,
        },
        {
          $set: {
            chatsList: findUser.chatsList,
          },
        }
      )
      .catch((e) => {
        console.log(e);
        result = false;
      });
    if (!result) {
      return result;
    }

    //send notifi and socket all member != sender
  //  if (member[i].username != sender) {
      //send notifi with fcm
  

      //send mess with socket
      var action = {
        type: "newName",
        data:JSON.stringify({
          roomID,
          name
        }),
      };
      io.emit(`${member[i].username}`, action);
  //  }
  }


  return result;
};


const addMember = async (roomID, username) => {
  var result = true;
  const boxChat = await db.collection("BoxChat").findOne({
    roomID: roomID,
  });
  if (!boxChat) {
    console.log("fail find box chat");
    return false;
  }


  let find = await db.collection("User").findOne({
    username: username,
  });
  if (!find) {
    return false;
  }


  //update one user
  find.chatsList.push(boxChat);
  await db
    .collection("User")
    .updateOne(
      {
        username: username,
      },
      {
        $set: {
          chatsList: find.chatsList,
        },
      }
    )
    .catch((e) => {
      console.log(e);
      result = false;
    });

  
   //update box chat 
  await db.collection("BoxChat").updateOne(
    {
        roomID: roomID,
    },
    {
      $push: { member: { username:username, permisson:1 } }
    }
  ).catch((e) => {
      console.log("fail update box chat");
      return false;
    });

    const boxChatNew = await db.collection("BoxChat").findOne({
      roomID: roomID,
    });
    if (!boxChat) {
      console.log("fail find box chat");
      return false;
    } 

  //update all memeber
  const member = boxChatNew.member;
  for (var i = 0; i < member.length; i++) {
    //find user member
    const findUser = await db.collection("User").findOne({
      username: member[i].username,
    });
    if (!findUser) {
      return false;
    }

    //find boxchat in user and insert mess
    const findBoxChat = findUser.chatsList.some(
      (item) => item.roomID ===  boxChatNew.roomID
    );
    if (findBoxChat) {
      //find box chat
      findUser.chatsList.map((cur) => {
        if (cur.roomID === boxChatNew.roomID) {
          cur.member =  boxChatNew.member;
        }
      });
    } else {
      return false;
    }

    await db
      .collection("User")
      .updateOne(
        {
          username: member[i].username,
        },
        {
          $set: {
            chatsList: findUser.chatsList,
          },
        }
      )
      .catch((e) => {
        console.log(e);
        result = false;
      });
    if (!result) {
      return result;
    }

    //send notifi and socket all member != sender
  //  if (member[i].username != sender) {
      //send notifi with fcm
    

      //send mess with socket
      var action = {
        type: "newMember",
        data: true,
      };
      io.emit(`${member[i].username}`, action);
  //  }
  }


  return result;
};

const deleteMember = async (roomID, username) => {
  var result = true;
  const boxChat = await db.collection("BoxChat").findOne({
    roomID: roomID,
  });
  
  if (!boxChat) {
    console.log("fail find box chat");
    return false;
  }
  let find = await db.collection("User").findOne({
    username: username,
  });
  if (!find) {
    return false;
  }
 
  var memberT = boxChat.member.filter(
    (e) => e.username !== username
  );
  var chatsList = find.chatsList.filter(
    (e) => e.roomID !== roomID
  );

//update on user 
  await db
    .collection("User")
    .updateOne(
      {
        username: username,
      },
      {
        $set: {
          chatsList: chatsList,
        },
      }
    )
    .catch((e) => {
      console.log(e);
      result = false;
    });

//update box chat

  await db.collection("BoxChat").updateOne(
    {
        roomID: roomID,
    },
    {
      $set: {
        member: memberT,
      },
    }
  ).catch((e) => {
      console.log("fail update box chat");
      return false;
    });

  const boxChatNew = await db.collection("BoxChat").findOne({
      roomID: roomID,
    });
  if (!boxChatNew) {
      console.log("fail find box chat");
      return false;
  } 
  
     //update all user
  
//update all memeber
const member = boxChatNew.member;
for (var i = 0; i < member.length; i++) {
  //find user member
  const findUser = await db.collection("User").findOne({
    username: member[i].username,
  });
  if (!findUser) {
    return false;
  }

  //find boxchat in user and insert mess
  const findBoxChat = findUser.chatsList.some(
    (item) => item.roomID ===  boxChatNew.roomID
  );
  if (findBoxChat) {
    //find box chat
    findUser.chatsList.map((cur) => {
      if (cur.roomID === boxChatNew.roomID) {
        cur.member =  boxChatNew.member;
      }
    });
  } else {
    return false;
  }

  await db
    .collection("User")
    .updateOne(
      {
        username: member[i].username,
      },
      {
        $set: {
          chatsList: findUser.chatsList,
        },
      }
    )
    .catch((e) => {
      console.log(e);
      result = false;
    });
  if (!result) {
    return result;
  }

  //send notifi and socket all member != sender
//  if (member[i].username != sender) {
    //send notifi with fcm
  

    //send mess with socket
    var action = {
      type: "deleteMember",
      data: true,
    };
    io.emit(`${member[i].username}`, action);
//  }
}
var action = {
  type: "deleteMember",
  data: true,
};
io.emit(`${username}`, action);
  return result;
};


const deleteRoom = async (roomID) => {
  var result = true;
  const boxChat = await db.collection("BoxChat").findOne({
    roomID: roomID,
  });
  
  if (!boxChat) {
    console.log("fail find box chat");
    return false;
  }

  //delete box chat
  await db.collection("BoxChat").deleteOne(
    {
        roomID: roomID,
    }
  ).catch((e) => {
      console.log("fail update box chat");
      return false;
    });
  //delete box chat on user

  var member = boxChat.member;
  for (var i = 0; i < member.length; i++) {
    //find user member
    const findUser = await db.collection("User").findOne({
      username: member[i].username,
    });
    if (!findUser) {
      return false;
    }
  
    //find boxchat in user and insert mess
    const findBoxChat = findUser.chatsList.some(
      (item) => item.roomID ===  roomID
    );
    var newChatList = [];
    if (findBoxChat) {
      newChatList = findUser.chatsList.filter(
        (item) => item.roomID !== roomID
      );

    } else {
      return false;
    }
  
    await db
      .collection("User")
      .updateOne(
        {
          username: member[i].username,
        },
        {
          $set: {
            chatsList: newChatList,
          },
        }
      )
      .catch((e) => {
        console.log(e);
        result = false;
      });
    if (!result) {
      return result;
    }
  
    //send notifi and socket all member != sender
  //  if (member[i].username != sender) {
      //send notifi with fcm
    
  
      //send mess with socket
      var action = {
        type: "deleteRoom",
        data: true,
      };
      io.emit(`${member[i].username}`, action);
  //  }
  }
  return result;
};


const seederSave = async (roomID, index, username) => {
  var result = true;

  //find boxchat
  const boxChat = await db.collection("BoxChat").findOne({
    roomID: roomID,
  });
  if (!boxChat) {
    return false;
  }

  //add seeder
  await boxChat.messagesList.map((cur) => {
    if (cur.index === index) {
      var hasExist = cur.seeder.includes(username);
      if (!hasExist) {
        cur.seeder.push(username);
      }
    }
  });

  //save seeder on boxchat
  await db.collection("BoxChat").updateOne(
    {
      roomID: roomID,
    },
    {
      $set: {
        messagesList: boxChat.messagesList,
      },
    }
  );

  //save seeder on boxchat user
  const member = boxChat.member;
  for (var i = 0; i < member.length; i++) {
    //Find user member
    let find = await db.collection("User").findOne({
      username: member[i].username,
    });
    if (!find) {
      return false;
    }

    //Insert boxchat on collection boxchat
    find.chatsList.map((cur) => {
      if (cur.roomID === roomID) {
        cur.messagesList.map((cura) => {
          if (cura.index == index) {
            var hasExist = cura.seeder.includes(username);
            if (!hasExist) {
              cura.seeder.push(username);
            }
          }
        });
      }
    });

    await db
      .collection("User")
      .updateOne(
        {
          username: member[i].username,
        },
        {
          $set: {
            chatsList: find.chatsList,
          },
        }
      )
      .catch((e) => {
        console.log(e);
        result = false;
      });

    if (!result) {
      return result;
    }

    //send notifi and socket all member != username
    if (member[i].username != username) {
      //send mess with socket
      var action = {
        type: "seeder",
        data: JSON.stringify({
          roomID,
          index,
          username,
        }),
      };
      io.emit(`${member[i].username}`, action);
    }
  }

  return result;
};

const recallSave = async (roomID, index, username) => {
  var result = true;

  //find boxchat
  const boxChat = await db.collection("BoxChat").findOne({
    roomID: roomID,
  });
  if (!boxChat) {
    return false;
  }

  //add seeder
  await boxChat.messagesList.map((cur) => {
    if (cur.index === index) {
      var hasExist = cur.seeder.includes(username);
      if (!hasExist) {
        cur.recall = true;
      }
    }
  });

  //save seeder on boxchat
  await db.collection("BoxChat").updateOne(
    {
      roomID: roomID,
    },
    {
      $set: {
        messagesList: boxChat.messagesList,
      },
    }
  );

  //save seeder on boxchat user
  const member = boxChat.member;
  for (var i = 0; i < member.length; i++) {
    //Find user member
    let find = await db.collection("User").findOne({
      username: member[i].username,
    });
    if (!find) {
      return false;
    }

    //Insert boxchat on collection boxchat
    find.chatsList.map((cur) => {
      if (cur.roomID === roomID) {
        cur.messagesList.map((cura) => {
          if (cura.index == index) {
            var hasExist = cura.seeder.includes(username);
            if (!hasExist) {
              cura.recall = true;
            }
          }
        });
      }
    });

    await db
      .collection("User")
      .updateOne(
        {
          username: member[i].username,
        },
        {
          $set: {
            chatsList: find.chatsList,
          },
        }
      )
      .catch((e) => {
        console.log(e);
        result = false;
      });

    if (!result) {
      return result;
    }

    //send notifi and socket all member != username
    if (member[i].username != username) {
      //send mess with socket
      var action = {
        type: "recall",
        data: JSON.stringify({
          roomID,
          index,
          username,
        }),
      };
      io.emit(`${member[i].username}`, action);
    }
  }

  return result;
};

module.exports = {
  createBoxChat,
  validateMemberBoxChat,
  insertMessByRoomID,
  findChatHasExist,
  seederSave,
  recallSave,
  changeRoomName,
  addMember,
  deleteMember,
  deleteRoom
};
