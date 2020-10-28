"use strict";
let createOffer = document.querySelector("button#createOffer");
let pc = new RTCPeerConnection();
let pc2 = new RTCPeerConnection();

createOffer.onclick = test;

function test() {
  if (!pc) {
    console.log("pc is null");
    return;
  }

  getStream();
  return;
}

function getStream() {
  let constraints = {
    audio: false,
    video: true,
  };
  navigator.mediaDevices
    .getUserMedia(constraints)
    .then(getMediaStream)
    .catch(handleError.bind(null, "media stream"));
}

function getMediaStream(stream) {
  stream.getTracks().forEach(track => {
    pc.addTrack(track);
  });
  let options = {
    offerToReceiveAudio: 0,
    offerToReceiveVideo: 1,
    iceRestart: true,
  };
  pc.createOffer(options).then(getOffer).catch(handleError.bind(null, "offer"));
}

function getOffer(desc) {
  console.log(desc.sdp);
  pc.setLocalDescription(desc);
  pc2.setRemoteDescription(desc);
  pc2.createAnswer().then(getAnswer).catch(handleError.bind(null, "answer"));
}

function getAnswer(desc) {
  console.log("answer:", desc.sdp);
  pc2.setLocalDescription(desc);
  pc.setRemoteDescription(desc);
}

function handleError(message, err) {
  console.log(`failed to get ${message ? message : ""}:`, err);
}
