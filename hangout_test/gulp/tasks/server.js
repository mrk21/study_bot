import gulp from 'gulp';
import browserSync from 'browser-sync';
import ngrok from 'ngrok';
import * as gulpConfig from 'gulp/config';
import google from 'googleapis';
import { parse } from 'url';
import crypto from 'crypto';

const OAuth2 = google.auth.OAuth2;
const server = browserSync.create();
const sessionStore = {};

gulp.task('server', ['build'], done => {
  server.init({
    port: 8000,
    browser: 'Google Chrome',
    server: {
      baseDir: 'dist',
    },
    middleware: [
      corsMiddleware,
      routingMiddleware,
    ]
  }, (err, bs) => {
    console.log(err);
    ngrok.connect(bs.options.get('port'), (err, url) => {
      console.log(err, url);
      gulpConfig.appUrl = url;
      gulpConfig.secretServerUrl = url;
      gulp.start('build', () => {
        setTimeout(server.reload, 1500);
      });
      done();
    });
  });

  gulp.watch('src/**/*', () => {
    gulp.start('build', () => {
      server.reload();
    });
  });
});

function setSession(res, token) {
  console.log('[session store]', sessionStore);
  console.log('[token]', token);

  const shasum = crypto.createHash('sha1');
  shasum.update(token);
  const hashedToken = shasum.digest('hex');
  console.log('[hashed token]', hashedToken);
  sessionStore[hashedToken] = { token };

  let expire = new Date;
  expire.setDate(expire.getDate() + 1);
  expire = expire.toUTCString();
  res.setHeader('Set-Cookie', `hangout_test_token=${hashedToken}; path=/; expires=${expire}; HttpOnly`);
}

function getSession(req) {
  console.log('[session store]', sessionStore);
  return sessionStore[getSessionToken(req)] || {};
}

function deleteSession(req, res) {
  console.log('[session store]', sessionStore);
  delete sessionStore[getSessionToken(req)];

  let expire = new Date;
  expire.setDate(expire.getDate() - 1);
  expire = expire.toUTCString();
  res.setHeader('Set-Cookie', `hangout_test_token=; path=/; expires=${expire}; HttpOnly`);
}

function getSessionToken(req) {
  console.log('[raw cookie]', req.headers['cookie']);
  const cookie = (req.headers['cookie'] || '')
    .split(';')
    .map(v => (v || '').split('=').map(v => v.trim()))
    .reduce((h,[k,v]) => (h[k]=v, h), {});
  console.log('[cookie]', cookie);
  return cookie.hangout_test_token;
}

function corsMiddleware(req, res, next) {
  const origin = req.headers['origin'] || '';
  const allowHostPatterns = [
    /^(http|https):\/\/127.0.0.1(:[0-9]+)?$/,
    /^(http|https):\/\/localhost(:[0-9]+)?$/,
    /^(http|https):\/\/([^-]+)-a-hangout-opensocial.googleusercontent.com(:[0-9]+)?$/,
  ];
  console.log('[Origin]', origin);
  if (allowHostPatterns.some(pattern => origin.match(pattern))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS, DELETE, PATCH');
    res.setHeader('Access-Control-Expose-Headers', 'X-Requested-With, Origin, X-Csrftoken, Content-Type, Accept');
    res.setHeader('Access-Control-Max-Age', '1728000');
  }
  next();
}

function routingMiddleware(req, res, next) {
  const url = parse(req.url, true);
  getSessionToken(req);
  switch (url.pathname) {
    case '/login': {
      const oauth2Client = new OAuth2(
        gulpConfig.googleOAuthToken,
        gulpConfig.googleOAuthSecret,
        `${gulpConfig.secretServerUrl}/oauth2callback.html`
      );
      const scope = [
        'https://www.googleapis.com/auth/plus.me',
        'https://www.googleapis.com/auth/calendar'
      ];
      const access_type = 'online';
      const authUrl = oauth2Client.generateAuthUrl({ access_type, scope });
      console.log('[GET /login]', authUrl);
      res.statusCode = 303;
      res.setHeader('Location', authUrl);
      res.end();
      return;
    }
    case '/oauth2callback.html': {
      console.log('[GET /oauth2callback.html]', url.query.code);
      const token = url.query.code
      setSession(res, token);
      next();
      return;
    }
    case '/logout': {
      console.log('[GET /logout]', gulpConfig);
      res.statusCode = 303;
      deleteSession(req, res);
      res.setHeader('Location', '/');
      res.end();
      return;
    }
    case '/secret.json': {
      console.log('[GET /secret.json]', gulpConfig);
      const session = getSession(req);

      if (session.token) {
        next();
      }
      else {
        res.statusCode = 401;
        res.setHeader('Content-Type', 'application/json');
        res.write('{"error": "Not authentication"}');
        res.end();
      }
      return;
    }
    default: {
      console.log(`[GET ${url.path}]`);
      next();
      return;
    }
  }
}
