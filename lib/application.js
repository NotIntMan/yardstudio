(function(window) {
    var course=[];
    var appReady=false;
    var App=null;

    var $keyreg=function(key,scope,act) {
        window.key(key,scope,window.debug=act.bind(window,App));
    };

    window.KeyRegister=function(key,scope,act) {
        if (!appReady)
            course.push({
                key:key,
                scope:scope,
                act:act
            });
        else
            $keyreg(key,scope,act);
    };

    window.addEventListener('polymer-ready', function(e) {
        window.key.filter=function(){return true};

        window.App=App={};
        App.editor=window.document.querySelector('ace-editor');
        App.toolbar=window.document.querySelector('tool-bar[tool-bar="main"]');
        appReady=true;

        while(course.length) {
            var x=course.shift();
            $keyreg(x.key,x.scope,x.act);
        };

        key.setScope('editor');
    });
})(window);