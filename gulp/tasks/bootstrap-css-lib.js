var gulp = require('gulp');
var rename = require('gulp-rename');

module.exports = function() {
  return gulp.src('node_modules/bootstrap/dist/css/bootstrap.min.css')
    .pipe(rename('bootstrap.css'))
    .pipe(gulp.dest('public/dist/css/lib'));
};