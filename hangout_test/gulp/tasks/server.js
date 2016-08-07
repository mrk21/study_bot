import gulp from 'gulp';
import browserSync from 'browser-sync';
import ngrok from 'ngrok';
import * as gulpConfig from 'gulp/config';
import google from 'googleapis';
import { parse } from 'url';

const OAuth2 = google.auth.OAuth2;
const server = browserSync.create();
const secretServer = browserSync.create();

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
        console.log(gulpConfig);
        switch (url.pathname) {
          case '/auth':
            const oauth2Client = new OAuth2(
              gulpConfig.googleOAuthToken,
              gulpConfig.googleOAuthSecret,
              `${gulpConfig.secretServerUrl}/oauth2callback`
            );
            const scopes = [
              'https://www.googleapis.com/auth/plus.me',
              'https://www.googleapis.com/auth/calendar'
            ];
            const redirectUrl = oauth2Client.generateAuthUrl({
              access_type: 'online',
              scope: scopes
            });
            console.log('GET /auth', redirectUrl);
            res.statusCode = 303;
            res.setHeader('Location', redirectUrl);
            res.end();
            return;
          case '/oauth2callback':
            console.log('GET /oauth2callback', url.query.code);
            gulpConfig.googleOAuthCode = url.query.code;
            res.statusCode = 200;
            res.write('ok!');
            res.end();
          default:
            console.log(url.path);
            res.setHeader('Access-Control-Allow-Origin', '*');
            next();
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
