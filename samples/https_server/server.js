'use strict'

let https = require('https')
let fs = require('fs')

let options = {
  key: fs.readFileSync("./cert/1557605_www.learningrtc.cn.key"),
  cert: fs.readFileSync("./cert/1557605_www.learningrtc.cn.pem")
}
let app = https.createServer(options, (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/plain"
  })

  res.end("Hello World!\n")

}).listen(443, '192.168.1.104')