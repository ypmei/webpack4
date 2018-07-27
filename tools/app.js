var glob = require('glob')
var path = require('path')
var express = require('express');
var app = express();

var appSetup = function(app){
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT,DELETE,PATCH");
    next()
  })

  glob.sync(path.join(__dirname, 'routes', '*.js')).forEach((file) => {
    app.use('/user', require(file))
  })

}
module.exports = appSetup
