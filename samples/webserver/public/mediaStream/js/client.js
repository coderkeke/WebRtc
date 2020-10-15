'use strict'
let audioSource = document.querySelector("select#audioSource")
let audioOutput = document.querySelector("select#audioOutput")
let videoSource = document.querySelector("select#videoSource")

if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
  console.log("getUserMedia is not supported");
} else {
  let constraints = {
    video: {
      width: 320,
      height: 240,
      //帧率--------------------------------------------
      frameRate: 60,
      //摄像头 environment后置 user前置--------------------------------------------
      facingMode: "environment"
    },
    audio: false
  }

  navigator.mediaDevices.getUserMedia(constraints)
    .then(gotMediaStream)
    .then(gotDevices)
    .catch(handleError)
}

let videoPlayer = document.querySelector("video#player")

//获取视频流--------------------------------------------
function gotMediaStream(stream) {
  videoPlayer.srcObject = stream
  return navigator.mediaDevices.enumerateDevices()
}

function handleError(err) {
  console.log(err);
}

//获取设备--------------------------------------------
function gotDevices(deviceInfos) {
  deviceInfos.forEach(deviceInfo => {
    console.log(deviceInfo);
    let option = document.createElement('option')
    option.text = deviceInfo.label
    option.value = deviceInfo.deviceId
    if (deviceInfo.kind === 'audioinput') {
      audioSource.appendChild(option)
    } else if (deviceInfo.kind === 'audiooutput') {
      audioOutput.appendChild(option)
    } else if (deviceInfo.kind === 'videoinput') {
      videoSource.appendChild(option)
    }
  })
}