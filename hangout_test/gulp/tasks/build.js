import gulp from 'gulp';
import webpack from 'webpack';
import webpackConfig from 'config/webpack.config';
import rename from 'gulp-rename';
import ejs from 'gulp-ejs';
import * as gulpConfig from 'gulp/config';

gulp.task('build:js', done =>
  webpack(webpackConfig, (error, stats) => {
    console.log(stats.toString({ colors: true, chunks: false }));
    done();
  })
);

gulp.task('build:ejs', () =>
  gulp.src("src/**/*.ejs")
    .pipe(ejs({
      appId: gulpConfig.appId,
      appUrl: gulpConfig.appUrl,
      secretServerUrl: gulpConfig.secretServerUrl,
      slackToken: gulpConfig.slackToken,
      slackChannel: gulpConfig.slackChannel,
    }))
    .pipe(rename(path => path.extname = ''))
    .pipe(gulp.dest("dist"))
);

gulp.task('build', ['build:js', 'build:ejs']);
