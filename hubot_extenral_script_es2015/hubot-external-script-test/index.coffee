fs   = require 'fs'
path = require 'path'

module.exports = (robot) ->
  path = path.resolve __dirname, 'lib'
  console.log(path)
  fs.exists path, (exists) ->
    console.log(exists)
    if exists
      robot.loadFile path, file for file in fs.readdirSync(path)
