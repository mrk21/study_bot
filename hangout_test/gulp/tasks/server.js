import gulp from 'gulp';
import browserSync from 'browser-sync';
import ngrok from 'ngrok';
import * as gulpConfig from 'gulp/config';

const server = browserSync.create();

gulp.task('server', ['build'], done => {
  server.init({
    port: 8000,
    browser: 'Google Chrome',
    server: {
      baseDir: 'dist'
    }
  }, (err, bs) => {
    ngrok.connect(bs.options.get('port'), (err, url) => {
      gulpConfig.appUrl = url;
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
