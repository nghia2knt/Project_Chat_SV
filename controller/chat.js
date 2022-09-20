const {
  sendNewMessVal,
  sendMessByRoomIDVal,
  seederVal,
  recallVal,
  changeRoomNameVal,
  addMemberVal,
  deleteMemberVal,
  deleteRoomVal
} = require("../base/validate");
const { validate, createDefaultBoxChat, uploadFile } = require("../base/until");
const {
  createBoxChat,
  validateMemberBoxChat,
  insertMessByRoomID,
  findChatHasExist,
  seederSave,
  recallSave,
  changeRoomName,
  addMember,
  deleteMember, deleteRoom} = require("../service/chat");
const { valHasExistDB } = require("../service/auth");

const handleSendNewMess = async (req, res, next) => {
  try {
    const body = req.body;
    const valBody = validate(body, sendNewMessVal);

    //validate body data
    if (!valBody) {
      return next(new Error(`${400}:${"Validate data fail !"}`));
    }

    //validate user data
    const find = await valHasExistDB("username", req.user.username, "User");
    if (!find) {
      return next(new Error(`${404}:${"Not found user !"}`));
    }

    //validate you not send mess yourself
    const sendYourSelf = valBody.receiver.includes(req.user.username);
    if (sendYourSelf) {
      return next(new Error(`${404}:${"You not send mess yourself !"}`));
    }
    //validate receiver
    if (valBody.receiver.length == 0) {
      return next(new Error(`${404}:${"Receiver is empty !"}`));
    }

    //find box chat has exist if receiver = 1
    var boxChat = null;
    if (valBody.receiver.length == 1) {
      const findBoxChat = await findChatHasExist([
        req.user.username,
        valBody.receiver[0],
      ]);
      if (findBoxChat) {
        console.log("Find and Insert");
        req.body = {
          type: valBody.type,
          content: valBody.content,
          roomID: findBoxChat.roomID,
        };
        return handleSendMessByRoomID(req, res, next);
      }
    }

    //create Box chat if not find
    if (!boxChat) {
      boxChat = createDefaultBoxChat(
        req.user.username,
        valBody.receiver,
        valBody.type,
        valBody.content
      );
    }

    //Validate member group
    const member = boxChat.member;
    const validateMember = await validateMemberBoxChat(member);
    if (!validateMember) {
      return next(
        new Error(`${404}:${`Not found username member, Pls check log !`}`)
      );
    }

    //Insert box chat on db
    console.log("Create");
    const create = createBoxChat(boxChat, member, req.user.username);
    if (!create) {
      return next(new Error(`${400}:${`Create box fail, Pls check log !`}`));
    }

    //send notification
    //code here

    //send socket mess
    //code here

    return res.send({
      status: true,
    });
  } catch (e) {
    return next(new Error(`${400}:${e.message}`));
  }
  
};


const handleChangeRoomName = async (req, res, next) => {
  try {
    const body = req.body;
    const valBody = validate(body, changeRoomNameVal);

    //validate body data
    if (!valBody) {
      return next(new Error(`${400}:${"Validate data fail !"}`));
    }
    const changeName = await changeRoomName(
      valBody.roomID, valBody.name
    );
    if (!changeName) {
      return next(
        new Error(`${400}:${"change name on db fail, Pls check log!"}`)
      );
    }
    return res.send({
      status: true,
    });
   } catch (e) {
    return next(new Error(`${400}:${e.message}`));
    }
 
};


const handleAddMember = async (req, res, next) => {
  try {
    const body = req.body;
    const valBody = validate(body, addMemberVal);

    //validate body data
    if (!valBody) {
      return next(new Error(`${400}:${"Validate data fail !"}`));
    }
    //
    const addMemberT = await addMember(
      valBody.roomID, valBody.username
    );
  
    if (!addMemberT) {
      return next(
        new Error(`${400}:${"change on db fail, Pls check log!"}`)
      );
    }
    return res.send({
      status: true,
    });
   } catch (e) {
    return next(new Error(`${400}:${e.message}`));
    }
 
};

