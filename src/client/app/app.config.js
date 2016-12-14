(function(){
    "use strict";

    angular.module('app.main')
        .config(config_app);

    config_app.$inject = ['$qProvider'];

    function config_app($qProvider){
        //fixing an engular - ui.router exception
        $qProvider.errorOnUnhandledRejections(false);
    }

})();