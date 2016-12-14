var gulp = require('gulp');
var args = require('yargs').argv;
var browserSync = require('browser-sync');
var config = require('./gulp.config')();
var del = require('del');
var $ = require('gulp-load-plugins')({
    lazy: true
});
var port = process.env.PORT || config.defaultPort;

gulp.task('help', $.taskListing);
gulp.task('default', ['help']);

gulp.task('vet', function () {
    log('Analyzing source with JSHint and JSCS');

    return gulp.src(config.alljs)
        .pipe($.if(args.verbose, $.print()))
        .pipe($.jscs())
        .pipe($.jshint())
        .pipe($.jshint.reporter('jshint-stylish', {
            verbose: true
        }))
        .pipe($.jshint.reporter('fail'));
});

gulp.task('modules-styles', ['clean-styles'], function () {

    log('Compiling Less --> CSS form modules');

    return gulp
        .src(config.lessModulesSource)
        .pipe($.plumber())
        .pipe($.less())
        .pipe($.autoprefixer({
            browsers: ['last 2 version', '> 5%']
        }))
        .pipe($.concat(config.lessModulesDestination))
        .pipe(gulp.dest(config.temp));
});

gulp.task('vendor-styles', function () {

    log('Compiling VENDOR CSS --> CSS');

    return gulp
        .src(config.cssVendor)
        .pipe($.plumber())
        .pipe($.autoprefixer({
            browsers: ['last 2 version', '> 5%']
        }))
        .pipe($.concat(config.cssVendorFinal))
        .pipe(gulp.dest(config.temp));
});

gulp.task('styles', ['modules-styles', 'vendor-styles'], function () {

    log('Compiling Less --> CSS');

    return gulp
        .src(config.less)
        .pipe($.plumber())
        .pipe($.less())
        .pipe($.autoprefixer({
            browsers: ['last 2 version', '> 5%']
        }))
        .pipe(gulp.dest(config.temp));
});

gulp.task('fonts', ['clean-fonts'], function () {
    log('Copying fonts...');

    return gulp
        .src(config.fonts)
        .pipe(gulp.dest(config.build + 'fonts'));
});

gulp.task('images', ['clean-images'], function () {
    log('Copying images and compressing them...');

    return gulp
        .src(config.images)
        /* .pipe($.imagemin({
         optimizationLevel: 4
         }))*/
        .pipe(gulp.dest(config.build + 'images'));
});

gulp.task('clean-code', function (done) {
    var files = [].concat(
        config.temp + '**/*.js',
        config.build + '**/*.html',
        config.build + 'js/**/*.js'
    );

    clean(files, done);
});

gulp.task('clean-styles', function (done) {
    var files = config.temp + '**/*.css';
    clean(files, done);
});

gulp.task('clean-fonts', function (done) {
    clean(config.build + 'fonts/**/*.*', done);
});

gulp.task('clean-images', function (done) {
    clean(config.build + 'images/**/*.*', done);
});

gulp.task('clean', function (done) {
    var delConfig = [].concat(config.build, config.temp);
    log('Cleaning: ' + $.util.colors.blue(delConfig));
    del(delConfig, done);
});

gulp.task('less-watcher', function () {
    gulp.watch([config.less.concat(config.lessModulesSource)], ['styles']);
});

gulp.task('wiredep', function () {
    log('Wire up the bower css js and out app js into the html');

    var wiredep = require('wiredep').stream;
    var options = config.getWiredepDefaultOptions();

    return gulp
        .src(config.index)
        .pipe(wiredep(options))
        .pipe($.inject(gulp.src(config.js)))
        .pipe(gulp.dest(config.client));
});

gulp.task('inject', ['wiredep', 'styles', 'templatecache', 'less-watcher'], function () {
    log('Wire up the app css into the html and call wiredep ');

    return gulp
        .src(config.index) //todo
        .pipe($.inject(gulp.src(config.css)))
        .pipe(gulp.dest(config.client));
});

gulp.task('optimize', ['inject', 'images', 'fonts', 'config-prd'], function () {
    log('Optimizing the javascript, css, html');

    var assets = $.useref.assets({
        searchPath: './'
    });
    var templateCache = config.temp + config.templateCache.file;
    var globalConfigFile = config.temp + 'globalConfig.js';

    var globalConfigFile = config.temp + 'globalConfig.js';

    var cssFilter = $.filter('**/*.css', {
        restore: true
    });
    var jsLibFiltrer = $.filter('**/' + config.optimized.lib, {
        restore: true
    });
    var jsAppFiltrer = $.filter('**/' + config.optimized.app, {
        restore: true
    });

    return gulp
        .src(config.index)
        .pipe($.plumber())
        .pipe($.inject(gulp.src(templateCache, {
            read: false
        }), {
            starttag: '<!-- inject:templates:js -->'
        }))
        .pipe($.inject(gulp.src(globalConfigFile, {
            read: false
        }), {
            starttag: '<!-- inject:globalConfig:js -->'
        }))
        .pipe($.inject(gulp.src(globalConfigFile, {
            read: false
        }), {
            starttag: '<!-- inject:globalConfig:js -->'
        }))
        .pipe(assets)
        .pipe(cssFilter)
        .pipe($.csso())
        .pipe(cssFilter.restore)
        .pipe(jsLibFiltrer)
        .pipe($.uglify())
        .pipe(jsLibFiltrer.restore)
        .pipe(jsAppFiltrer)
        .pipe($.ngAnnotate())
        .pipe($.uglify())
        .pipe(jsAppFiltrer.restore)
        .pipe($.rev())
        .pipe(assets.restore())
        .pipe($.useref())
        .pipe($.revReplace())
        .pipe(gulp.dest(config.build))
        .pipe($.rev.manifest())
        .pipe(gulp.dest(config.build));
});

