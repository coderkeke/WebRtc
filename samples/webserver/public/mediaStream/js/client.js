'use strict'
let audioSource = document.querySelector("select#audioSource")
let audioOutput = document.querySelector("select#audioOutput")
let videoSource = document.querySelector("select#videoSource")

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
      audio: false

      // {
      //   // 音频大小--------------------------------------------
      //   volume: 0,
      //   // 采样率--------------------------------------------
      //   // sampleRate: 8000,
      //   // sampleSize: 16,
      //   // 回音--------------------------------------------
      //   echoCancellation: false,
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