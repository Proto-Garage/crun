var gulp = require('gulp');
var concat = require('gulp-concat');

module.exports = function() {
  return gulp.src('node_modules/react-dom/dist/react-dom.min.js')
    .pipe(concat('react-dom.js'))
    .pipe(gulp.dest('public/dist/js/lib'));
};
