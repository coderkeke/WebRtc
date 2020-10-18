'use strict'

let userName = document.querySelector('input#username')
let inputRoom = document.querySelector('input#room')
let btnConnect = document.querySelector('button#connect')
let outputArea = document.querySelector('textarea#output')
let inputArea = document.querySelector('textarea#input')
let btnSend = document.querySelector('button#send')

let socket, room;

btnConnect.onclick = () => {
  //connect
  socket = io.connect()
  //message
  socket.on('joined', (room, id) => {
    btnConnect.disabled = true
    inputArea.disabled = false
    btnSend.disabled = false
  })

  socket.on('leaved', (room, id) => {
    btnConnect.disabled = false
    inputArea.disabled = true
    btnSend.disabled = true
  })


  socket.on('message', (room, id, data) => {
    outputArea.value = outputArea.value + data + '\r'
  })
  //send message
  room = inputRoom.value
  socket.emit('join', room)
}

btnSend.onclick = () => {
  let data = inputArea.value
  data = userName.value + ':' + data
  socket.emit('message', room, data)
  inputArea.value = ''
}