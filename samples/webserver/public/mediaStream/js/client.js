'use strict'

if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
  console.log("getUserMedia is not supported");
} else {
  let constraints = {
    video: true,
    audio: true
  }
  navigator.mediaDevices.getUserMedia(constraints).then(gotMediaStream).catch(handleError)
}

let videoPlayer = document.querySelector("video#player")

function gotMediaStream(stream) {
  videoPlayer.srcObject = stream
}

function handleError(err) {
  console.log(err);
}