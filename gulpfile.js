// This file will contain build task
var gulp = require("gulp"),
	csso = require("gulp-csso"),
	uglify = require("gulp-uglify");

gulp.task("minifyCSS",function(){
	gulp.src("css/*.css")
		.pipe(csso())
		.pipe(gulp.dest("build/css"));
});

gulp.task("minifyJS",function(){
	gulp.src("js/*.js")
		.pipe(uglify())
		.pipe(gulp.dest("build/js"));
});

gulp.task("default",["minifyCSS","minifyJS"]);