const handleDeleteMember = async (req, res, next) => {
  try {
    const body = req.body;
    const valBody = validate(body, deleteMemberVal);

    //validate body data
    if (!valBody) {
      return next(new Error(`${400}:${"Validate data fail !"}`));
    }
    //
    const deleteMemberT = await deleteMember(
      valBody.roomID, valBody.username
    );
  
    if (!deleteMemberT) {
      return next(
        new Error(`${400}:${"change on db fail, Pls check log!"}`)
      );
    }
    return res.send({
      status: true,
    });
   } catch (e) {
    return next(new Error(`${400}:${e.message}`));
    }
 
};
const handleDeleteRoom = async (req, res, next) => {
  try {
    const body = req.body;
    const valBody = validate(body, deleteRoomVal);

    //validate body data
    if (!valBody) {
      return next(new Error(`${400}:${"Validate data fail !"}`));
    }
    //
    const deleteRoomT = await deleteRoom(
      valBody.roomID
    );
  
    if (!deleteRoomT) {
      return next(
        new Error(`${400}:${"change on db fail, Pls check log!"}`)
      );
    }
    return res.send({
      status: true,
    });
   } catch (e) {
    return next(new Error(`${400}:${e.message}`));
    }
 
};

const handleSendMessByRoomID = async (req, res, next) => {
  try {
    const body = req.body;
    const valBody = validate(body, sendMessByRoomIDVal);

    //validate body data
    if (!valBody) {
      return next(new Error(`${400}:${"Validate data fail !"}`));
    }

    //validate user data
    const find = await valHasExistDB("username", req.user.username, "User");
    if (!find) {
      return next(new Error(`${404}:${"Not found user !"}`));
    }

    //validate boxchat
    const boxChat = await valHasExistDB("roomID", valBody.roomID, "BoxChat");
    if (!boxChat) {
      return next(new Error(`${404}:${"Not found box chat !"}`));
    }

    //validate username in group ?
    const join = boxChat.member.some(
      (item) => item.username === req.user.username
    );
    if (!join) {
      return next(
        new Error(`${400}:${"You not permission send mess on group !"}`)
      );
    }

    //insert mess on db
    const insertMess = await insertMessByRoomID(
      boxChat,
      req.user.username,
      valBody.type,
      valBody.content
    );
    if (!insertMess) {
      return next(
        new Error(`${400}:${"Insert mess on db fail, Pls check log!"}`)
      );
    }
  


    return res.send({
      status: true,
    });
  } catch (e) {
    return next(new Error(`${400}:${e.message}`));
  }
};

const handleSeeder = async (req, res, next) => {
  try {
    const body = req.body;
    const valBody = validate(body, seederVal);

    //validate body data
    if (!valBody) {
      return next(new Error(`${400}:${"Validate data fail !"}`));
    }

    //validate user data
    const find = await valHasExistDB("username", req.user.username, "User");
    if (!find) {
      return next(new Error(`${404}:${"Not found user !"}`));
    }

    //save seeder to db
    const seeder = seederSave(valBody.roomID, valBody.index, req.user.username);
    if (!seeder) {
      return next(
        new Error(`${400}:${"Save seeder to mess fail, Pls check log !"}`)
      );
    }

    return res.send({
      status: true,
    });
  } catch (e) {
    return next(new Error(`${400}:${e.message}`));
  }
};

const handleRecall = async (req, res, next) => {
  try {
    const body = req.body;
    const valBody = validate(body, recallVal);

    //validate body data
    if (!valBody) {
      return next(new Error(`${400}:${"Validate data fail !"}`));
    }

    //validate user data
    const find = await valHasExistDB("username", req.user.username, "User");
    if (!find) {
      return next(new Error(`${404}:${"Not found user !"}`));
    }

    const recall = recallSave(valBody.roomID, valBody.index, req.user.username);
    if (!recall) {
      return next(
        new Error(`${400}:${"Recall to mess fail, Pls check log !"}`)
      );
    }

    return res.send({
      status: true,
    });
  } catch (e) {
    return next(new Error(`${400}:${e.message}`));
  }
};

const handleUploadFile = async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) {
      return next(new Error(`${404}:${"Please upload file !"}`));
    }

    //upload file on firebase storange
    const upload = await uploadFile(req.file, `file/${req.user.username}/`);
    if (!upload) {
      return next(new Error(`${400}:${"Upload file fail!"}`));
    }

    return res.send({
      status: true,
      data: upload,
    });
  } catch (e) {
    return next(new Error(`${400}:${e.message}`));
  }
};

module.exports = {
  handleSendNewMess,
  handleSendMessByRoomID,
  handleSeeder,
  handleRecall,
  handleUploadFile,
  handleChangeRoomName,
  handleAddMember,
  handleDeleteMember,
  handleDeleteRoom
};
