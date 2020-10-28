"use strict";

let localVideo = document.querySelector("video#localVideo");
let remoteVideo = document.querySelector("video#remoteVideo");
let btnStart = document.querySelector("button#start");
let btnCall = document.querySelector("button#call");
let btnHangup = document.querySelector("button#hangup");
let offerSDP = document.querySelector("textarea#offer");
let answerSDP = document.querySelector("textarea#answer");

let btnConn = document.querySelector("button#connserver");
let btnLeave = document.querySelector("button#leave");

btnStart.onclick = start;
btnCall.onclick = call;
btnHangup.onclick = hangup;

let localStream = null,
  socket = null,
  state = "init",
  roomid = "coderke",
  pc,
  senderTime,
  lastResult,
  bitrateGraph,
  bitrateSeries,
  packetGraph,
  packetSeries;

btnConn.onclick = connSignalServer;
btnLeave.onclick = leave;

//首次运行引导用户，信任域名
var first = window.localStorage.getItem("first");
if (first == null) {
  if (
    navigator.mediaDevices.getUserMedia ||
    navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia
  ) {
    //调用用户媒体设备, 访问摄像头
    getUserMedia(
      {
        video: {
          width: 480,
          height: 320,
        },
      },
      success,
      error
    );
  } else {
    alert("不支持访问用户媒体");
  }
}

function success(stream) {
  console.log(stream);
  window.localStorage.setItem("first", "false");
  window.location.reload();
}

function error(error) {
  console.log(`访问用户媒体设备失败${error.name}, ${error.message}`);
}

function connSignalServer() {
  //开启本地视频--------------------------------------------
  start();
  return;
}

//用户离开--------------------------------------------
function leave() {
  if (socket) {
    clearInterval(senderTime);
    socket.emit("leave", roomid);
  }

  //关闭连接--------------------------------------------
  closePeerConnection();
  //关闭本地媒体信息--------------------------------------------
  closeLocalMedia();

  btnConn.disabled = false;
  btnLeave.disabled = true;
}

//开始获取本地媒体流--------------------------------------------
function start() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    console.error("the getUserMedia is not supported");
    return;
  } else {
    let constraints = {
      video: {
        width: {
          min: 16,
          max: 320,
        },
        height: {
          min: 9,
          max: 240,
        },
        //帧率--------------------------------------------
        frameRate: {
          min: 15,
          max: 30,
        },
      },
      audio: false,
    };
    navigator.mediaDevices.getUserMedia(constraints).then(getMediaStream).catch(handleMediaError);
  }
}

//得到本地媒体流--------------------------------------------
function getMediaStream(stream) {
  localStream = stream;
  localVideo.srcObject = stream;

  conn();

  bitrateSeries = new TimelineDataSeries();
  bitrateGraph = new TimelineGraphView("bitrateGraph", "bitrateCanvas");
  bitrateGraph.updateEndDate();

  packetSeries = new TimelineDataSeries();
  packetGraph = new TimelineGraphView("packetGraph", "packetCanvas");
  packetGraph.updateEndDate();
}

//链接socket房间监听消息--------------------------------------------
function conn() {
  //链接--------------------------------------------
  socket = io.connect();

  //加入房间后--------------------------------------------
  socket.on("joined", (room, id) => {
    state = "joined";
    btnConn.disabled = true;
    btnLeave.disabled = false;
    createPeerConnection();
    console.log("receive joined message:", room, id, state);
  });

  //第三方加入房间后--------------------------------------------
  socket.on("otherjoin", (room, id) => {
    //如果处于未绑定状态--------------------------------------------
    if (state === "joined_unbind") {
      createPeerConnection();
    }
    //第三方加入后改状态--------------------------------------------
    state = "joined_conn";
    //媒体协商--------------------------------------------
    call();
    console.log("receive otherjoin message:", room, id, state);
  });

  //房间满了之后--------------------------------------------
  socket.on("full", (room, id) => {
    state = "leaved";
    //关掉socket连接--------------------------------------------
    socket.disconnect();
    alert("the room is full");
    console.log("receive full message:", room, id, state);

    btnConn.disabled = false;
    btnLeave.disabled = true;
  });

  //离开房间--------------------------------------------
  socket.on("leaved", (room, id) => {
    state = "leaved";
    //关掉socket连接--------------------------------------------
    socket.disconnect();
    console.log("receive leaved message:", room, id, state);

    btnConn.disabled = false;
    btnLeave.disabled = true;
  });

  //bye--------------------------------------------
  socket.on("bye", (room, id) => {
    state = "joined_unbind";
    //关闭PeerConnection--------------------------------------------
    closePeerConnection();
    console.log("receive bye message:", room, id, state);
  });

  //消息--------------------------------------------
  socket.on("message", (room, id, data) => {
    console.log("receive client message:", room, id, data);
    //媒体协商--------------------------------------------
    if (data) {
      //收到offer时--------------------------------------------
      if (data.type === "offer") {
        console.log("offer----------------------", data);
        console.log(new RTCSessionDescription(data));
        pc.setRemoteDescription(new RTCSessionDescription(data));
        pc.createAnswer().then(getAnswer).catch(handleAnswerError);
      } else if (data.type === "answer") {
        console.log("answer----------------------", data);
        pc.setRemoteDescription(new RTCSessionDescription(data));
      } else if (data.type === "candidate") {
        console.log("candidate----------------------", data);
        let candidate = new RTCIceCandidate({
          sdpMLineIndex: data.label,
          candidate: data.candidate,
        });
        pc.addIceCandidate(candidate);
      } else {
        console.log("the message is invalid", data);
      }
    }
  });

  //加入房间--------------------------------------------
  socket.emit("join", roomid);
  return;
}

