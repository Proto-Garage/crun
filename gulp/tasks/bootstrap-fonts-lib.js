var gulp = require('gulp');
var rename = require('gulp-rename');

module.exports = function() {
  return gulp.src('node_modules/bootstrap/dist/fonts/*')
    .pipe(gulp.dest('public/dist/css/fonts/'));
};

