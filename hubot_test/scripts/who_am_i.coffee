module.exports = (robot) ->
  robot.respond /who am i/i, (res) ->
    res.send "You are #{res.message.user.name}"
