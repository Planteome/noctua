////
//// Usage: node ./node_modules/.bin/gulp doc|build|test|watch|clean
////

var gulp = require('gulp');
var jsdoc = require("gulp-jsdoc");
var mocha = require('gulp-mocha');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var uglify = require('gulp-uglify');
var us = require('underscore');
var del = require('del');
//var watch = require('gulp-watch');
//var watchify = require('watchify');
//var concat = require('gulp-concat');
//var sourcemaps = require('gulp-sourcemaps');

var paths = {
    // WARNING: Cannot use glob for clients--I use the explicit listing
    // to generate a dynamic browserify set.
    clients: ['js/NoctuaEditor.js',
	      'js/NoctuaLanding.js',
	      'js/BaristaLogin.js',
	      'js/BaristaLogout.js',
	      'js/BaristaSession.js'],
    support: ['js/connectors-sugiyama.js'],
    scripts: ['scripts/*'],
    tests: ['tests/*.test.js']
};

// Build docs directory with JSDoc.
gulp.task('doc', function() {
    gulp.src(paths.clients, paths.scripts)
        .pipe(jsdoc('./doc'));
});

// Testing with mocha/chai.
// NOTE: I'm using chai here.
gulp.task('test', function() {
    return gulp.src(paths.tests, { read: false }).pipe(mocha({
	reporter: 'spec',
	globals: {
	    // Use a different should.
	    should: require('chai').should()
	}
    }));
});

//
gulp.task('ready-non-commonjs-libs', function(){
    var pkg = require('./package.json');
    us.each(pkg.browser, function(val, key){
	console.log('copy: ' + key);
	gulp.src(val)
	    .pipe(gulp.dest('./deploy/'));
    });
});

// Build the clients as best we can.
var build_tasks = [
    'ready-non-commonjs-libs'
];
// Dynamically define tasks.
us.each(paths.clients, function(file, index){

    var taskname = 'build-client_' + file;

    // Add to task list.
    build_tasks.push(taskname);

    // See what browserify-shim is up to.
    //process.env.BROWSERIFYSHIM_DIAGNOSTICS = 1;

    // Browser runtime environment construction.
    function _client_task(file){
	return browserify(file)
	// not in npm, don't need in browser
	    .exclude('ringo/httpclient')
	    .bundle()
	// desired output filename to vinyl-source-stream
	    .pipe(source(file))
	    .pipe(gulp.dest('./deploy/'));
    }
    
    // Define task.
    gulp.task(taskname, function() {
	return _client_task(file);
    });

});

gulp.task('build', build_tasks);
//     'build-client-landing',
//     'build-client-editor'
// ]);

// gulp.task('build-client-landing', function() {
//     return _client_task('./js/NoctuaLanding.js');
// });
// gulp.task('build-client-editor', function() {
//     return _client_task('./js/NoctuaEditor.js');
// });

// Rerun tasks when a file changes.
gulp.task('watch', function() {
  gulp.watch(paths.clients, ['build']);
  gulp.watch(paths.support, ['build']);
});

// 
gulp.task('clean', function(cb) {
    del(['./deploy/*', './deploy/js/*', '!./deploy/README.org',
	 './doc/*', '!./doc/README.org']);
});

// gulp.task('compress', function() {
//   return gulp.src('static/noctua-runtime.js')
//     .pipe(uglify())
//     .pipe(gulp.dest('./deploy/'));
// });

// var browserify_opts = {
//   entries: paths.clients,
//   debug: true
// };
// //var opts = assign({}, watchify.args, browserify_opts);
// var w = watchify(browserify(browserify_opts)); 
// w.on('update', bundle); // on any dep update, runs the bundler
// w.on('log', console.log); // output build logs to terminal

// function bundle() {
//   return w.bundle()
//     // log errors if they happen
//     .on('error', console.log.bind('ERROR: browserify'))
// 	.exclude('ringo/httpclient')
// 	.bundle()
// 	.pipe(source('bundle.js'))
//     // optional, remove if you don't need to buffer file contents
// //    .pipe(buffer())
//     // optional, remove if you dont want sourcemaps
// //    .pipe(sourcemaps.init({loadMaps: true})) // loads map from browserify file
//        // Add transformation tasks to the pipeline here.
// //    .pipe(sourcemaps.write('./')) // writes .map file
//     .pipe(gulp.dest('./deploy/'));
// }

// The default task (called when you run `gulp` from cli)
gulp.task('default', ['doc', 'build', 'test']);