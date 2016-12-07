var gulp = require('gulp');
var rename = require('gulp-rename');

module.exports = function() {
  return gulp.src('node_modules/select2/dist/css/select2.min.css')
    .pipe(rename('select2.css'))
    .pipe(gulp.dest('public/dist/css/lib'));
};