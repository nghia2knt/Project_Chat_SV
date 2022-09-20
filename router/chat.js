const router = require("express").Router();
const { auth, upload } = require("../base/middleware");
const {
  handleSendNewMess,
  handleSendMessByRoomID,
  handleSeeder,
  handleRecall,
  handleUploadFile,
  handleChangeRoomName,
  handleAddMember,
  handleDeleteMember,
  handleDeleteRoom
} = require("../controller/chat");

router.route("/sendnewmess").post(auth, handleSendNewMess);
router.route("/sendmessbyroomid").post(auth, handleSendMessByRoomID);
router.route("/seender").post(auth, handleSeeder);
router.route("/recall").post(auth, handleRecall);
router.route("/changeroomname").post(auth, handleChangeRoomName);
router.route("/addmember").post(auth, handleAddMember);
router.route("/deletemember").post(auth, handleDeleteMember);
router.route("/deleteroom").post(auth, handleDeleteRoom);
router
  .route("/uploadfile")
  .post(auth, upload.single("filename"), handleUploadFile);

module.exports = router;
