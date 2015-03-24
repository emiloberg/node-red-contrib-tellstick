'use strict';



var gulp = require('gulp');
var eslint = require('gulp-eslint');
var debug	= require('gulp-debug');
var fileinclude = require('gulp-file-include');
var rename = require('gulp-rename');
var watch = require('gulp-watch');
var runSequence = require('run-sequence');

gulp.task('lint', function () {
    return gulp.src(['tellstick/lib/*.js', 'lib/**/*.js'])
        .pipe(debug())
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failOnError());
});


gulp.task('build', function() {
	gulp.src(['lib/*.js-template'])
		.pipe(fileinclude({
			prefix: '@@',
			basepath: '@file'
		}))
		.pipe(rename(function (path) {
			path.extname = '.js';
		}))
		.pipe(gulp.dest('./tellstick/'));

	gulp.src(['lib/*.html-template'])
		.pipe(fileinclude({
			prefix: '@@',
			basepath: '@file'
		}))
		.pipe(rename(function (path) {
			path.extname = '.html';
		}))
		.pipe(gulp.dest('./tellstick/'));
});

gulp.task('watch-files', function() {
	watch(['lib/*.js', 'lib/**/*.js', 'lib/*.html', 'lib/**/*.html', 'lib/**/*.css'], function() {
		runSequence('build');
	});
});

gulp.task('default', ['watch-files']);
