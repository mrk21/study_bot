fs   = require 'fs'
path = require 'path'

module.exports = (robot) ->
  path = path.resolve __dirname, 'scripts'
  fs.exists path, (exists) ->
    if exists
      robot.loadFile path, file for file in fs.readdirSync(path)
