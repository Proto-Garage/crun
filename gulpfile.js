var browserify = require('browserify');
var source = require('vinyl-source-stream');

var gulp = require('./gulp')([
  'react',
  'redux-lib',
  'react-lib',
  'react-dom-lib',
  'index'
]);

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
  'index'
]);