//创建createPeerConnection--------------------------------------------
function createPeerConnection() {
  console.log("create RTCPeerConnection!", pc);

  if (!pc) {
    let pcConfig = {
      iceServers: [
        {
          urls: "turn:stun.al.learningrtc.cn:3478",
          //凭证密码--------------------------------------------
          credential: "mypasswd",
          //用户名--------------------------------------------
          username: "garrylea",
        },
      ],
    };

    pc = new RTCPeerConnection();

    pc.onicecandidate = e => {
      if (e.candidate) {
        // console.log("find an new candidate");
        sendMessage(roomid, {
          type: "candidate",
          label: e.candidate.sdpMLineIndex,
          id: e.candidate.sdpMid,
          candidate: e.candidate.candidate,
        });
      } else {
        console.log("End of candidates.");
      }
    };

    pc.ontrack = streams => {
      console.log(streams);
      remoteVideo.srcObject = streams.streams[0];
    };
  }

  //本地视频流--------------------------------------------
  if (localStream) {
    localStream.getTracks().forEach(track => {
      pc.addTrack(track, localStream);
    });
  }

  senderTime = setInterval(() => {
    let sender = pc.getSenders()[0];
    if (!sender) {
      return;
    }
    sender
      .getStats()
      .then(reports => {
        reports.forEach(report => {
          if (report.type == "outbound-rtp") {
            console.log(report);
            if (report.isRemote) {
              return;
            }

            let curTs = report.timestamp;
            let bytes = report.bytesSent;
            let packets = report.packetsSent;
            console.log(curTs, bytes, packets);
            if (lastResult && lastResult.has(report.id)) {
              let bitrate =
                (8 * (bytes - lastResult.get(report.id).bytesSent)) /
                (curTs - lastResult.get(report.id).timestamp);
              bitrateSeries.addPoint(curTs, bitrate);
              bitrateGraph.setDataSeries([bitrateSeries]);
              bitrateGraph.updateEndDate();

              packetSeries.addPoint(curTs, packets - lastResult.get(report.id).packetsSent);
              packetGraph.setDataSeries([packetSeries]);
              packetGraph.updateEndDate();
            }
          }
        });

        lastResult = reports;
      })
      .catch(err => {
        console.error(err);
      });
  }, 1000);
}

//关闭closePeerConnection--------------------------------------------
function closePeerConnection() {
  console.log("close RTCPeerCOnnection!");
  if (pc) {
    pc.close();
    pc = null;
  }
}

//关闭本地媒体流--------------------------------------------
function closeLocalMedia() {
  if (localStream && localStream.getTracks()) {
    localStream.getTracks().forEach(track => {
      track.stop();
    });
  }
  localStream = null;
}
//获取本地媒体流失败--------------------------------------------
function handleMediaError(err) {
  console.error("Failed to get Media Stream!", err);
}

//开始媒体协商--------------------------------------------
function call() {
  if (state == "joined_conn") {
    if (pc) {
      //媒体协商--------------------------------------------
      let offerOptions = {
        offerToReceiveAudio: 1,
        offerToReceiveVideo: 1,
      };
      pc.createOffer(offerOptions).then(getOffer).catch(handleOfferError);
    }
  }
}

//得到offer--------------------------------------------
function getOffer(desc) {
  pc.setLocalDescription(desc);
  console.log("offer", desc);
  sendMessage(roomid, desc);
  offerSDP.value = desc.sdp;
}

//发送socket消息函数--------------------------------------------
function sendMessage(roomid, data) {
  // console.log("send p2p message", roomid, data);
  if (socket) {
    socket.emit("message", roomid, data);
  }
}

//获取offer失败--------------------------------------------
function handleOfferError(err) {
  console.log("Failed to create offer:", err);
}

function getRemoteStream(streams) {
  console.log("pc remote", streams);
  remoteVideo.srcObject = streams.streams[0];
}

//得到应答时--------------------------------------------
function getAnswer(desc) {
  pc.setLocalDescription(desc);
  sendMessage(roomid, desc);
  answerSDP.value = desc.sdp;
}

//应答失败时--------------------------------------------
function handleAnswerError(err) {
  console.log("Failed to answer:", err);
}

function hangup() {
  pc.close();
  pc2.close();
  pc = null;
  pc2 = null;
}
