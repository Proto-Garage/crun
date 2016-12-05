var gulp = require('gulp');
var concat = require('gulp-concat');

module.exports = function() {
  return gulp.src('node_modules/react/dist/react.min.js')
    .pipe(concat('react.js'))
    .pipe(gulp.dest('public/dist/js/lib'));
};
