var gulp = require('gulp');
var rename = require('gulp-rename');

module.exports = function() {
  return gulp.src('node_modules/select2/dist/js/select2.min.js')
    .pipe(rename('select2.js'))
    .pipe(gulp.dest('public/dist/js/lib'));
};