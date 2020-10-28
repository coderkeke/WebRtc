"use strict";

let http = require("http");
let https = require("https");
let fs = require("fs");
let express = require("express");
let socketIo = require("socket.io");
let serveIndex = require("serve-index");

let USERCOUNT = 3;

//日志--------------------------------------------
let log4js = require("log4js");
log4js.configure({
  appenders: {
    file: {
      type: "file",
      filename: "app.log",
      layout: {
        type: "pattern",
        pattern: "%r %p -%m",
      },
    },
  },
  categories: {
    default: {
      appenders: ["file"],
      level: "debug",
    },
  },
});
let logger = log4js.getLogger();

let app = express();
app.use(serveIndex("./public"));
app.use(express.static("./public"));

// http server--------------------------------------------
let http_server = http.createServer(app);
http_server.listen(8080, "0.0.0.0");
// https server--------------------------------------------
let options = {
  key: fs.readFileSync("./cert/1557605_www.learningrtc.cn.key"),
  cert: fs.readFileSync("./cert/1557605_www.learningrtc.cn.pem"),
};

let https_server = https.createServer(options, app);
let io = socketIo.listen(https_server);

//connection
io.sockets.on("connection", socket => {
  logger.debug("connection", '---');
  socket.on("join", room => {
    socket.join(room);
    let myRoom = io.sockets.adapter.rooms[room];
    let users = myRoom ? Object.keys(myRoom.sockets).length : 0;
    logger.debug("56 the number of user in room is: ", socket.id, users);
    //人数少于3个时--------------------------------------------
    if (users < USERCOUNT) {
      socket.emit("joined", room, socket.id);

      if (users > 1) {
        socket.to(room).emit("otherjoin", room, socket.id);
      }
    } else {
      //超过2个人时--------------------------------------------
      socket.leave(room);
      socket.emit("full", room, socket.id);
    }
    //给自己--------------------------------------------
    // socket.emit('joined', room, socket.id)
    //除自己之外--------------------------------------------
    // socket.to(room).emit("joined", room, socket.id);
    //房间里的所有人--------------------------------------------
    // io.in(room).emit('joined', room, socket.id)
    //除自己外节点的所有人--------------------------------------------
    // socket.broadcast.emit("joined", room, socket.id);
  });

  //监听消息--------------------------------------------
  socket.on("message", (room, data) => {
    logger.debug("81 message", room, data.type ? data.type : null, socket.id);
    socket.to(room).emit("message", room, socket.id, data);
    // io.in(room).emit("message", room, socket.id, message);
  });

  socket.on("leave", room => {
    let myRoom = io.sockets.adapter.rooms[room];
    let users = myRoom ? Object.keys(myRoom.sockets).length : 0;
    logger.debug("the number of user in room is: " + (users - 1));
    socket.leave(room);
    //给自己--------------------------------------------
    socket.emit("leaved", room, socket.id);
    //除自己之外--------------------------------------------
    socket.to(room).emit("bye", room, socket.id);
    //房间里的所有人--------------------------------------------
    // io.in(room).emit('joined', room, socket.id)
    //除自己外节点的所有人--------------------------------------------
    // socket.broadcast.emit('joined', room, socket.id)
  });
});

https_server.listen(443, "0.0.0.0");
logger.info("-------------success Server--------------")