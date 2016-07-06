module.exports = (robot) ->
  robot.respond /members append me/i, (res) ->
    members = robot.brain.get('brain.members') || []
    members.push res.message.user.name
    robot.brain.set 'brain.members', members
    res.send 'appended!'

  robot.respond /members get/i, (res) ->
    members = robot.brain.get('brain.members') || []
    res.send members.join ' '
