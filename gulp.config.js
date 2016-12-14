module.exports = function () {
    var client = './src/client/';
    var clientApp = client + 'app/';
    var temp = './.tmp/';
    var server = './src/server/';
    var root = './';
    var vendor = client + 'vendor/';

    var config = {

        /**
         * Files paths
         */
        alljs: [
            './src/**/*.js',
            './*.js'
        ],
        build: './build/',
        client: client,
        css: [
            temp + 'vendor.css',
            temp + 'custom.css',
            temp + 'styles.css',
            temp + 'animations.css'
        ],
        fonts: [            
            client + 'fonts/**/*.*',
        ],
        html: clientApp + '**/*.html',
        htmltemplates: clientApp + '**/*.html',
        images: client + 'images/**/*.*',
        index: client + 'index.html',
        js: [
            clientApp + '**/*.module.js',
            clientApp + '**/*.js',           
            '!' + clientApp + '**/*.spec.js'
        ],
        less: [
            client + 'styles/styles.less',
            client + 'styles/animations.less'
        ],
        cssVendor: [],
        cssVendorFinal: 'vendor.css',
        lessModulesSource: [
            clientApp + '**/*.less'
        ],
        lessModulesDestination: 'custom.css',
        root: root,
        server: server,
        temp: temp,
        vendor: vendor,

        /**
         * config files
         */
        config: {
            base: clientApp + 'mc.config',
            globalConfig: clientApp + 'mc.config/globalConfig.json',
        },

        /**
         * optimized files
         */
        optimized: {
            app: 'app.js',
            lib: 'lib.js'
        },

        /**
         * browser sync
         */
        browserReloadDelay: 1000,

        /**
         * template cache
         */
        templateCache: {
            file: 'templates.js',
            options: {
                module: 'app.templates',
                standAlone: false,
                root: 'app/'
            }
        },

        /**
         * Bower and NPM locations
         */
        bower: {
            json: require('./bower.json'),
            directory: './bower_components/',
            ignorePath: '../..'
        },
        packages: [
            './package.json',
            './bower.json'
        ],

        /**
         * Node Settings
         */
        defaultPort: 7203,
        nodeServer: './src/server/app.js',

    };

    config.getWiredepDefaultOptions = function () {

        var options = {
            bowerJson: config.bower.json,
            directory: config.bower.directory,
            ignorePath: config.bower.ignorePath
        };

        return options;
    };

    return config;
};