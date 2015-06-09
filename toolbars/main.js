var fs=require('fs');

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
            //add project path
            return app.dialog.showSaveFileDialog('','')
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
    //add project path
    app.dialog.showSaveFileDialog('','')
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
    //add project path
    app.dialog.showOpenFileDialog('','')
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