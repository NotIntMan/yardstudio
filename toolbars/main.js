var fs=require('fs');
var Path=require('path');
var child_process=require('child_process');
var yardsCli=require('yards-cli');
var PromiseMixin=yardsCli.yards.API.PromiseMixin;

var tabsActiveState=function(app) {
    return app.editor.tabContainer._data.map(function(e){
        return e.tab.active;
    });
};

module.exports.nextTab=function(app) {
    var tabs=tabsActiveState(app);
    var index=tabs.indexOf(true);
    if ((index>=0)&&(index+1)<tabs.length)
        app.editor.selectTab(app.editor.tabContainer._data[index+1].tab);
};

module.exports.prevTab=function(app) {
    var tabs=tabsActiveState(app);
    var index=tabs.indexOf(true);
    if (index>0)
        app.editor.selectTab(app.editor.tabContainer._data[index-1].tab);
};

module.exports.newTab=function(app) {
    return app.editor.newTab("");
};

module.exports.closeTab=function(app) {
    var self=this;
    var tabs=tabsActiveState(app);
    var index=tabs.indexOf(true);
    if (index>=0) {
        var cTab=app.editor.tabContainer._data[index];
        var tab=cTab.tab;
        Promise.resolve()
        .then(function() {
            if (tab.changed)
                return app.dialog.showDialogMessage(
                    'Closing tab',
                    'File '+tab.filename+' has changed. Do you want to save changes?',
                    {yes:'Yes', no:'No', cancel:'Cancel'}
                ).then(function(btn) {
                    if (btn==='yes')
                        return module.exports.saveFile.call(self,app)
                        .then(function() {
                            return true;
                        });
                    if (btn==='no')
                        return true;
                    else
                        return false;
                });
            else
                return true;
        })
        .then(function(canClose) {
            if (canClose)
                app.editor.closeTab(cTab);
        });
    };
};

var setMode=function(app,mode) {
    app.editor.activeTab.setMode(mode);
};

module.exports.setJS=function(app) {
    setMode(app,'javascript');
};

module.exports.setCSS=function(app) {
    setMode(app,'css');
};

module.exports.setHTML=function(app) {
    setMode(app,'html');
};

module.exports.saveFile=function(app) {
    var tab=app.editor.activeTab;
    return Promise.resolve()
    .then(function() {
        console.log('getting filename');
        if (tab.filename.length===0)
            return app.dialog.showSaveFileDialog(
                (app.filetree.root||{path:''}).path,
                app.editor.activeTab.title
            )
            .then(function(files) {
                return tab.filename=files[0].path;
            });
    }).then(function() {
        console.log('writing file');
        fs.writeFileSync(tab.filename, tab.session.getValue(), 'utf-8');
        tab.changed=false;
    });
};

module.exports.saveFileAs=function(app) {
    var tab=app.editor.activeTab;
    console.log('getting filename');
    app.dialog.showSaveFileDialog(
        (app.filetree.root||{path:''}).path,
        app.editor.activeTab.title
    )
    .then(function(files) {
        return tab.filename=files[0].path;
    })
    .then(function() {
        console.log('writing file');
        fs.writeFileSync(tab.filename, tab.session.getValue(), 'utf-8');
        tab.changed=false;
    });
};

module.exports.openFile=function(app) {
    var self=this;
    var filename='';
    var aborted=false;
    app.dialog.showOpenFileDialog((app.filetree.root||{path:''}).path,'')
    .then(function(files) {
        if (files.length>0)
            return new Promise(function(resolve,reject) {
                fs.readFile(filename=files[0].path, 'utf-8', function(err,data) {
                    if (err) return reject(err);
                    resolve(data);
                });
            });
        else
            aborted=true;
    })
    .then(function(data) {
        if (aborted) return;
        var tab=module.exports.newTab.call(self,app);
        tab.filename=filename;
        tab.session.setValue(data);
    },function(err) {
        app.dialog.showDialogMessage('Error!',err);
    });
};

module.exports.undo=function(app) {
    app.editor.activeTab.session.getUndoManager().undo();
};

module.exports.redo=function(app) {
    app.editor.activeTab.session.getUndoManager().redo();
};

module.exports.openProject=function(app) {
    app.dialog.showSelectDirDialog()
    .then(function(files) {
        if (files.length>0)
            app.filetree.directoryPath=files[0].path;
    });
};

module.exports.initProject=function(app) {
    if (app.filetree.root===null) return;
    if (app.filetree.directoryPath.length===0) return;
    var opts={
        "name": app.filetree.root.name,
        "main": "index.html",
        "version": "0.0.0",
        "nwversion": "latest",
        "runflags":"",
        "buildflags":"-p "+yardsCli.currentPlatform,
        "description": "",
        "keywords": [],
        "license": "MIT",
        "author": {
           "name": (process.env.USERNAME||'')
        }
    };
    var text=require('yards-cli/node_modules/format-json').plain(opts);
    var path=Path.resolve(app.filetree.root.path,'package.json');
    var tab=app.editor.newTab(text);
    tab.setMode('javascript');
    tab.filename=path;
};

var execCommand=PromiseMixin.denodeifySpec(
    child_process.exec.bind(child_process),
    function(err,stdio,stderr) {
        if (err)
            throw stderr;
        else
            return stdio;
    }
);

var projectOperation=function(app,command) {
    if (app.filetree.root===null) return;
    var manifest=require(Path.resolve(app.filetree.root.path,'package.json'));
    var flags=manifest[command.toString()+'flags'];
    var cmd='start /wait cmd /k "node "'+
    Path.resolve(global.module.filename,'../node_modules/yards-cli/yards.js')+
    '" '+command.toString()+
    ' '+flags+'"';
    return execCommand(cmd,{
        cwd: app.filetree.root.path
    });
};

module.exports.runProj=function(app) {
    return projectOperation(app,'run');
};

module.exports.buildProj=function(app) {
    return projectOperation(app,'build');
};