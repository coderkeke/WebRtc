'use strict'
//devices
let audioSource = document.querySelector("select#audioSource")
let audioOutput = document.querySelector("select#audioOutput")
let videoSource = document.querySelector("select#videoSource")
//filter
let filtersSelect = document.querySelector('select#filter')
//picture
let snapshot = document.querySelector('button#snapshot')
let picture = document.querySelector('canvas#picture')
picture.width = 320
picture.height = 240
//constraint
let divConstraints = document.querySelector('div#constraints')
//button
let btnRecord = document.querySelector('button#record')
let btnRecPlay = document.querySelector('button#recPlay')
let btnDownLoad = document.querySelector('button#downLoad')
//recPlayer
let recPlayer = document.querySelector('video#recPlayer')
//videoPlayer
let videoPlayer = document.querySelector("video#player")
//audioPlayer
let audioPlayer = document.querySelector('audio#audioPlayer')
//buffer
let buffer
let mediaRecorder

start()

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


//获取视频流--------------------------------------------
function gotMediaStream(stream) {
  window.stream = stream
  videoPlayer.srcObject = stream
  let videoTrack = stream.getVideoTracks()[0]
  let videoConstraints = videoTrack.getSettings()
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


videoSource.onchange = start

filtersSelect.onchange = function () {
  videoPlayer.className = filtersSelect.value
}

snapshot.onclick = function () {
  picture.className = filtersSelect.value
  picture.getContext('2d').drawImage(videoPlayer, 0, 0, picture.width, picture.height)
}

btnRecord.onclick = function () {
  console.log(btnRecord.textContent);
  if (btnRecord.textContent === 'Start Record') {
    startRecord()
    btnRecord.textContent = 'Stop Record'
    btnRecPlay.disabled = true
    btnDownLoad.disabled = true
  } else {
    stopRecord()
    btnRecord.textContent = 'Start Record'
    btnRecPlay.disabled = false
    btnDownLoad.disabled = false
  }
}

btnRecPlay.onclick = function () {
  console.log(buffer);
  let blob = new Blob(buffer, {
    type: 'video/webm'
  })
  console.log(blob);
  recPlayer.src = window.URL.createObjectURL(blob)
  recPlayer.srcObject = null
  recPlayer.controls = true
  recPlayer.play()
}

btnDownLoad.onclick = function () {
  let blob = new Blob(buffer, {
    type: 'video/webm'
  })
  let url = window.URL.createObjectURL(blob)
  let a = document.createElement('a')
  a.href = url
  a.style.display = 'none'
  a.download = 'aaa.webm'
  a.click()
}


function startRecord() {
  buffer = []
  let options = {
    mimeType: 'video/webm;codecs=vp8'
  }
  if (!MediaRecorder.isTypeSupported(options.mimeType)) {
    console.error(`${options.mimeType} is not supported`)
    return

  }
  try {
    mediaRecorder = new MediaRecorder(window.stream, options);
  } catch (error) {
    console.error("Failed to create MediaRecorder:", e);
  }
  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.start(10);
}

function handleDataAvailable(e) {
  if (e && e.data && e.data.size > 0) {
    buffer.push(e.data)
  }
}

function stopRecord() {
  mediaRecorder.stop()
}