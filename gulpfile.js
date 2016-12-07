var browserify = require('browserify');
var source = require('vinyl-source-stream');
var gulp = require('gulp');

let tasks = [
  'react',
  'redux-lib',
  'react-lib',
  'react-dom-lib',
  'index',
  'bootstrap-js-lib',
  'bootstrap-css-lib',
  'bootstrap-fonts-lib',
  'font-awesome-lib.js',
  'font-awesome-fonts-lib'
];

tasks.forEach(function(name) {
  gulp.task(name, require('./gulp/tasks/' + name));
});

gulp.task('browserify', [
  'react'
], function() {
  return browserify('public/dist/js/react/App.js')
      .bundle()
      .pipe(source('app.js'))
      .pipe(gulp.dest('public/dist/js'));
});

gulp.task('default', [
  'browserify',
  'redux-lib',
  'react-lib',
  'react-dom-lib',
  'index',
  'bootstrap-js-lib',
  'bootstrap-css-lib',
  'bootstrap-fonts-lib',
  'font-awesome-lib.js',
  'font-awesome-fonts-lib'
]);
