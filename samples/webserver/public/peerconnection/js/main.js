"use strict";

let localVideo = document.querySelector("video#localVideo");
let remoteVideo = document.querySelector("video#remoteVideo");
let btnStart = document.querySelector("button#start");
let btnCall = document.querySelector("button#call");
let btnHangup = document.querySelector("button#hangup");

btnStart.onclick = start;
btnCall.onclick = call;
btnHangup.onclick = hangup;

let localStream, pc1, pc2;

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
    navigator.mediaDevices.getUserMedia(constraints).then(getMediaStream).catch(handleError);
  }
}

function getMediaStream(stream) {
  localVideo.srcObject = stream;
  localStream = stream;
}

function handleError(err) {
  console.error("Failed to get Media Stream!", err);
}

function call() {
  pc1 = new RTCPeerConnection();
  pc2 = new RTCPeerConnection();
  pc1.onicecandidate = e => {
    pc2.addIceCandidate(e.candidate);
  };
  pc2.onicecandidate = e => {
    pc1.addIceCandidate(e.candidate);
  };

  pc2.ontrack = getRemoteStream;

  localStream.getTracks().forEach(track => {
    pc1.addTrack(track, localStream);
  });

  //媒体协商--------------------------------------------
  let offerOptions = {
    offerToReceiveAudio: 0,
    offerToReceiveVideo: 1,
  };
  pc1.createOffer(offerOptions).then(getOffer).catch(handleOfferError);
}

function getRemoteStream(streams) {
  console.log("pc remote", streams);
  remoteVideo.srcObject = streams.streams[0];
}

function getOffer(desc) {
  pc1.setLocalDescription(desc);

  //send desc to signal
  //receive desc from signal

  pc2.setRemoteDescription(desc);

  pc2.createAnswer().then(getAnswer).catch(handleAnswerError);
}

function getAnswer(desc) {
  pc2.setLocalDescription(desc);

  //send desc to signal
  //receive desc from signal

  pc1.setRemoteDescription(desc);
}

function handleAnswerError(err) {
  console.log("Failed to answer:", err);
}

function handleOfferError(err) {
  console.log("Failed to create offer:", err);
}

function hangup() {
  pc1.close();
  pc2.close();
  pc1 = null;
  pc2 = null;
}
