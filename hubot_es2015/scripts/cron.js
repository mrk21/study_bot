import { CronJob } from 'cron';

export default robot =>
  new CronJob('* * * * *', (() =>
    robot.send({ room: '#hubot_test' }, 'cron job')
  ), null, true, "Asia/Tokyo");
