'use strict'

let http = require('http')
let https = require('https')
let fs = require('fs')
let express = require('express')
let serveIndex = require('serve-index')

let app = express()
app.use(serveIndex('./public'))
app.use(express.static('./public'))

// http server--------------------------------------------
let http_server = http.createServer(app)
http_server.listen(8080, '0.0.0.0')
// https server--------------------------------------------
let options = {
  key: fs.readFileSync('./cert/1557605_www.learningrtc.cn.key'),
  cert: fs.readFileSync('./cert/1557605_www.learningrtc.cn.pem')
}

let https_server = https.createServer(options, app)
https_server.listen(443, '0.0.0.0')