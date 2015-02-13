'use strict';



var gulp = require('gulp');
var eslint = require('gulp-eslint');
var debug	= require('gulp-debug');
 
gulp.task('lint', function () {
    return gulp.src(['telldus/*.js', 'telldus/lib/*.js'])
        .pipe(debug())
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failOnError());
});
 
gulp.task('default', ['lint'], function () {
    // This will only run if the lint task is successful... 
});