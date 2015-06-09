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

    var Application=function() {
        window.addEventListener('resize',this._resizeHandler=this.resize.bind(this));

        setTimeout(this._resizeHandler,0);
    };

    Application.prototype.resize=function() {
        var _editor=this.editor.parentNode;
        var _toolbar=this.toolbar.parentNode;
        var _all=window.document.body.offsetHeight;
        _all-=_toolbar.offsetHeight;
        _editor.style.height=_all+'px';
    };

    Application.prototype.free=function() {
        window.removeEventListener('resize',this._resizeHandler);
    };

    window.addEventListener('polymer-ready', function(e) {
        window.key.filter=function(){return true};

        window.App=App=new Application;
        App.editor=window.document.querySelector('ace-editor');
        App.toolbar=window.document.querySelector('tool-bar[tool-bar="main"]');
        App.dialog=window.document.querySelector('dialog-layer');
        App.filetree=window.document.querySelector('file-tree');
        App.resize();
        appReady=true;

        while(course.length) {
            var x=course.shift();
            $keyreg(x.key,x.scope,x.act);
        };

        key.setScope('editor');
    });
})(window);