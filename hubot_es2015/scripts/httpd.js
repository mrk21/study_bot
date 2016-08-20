import session from 'express-session';

export default robot => {
  robot.router.set('trust proxy', 1); // trust first proxy
  robot.router.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true },
  }));

  // $ curl http://localhost:8080/endpoint_test
  // > hubot httpd test
  robot.router.get('/endpoint_test', (req, res) => {
    const sess = req.session;
    console.log(sess, sess.views);
    if (sess.views) {
      sess.views++;
    } else {
      sess.views = 1;
    }
    robot.messageRoom('hubot_test', 'received http request');
    res.end(`hubot httpd test: ${sess.views}`);
  });
};
