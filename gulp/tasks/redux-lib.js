var gulp = require('gulp');
var rename = require('gulp-rename');

module.exports = function() {
  return gulp.src('node_modules/redux/dist/redux.min.js')
    .pipe(rename('redux.js'))
    .pipe(gulp.dest('public/dist/js/lib'));
};
