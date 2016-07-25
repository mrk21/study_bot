var gulp = require('gulp');
var browserSync = require('browser-sync');
var webpack = require('webpack');
var ngrok = require('ngrok');
var rename = require('gulp-rename');
var ejs = require('gulp-ejs');
var del = require('del');

var server = browserSync.create();
var appId = process.env['APP_ID'];
var appUrl = null;

gulp.task('build:js', function (done) {
  var config = {
    entry: './src/app.js',
    cache: true,
    display: {
      errorDetails: true
    },
    output: {
      filename: './dist/app.js'
    },
    module: {},
    resolve: {
      root: [
        './src'
      ],
      extensions: ['', '.js']
    },
    plugins: []
  };
  webpack(config, function (error, stats) {
    console.log(stats.toString({colors: true, chunks: false}));
    done();
  });
});

gulp.task('build:ejs', function () {
  return gulp.src("src/**/*.ejs")
    .pipe(ejs({ appId: appId, appUrl: appUrl }))
    .pipe(rename(function (path) {
      path.extname = '';
    }))
    .pipe(gulp.dest("dist"));
});

gulp.task('build', ['build:js', 'build:ejs']);

gulp.task('clean', function (done) {
  return del(['dist'], done);
});

gulp.task('server', ['build'], function (done) {
  server.init({
    port: 8000,
    browser: 'Google Chrome',
    server: {
      baseDir: 'dist'
    }
  }, function (err, bs) {
    ngrok.connect(bs.options.get('port'), function (err, url) {
      appUrl = url;
      console.log('[Hangout API - Application URL] ', appUrl);
      gulp.start('build', function () {
        setTimeout(server.reload, 1500);
      });
      done();
    });
  });

  gulp.watch('src/**/*', function () {
    gulp.start('build', function () {
      server.reload();
    });
  });
});

gulp.task('default', ['server']);
