import gulp from 'gulp';
import browserSync from 'browser-sync';
import ngrok from 'ngrok';
import google from 'googleapis';
import { parse } from 'url';
import crypto from 'crypto';
import * as gulpConfig from 'gulp/config';
import axios from 'axios';

const server = browserSync.create();

gulp.task('server', ['build'], done => {
  server.init({
    port: 8000,
    browser: 'Google Chrome',
    server: {
      baseDir: 'dist',
    },
    middleware: [
      CORSMiddleware,
      RoutingMiddleware,
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


// Middlewares
function CORSMiddleware(req, res, next) {
  const origin = req.headers['origin'] || '';
  const allowedOriginPatterns = [
    /^(http|https):\/\/127.0.0.1(:[0-9]+)?$/,
    /^(http|https):\/\/localhost(:[0-9]+)?$/,
    /^(http|https):\/\/([^-]+)-a-hangout-opensocial.googleusercontent.com(:[0-9]+)?$/,
  ];
  console.log('[Origin]', origin);
  if (allowedOriginPatterns.some(pattern => origin.match(pattern))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS, DELETE, PATCH');
    res.setHeader('Access-Control-Expose-Headers', 'X-Requested-With, Origin, X-Csrftoken, Content-Type, Accept');
    res.setHeader('Access-Control-Max-Age', '1728000');
  }
  next();
}

function RoutingMiddleware(req, res, next) {
  const url = parse(req.url, true);
  getCookie(req);
  switch (url.pathname) {
    case '/login': {
      const oauth2Client = new google.auth.OAuth2(
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

      const oauth2Client = new google.auth.OAuth2(
        gulpConfig.googleOAuthToken,
        gulpConfig.googleOAuthSecret,
        `${gulpConfig.secretServerUrl}/oauth2callback.html`
      );
      let loginTicket = null;

      (new Promise((resolve, reject) => {
        const { code } = url.query;
        oauth2Client.getToken(code, (err, tokens) => {
          console.log(err, tokens);
          if (err) reject(err);
          else resolve(tokens);
        });
      })).then(tokens => {
        console.log(tokens);
        oauth2Client.setCredentials(tokens);
        console.log(oauth2Client.credentials);

        return new Promise((resolve, reject) => {
          oauth2Client.verifyIdToken(oauth2Client.credentials.id_token, gulpConfig.googleOAuthToken, (err, response) => {
            console.log(err, response);
            if (err) reject(err);
            else resolve(response);
          });
        });
      }).then(_loginTicket => {
        loginTicket = _loginTicket;
        console.log(loginTicket);

        return axios.get('https://www.googleapis.com/plus/v1/people/me/openIdConnect', {
          headers: {
            'Authorization': `OAuth ${oauth2Client.credentials.access_token}`
          }
        });
      }).then(response => {
        const user = response.data;
        console.log(user);
        setSession(res, { loginTicket, user });
        next();
      }).catch(err => {
        console.log('[error]', err);
        res.statusCode = 400;
        next();
      });
      return;
    }
    case '/logout': {
      console.log('[GET /logout]', gulpConfig);
      deleteSession(req, res);
      res.statusCode = 303;
      res.setHeader('Location', '/');
      res.end();
      return;
    }
    case '/secret.json': {
      console.log('[GET /secret.json]', gulpConfig);
      const session = getSession(req);
      if (session) {
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


// Sessions
const sessionStore = {};

function setSession(res, user) {
  console.log('[session store]', sessionStore);
  console.log('[user]', user);

  const shasum = crypto.createHash('sha1');
  shasum.update(user.sub);
  const hashedUserId = shasum.digest('hex');
  console.log('[hashed user id]', hashedUserId);
  sessionStore[hashedUserId] = user;

  let expire = new Date;
  expire.setDate(expire.getDate() + 1);
  expire = expire.toUTCString();
  res.setHeader('Set-Cookie', `hangout_test_token=${hashedUserId}; path=/; expires=${expire}; HttpOnly`);
}

function getSession(req) {
  console.log('[session store]', sessionStore);
  return sessionStore[getCookie(req).hangout_test_token] || {};
}

function deleteSession(req, res) {
  console.log('[session store]', sessionStore);
  delete sessionStore[getCookie(req).hangout_test_token];

  let expire = new Date;
  expire.setDate(expire.getDate() - 1);
  expire = expire.toUTCString();
  res.setHeader('Set-Cookie', `hangout_test_token=; path=/; expires=${expire}; HttpOnly`);
}

function getCookie(req) {
  console.log('[raw cookie]', req.headers['cookie']);
  const cookie = (req.headers['cookie'] || '')
    .split(';')
    .map(pair => (pair || '').split('=').map(element => element.trim()))
    .reduce((hash, [key, value]) => (hash[key] = value, hash), {});
  console.log('[cookie]', cookie);
  return cookie;
}
