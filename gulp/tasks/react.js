var gulp = require('gulp');
var babel = require('gulp-babel');

module.exports = function() {
  return gulp.src('public/src/js/react/**/*.js')
    .pipe(babel({
      presets: ['es2015', 'react']
    }))
    .pipe(gulp.dest('public/dist/js/react'));
};
