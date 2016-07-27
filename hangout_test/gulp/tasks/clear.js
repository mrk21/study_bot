import gulp from 'gulp';
import del from 'del';

gulp.task('clean', done => del(['dist'], done));
