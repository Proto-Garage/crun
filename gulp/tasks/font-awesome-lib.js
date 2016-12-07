var gulp = require('gulp');
var rename = require('gulp-rename');

module.exports = function() {
  return gulp.src('node_modules/font-awesome/css/font-awesome.min.css')
    .pipe(rename('font-awesome.css'))
    .pipe(gulp.dest('public/dist/css/lib'));
};