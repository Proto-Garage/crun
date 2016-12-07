var gulp = require('gulp');
var rename = require('gulp-rename');

module.exports = function() {
  return gulp.src('node_modules/bootstrap/dist/js/bootstrap.min.js')
    .pipe(rename('bootstrap.js'))
    .pipe(gulp.dest('public/dist/js/lib'));
};

