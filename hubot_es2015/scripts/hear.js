export default robot => {
  robot.hear(/hubot/i, res =>
    res.emote('hi!')
  );
};
