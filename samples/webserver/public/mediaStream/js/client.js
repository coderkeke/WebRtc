'use strict'
//devices
let audioSource = document.querySelector("select#audioSource")
let audioOutput = document.querySelector("select#audioOutput")
let videoSource = document.querySelector("select#videoSource")
//audio
let audioPlayer = document.querySelector('audio#audioPlayer')
//filter
let filtersSelect = document.querySelector('select#filter')
//picture
let snapshot = document.querySelector('button#snapshot')
let picture = document.querySelector('canvas#picture')
picture.width = 320
picture.height = 240

//constraint
let divConstraints = document.querySelector('div#constraints')

function start() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    console.log("getUserMedia is not supported");
  } else {
    let deviceId = videoSource.value
    let constraints = {
      video: {
        width: {
          min: 16,
          max: 320
        },
        height: {
          min: 9,
          max: 240
        },
        //帧率--------------------------------------------
        frameRate: {
          min: 15,
          max: 30
        },
        //摄像头 environment后置--------------------------------------------
        facingMode: "environment",
        deviceId: deviceId ? deviceId : undefined
      },
      // audio: {
      //   // 音频大小--------------------------------------------
      //   volume: 200,
      //   // 采样率--------------------------------------------
      //   sampleRate: 8000,
      //   sampleSize: 16,
      //   // 回音--------------------------------------------
      //   echoCancellation: true,
      //   // 是否增加音量--------------------------------------------
      //   autoGainControl: false,
      //   // 降噪--------------------------------------------
      //   noiseSuppression: true,
      //   // 延迟--------------------------------------------
      //   latency: 200,
      //   // 单双通道--------------------------------------------
      //   // channelCount
      //   // 设备切换--------------------------------------------
      //   // deviceID:""
      //   // --------------------------------------------
      //   // groupID:
      // },
      // video: false,
      audio: true
    }
    navigator.mediaDevices.getUserMedia(constraints)
      .then(gotMediaStream)
      .then(gotDevices)
      .catch(handleError)
  }
}

let videoPlayer = document.querySelector("video#player")

//获取视频流--------------------------------------------
function gotMediaStream(stream) {
  videoPlayer.srcObject = stream
  console.log(stream);
  console.log(stream.getVideoTracks());
  let videoTrack = stream.getVideoTracks()[0]
  let videoConstraints = videoTrack.getSettings()
  console.log(videoConstraints);
  divConstraints.textContent = JSON.stringify(videoConstraints, null, 2)
  audioPlayer.srcObject = stream
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

start()
videoSource.onchange = start

filtersSelect.onchange = function () {
  videoPlayer.className = filtersSelect.value
}

snapshot.onclick = function () {
  picture.className = filtersSelect.value
  picture.getContext('2d').drawImage(videoPlayer, 0, 0, picture.width, picture.height)
}