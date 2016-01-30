var express = require('express')
var _ = require('lodash')
var bodyParser = require('body-parser')

var chemicals = []

var setUpServer = function (plasma, dna) {
  var app = express()

  /* SERVER CONFIG */
  app.set('view engine', 'ejs')
  app.use(bodyParser.urlencoded({ extended: false }))

  /* SERVER ROUTES */
  app.get('/bootstrap.min.css', function (req, res) {
    res.sendFile(__dirname + '/node_modules/bootstrap/dist/css/bootstrap.min.css', 'utf8')
  })
  app.get('/bootstrap.min.js', function (req, res) {
    res.sendFile(__dirname + '/node_modules/bootstrap/dist/js/bootstrap.min.js', 'utf8')
  })
  app.get('/jquery.min.js', function (req, res) {
    res.sendFile(__dirname + '/node_modules/jquery/dist/jquery.min.js', 'utf8')
  })
  app.get('/', function (req, res) {
    var listeners = plasma['listeners'].map(function (listener) {
      return listener.pattern
    })
    listeners = _.uniq(listeners)
    listeners = _.sortBy(listeners, function (a) {
      return a.toUpperCase()
    })
    res.render(__dirname + '/view.ejs', {chemicals: chemicals, listeners: listeners})
  })

  var server = app.listen(dna.port || 1335, function () {
    console.log('Organic emailpreview listening at http://localhost:%s', server.address().port)
  })

  var sockets = {}
  var nextSocketId = 0

  server.on('connection', function (socket) {
    var socketId = nextSocketId++
    sockets[socketId] = socket
    socket.on('close', function () {
      delete sockets[socketId]
    })
  })

  plasma.on(dna.closeOn || 'kill', function (c, next) {
    for (var socketId in sockets) {
      sockets[socketId].destroy()
    }
    server.close(function () {
      next()
    })
  })
}

module.exports = function (plasma, dna) {
  this.plasma = plasma
  this.dna = dna
  this.templateCache = {}

  var self = this

  setUpServer(plasma, dna)

  plasma.pipe(function (chemical) {
    var unsubscribed = self.dna.unsubscribedTypes || ['console', 'build']
    if (unsubscribed.indexOf(chemical.type) === -1) {
      try {
        chemical.jsonRepresentation = JSON.stringify(chemical, null, 4)
      } catch (e) {
        chemical = {
          type: 'shit object'
        }
        chemical.jsonRepresentation = JSON.stringify(chemical, null, 4)
      }
      chemicals.push(chemical)
    }
  })
}
