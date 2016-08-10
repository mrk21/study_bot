import gulp from 'gulp';
import browserSync from 'browser-sync';
import ngrok from 'ngrok';
import * as gulpConfig from 'gulp/config';
import google from 'googleapis';
import { parse } from 'url';

const OAuth2 = google.auth.OAuth2;
const server = browserSync.create();

gulp.task('server', ['build'], done => {
  server.init({
    port: 8000,
    browser: 'Google Chrome',
    server: {
      baseDir: 'dist',
    },
    middleware: [
      (req, res, next) => {
        const url = parse(req.url, true);
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
            console.log('GET /login', authUrl);
            res.statusCode = 303;
            res.setHeader('Location', authUrl);
            res.end();
            return;
          }
          case '/oauth2callback.html': {
            console.log('GET /oauth2callback.html', url.query.code);
            gulpConfig.googleOAuthCode = url.query.code;
            next();
            return;
          }
          case '/logout': {
            gulpConfig.googleOAuthCode = null;
            res.statusCode = 303;
            res.setHeader('Location', '/');
            res.end();
            return;
          }
          case '/secret.json': {
            console.log('GET /secret.json', gulpConfig);
            res.setHeader('Access-Control-Allow-Origin', '*');
            if (gulpConfig.googleOAuthCode) {
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
            console.log(url.path);
            next();
            return;
          }
        }
      }
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
