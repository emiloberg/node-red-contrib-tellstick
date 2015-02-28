'use strict';



var gulp = require('gulp');
var eslint = require('gulp-eslint');
var debug	= require('gulp-debug');
var fileinclude = require('gulp-file-include');
var rename = require('gulp-rename');
var watch = require('gulp-watch');
var runSequence = require('run-sequence');

gulp.task('lint', function () {
    return gulp.src(['telldus/*.js', 'telldus/lib/*.js', 'telldus/*.html', 'telldus/lib/*.html'])
        .pipe(debug())
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failOnError());
});


gulp.task('merge-files', function() {
	gulp.src(['lib/*.js-template'])
		.pipe(fileinclude({
			prefix: '@@',
			basepath: '@file'
		}))
		.pipe(rename(function (path) {
			path.extname = '.js';
		}))
		.pipe(gulp.dest('./telldus/'));

	gulp.src(['lib/*.html-template'])
		.pipe(fileinclude({
			prefix: '@@',
			basepath: '@file'
		}))
		.pipe(rename(function (path) {
			path.extname = '.html';
		}))
		.pipe(gulp.dest('./telldus/'));
});

gulp.task('watch-files', function() {
	watch(['lib/*.js-include', 'lib/**/*.js-include', 'lib/*.html', 'lib/**/*.html'], function() {
		runSequence('merge-files');
	});
});

gulp.task('default', ['watch-files']);
