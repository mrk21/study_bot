import gulp from 'gulp';
import browserSync from 'browser-sync';
import ngrok from 'ngrok';
import * as gulpConfig from 'gulp/config';

const server = browserSync.create();
const secretServer = browserSync.create();

gulp.task('server', ['build'], done => {
  secretServer.init({
    port: 9000,
    https: true,
    open: false,
    server: {
      baseDir: 'dist',
      middleware: [
        // CORS
        (req, res, next) => {
          res.setHeader('Access-Control-Allow-Origin', '*');
          next();
        }
      ]
    }
  }, (err, bs) => {
    console.log(err);
    gulpConfig.secretServerUrl = `https://localhost:${bs.options.get('port')}`;

    server.init({
      port: 8000,
      browser: 'Google Chrome',
      server: {
        baseDir: 'dist',
      },
    }, (err, bs) => {
      console.log(err);
      ngrok.connect(bs.options.get('port'), (err, url) => {
        console.log(err, url);
        gulpConfig.appUrl = url;
        gulp.start('build', () => {
          setTimeout(server.reload, 1500);
        });
        done();
      });
    });
  });

  gulp.watch('src/**/*', () => {
    gulp.start('build', () => {
      server.reload();
    });
  });
});
