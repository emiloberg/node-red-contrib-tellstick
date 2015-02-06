var jshint = require('gulp-jshint');
var gulp   = require('gulp');
var debug = require('gulp-debug');

gulp.task('lint', function() {
  return gulp.src('./telldus/*.js')
	.pipe(debug())
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'));
});