gulp.task('templatecache', ['clean-code'], function () {
    log('Creating AngularJS $templateCache');

    return gulp
        .src(config.htmltemplates)
        .pipe($.minifyHtml({
            empty: true
        }))
        .pipe($.angularTemplatecache(
            config.templateCache.file, config.templateCache.options))
        .pipe(gulp.dest(config.temp));
});

gulp.task('config-dev', function () {
    log('Creating Global config file');

    gulp.src(config.config.globalConfig)
        .pipe($.ngConfig('app.config', {
            environment: 'local',
            wrap: true
        }))
        .pipe(gulp.dest(config.temp));
});

gulp.task('config-prd', function () {
    log('Creating Global config file');

    gulp.src(config.config.globalConfig)
        .pipe($.ngConfig('app.config', {
            environment: 'production',
            wrap: true
        }))
        .pipe(gulp.dest(config.temp));
});

gulp.task('inject-config-dev', ['config-dev'], function () {
    log('Injecting Global config file');

    var globalConfigFile = config.temp + 'globalConfig.js';

    gulp.src(config.index)
        .pipe($.inject(gulp.src(globalConfigFile, {
            read: false
        }), {
            starttag: '<!-- inject:globalConfig:js -->'
        }))
        .pipe(gulp.dest(config.client));
});

gulp.task('config-dev-process', ['inject-config-dev', 'config-dev'], function () {

});


gulp.task('serve-dev', ['inject'], function () {
    serve(true);
});

gulp.task('serve-build', ['optimize'], function () {
    serve(false);
});

/**
 * Bump the version
 * --type=pre will bump the prerelease version *.*.*-x
 * --type=patch or no flag will bump the patch version *.*.*
 * --type=minor will bump the minor version *.x.*
 * --type=major will bump the major version x.*.*
 * --version=1.2.3 will bump to a specific version and ignore other flags
 */
gulp.task('bump', function () {
    var msg = 'Bumping versions';
    var type = args.type;
    var version = args.version;
    var options = {};

    if (version) {
        options.version = version;
        msg += ' to ' + version;
    } else {
        options.type = type;
        msg += ' for a ' + type;
    }

    log(msg);

    return gulp
        .src(config.packages)
        .pipe($.print())
        .pipe($.bump(options))
        .pipe(gulp.dest(config.root));
});

////////////

function serve(isDev) {
    var nodeOptions = {
        script: config.nodeServer,
        delayTime: 1,
        env: {
            'PORT': port,
            'NODE_ENV': isDev ? 'dev' : 'build'
        },
        watch: [config.server]
    };

    return $.nodemon(nodeOptions)
        .on('restart', function (ev) {
            log('*** nodemon restarted');
            log('files changed on restart:\n' + ev);

            setTimeout(function () {
                browserSync.notify('reloading now...');
                browserSync.reload({
                    stream: false
                });
            }, config.browserReloadDelay)
        })
        .on('start', function () {
            log('*** nodemon started');

            startBrowserSync(isDev);
        })
        .on('crash', function () {
            log('*** nodeman crached: script crached for some reazon');
        })
        .on('exit', function () {
            log('*** nodemon exited cleanly');
        });
}

function changeEvent(event) {
    var srcPattern = new RegExp('/.*(?=/' + config.source + ')/');
    log('File ' + event.path.replace(srcPattern, '') + ' ' + event.type);
}

function startBrowserSync(isDev) {
    if (args.nosync || browserSync.active) {
        return;
    }

    log('Starting browser-sync on port:' + port);

    if (isDev) {
        gulp.watch([config.less], ['styles'])
            .on('change', function (event) {
                changeEvent(event);
            });
    } else {
        gulp.watch([config.less, config.js, config.html], ['optimize', browserSync.reload])
            .on('change', function (event) {
                changeEvent(event);
            });
    }


    var options = {
        proxy: 'localhost:' + port,
        port: 3000,
        files: isDev ? [
            config.client + '**/*.*',
            '!' + config.less,
            config.temp + '**/*.css'
        ] : [],
        ghostMode: {
            clicks: true,
            location: false,
            forms: true,
            scroll: true
        },
        injectChanges: true,
        logFileChanges: true,
        logLevel: 'debug',
        logPrefix: 'gulp-patterns',
        notify: true,
        reloadDelay: 1000
    };

    browserSync(options);
}

function clean(path, done) {
    log('Cleaning: ' + $.util.colors.blue(path));

    del(path, done());
}

function log(msg) {
    if (typeof (msg) === 'object') {
        for (var item in msg) {
            if (msg.hasOwnProperty(item)) {
                $.util.log($.util.colors.blue(msg[item]));
            }
        }
    } else {
        $.util.log($.util.colors.blue(msg));
    }
}