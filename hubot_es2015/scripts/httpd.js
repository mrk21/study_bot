import session from 'express-session';
import connectRedis from 'connect-redis';

const RedisStore = connectRedis(session);

export default robot => {
  robot.router.set('trust proxy', 1); // trust first proxy
  robot.router.use(session({
    secret: 'keyboard cat',
    store: new RedisStore(),
    cookie: {
      path: '/',
      httpOnly: true,
      secure: false,
      maxAge: 60000,
    },
  }));

  // $ curl http://localhost:8080/endpoint_test
  // > hubot httpd test
  robot.router.get('/endpoint_test', (req, res) => {
    console.log(req.session, req.session.views);
    if (req.session.views) req.session.views++;
    else req.session.views = 1;
    robot.messageRoom('hubot_test', 'received http request');
    res.end(`hubot httpd test: ${req.session.views}`);
  });

  robot.router.get('/logout', (req, res) => {
    req.session.destroy(function(err) {
      console.log(err);
      res.redirect('/endpoint_test');
    });
  });
};
