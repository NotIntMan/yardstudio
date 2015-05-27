window.Config=(function() {
    var files={};

    var jsyaml=require('js-yaml');
    var fs=require('fs');
    var PromiseMixin=require('yards-cli').yards.API.PromiseMixin;

    /*var $get=function(filename) {
        return new Promise(function(resolve,reject) {
            var request=new XMLHttpRequest;
            request.open('GET',filename,true);
            request.onreadystatechange=function() {
                if (request.readyState===4) {
                    if (request.status===200)
                        return resolve(request.responseText);
                    else
                        return reject(request.statusText);
                };
            };
            request.send();
        });
    };*/

    var $get=PromiseMixin.denodeify(fs.readFile);

    var $getConfig=function(filename) {
        return $get(filename,'utf-8').then(function(data) {
            return jsyaml.load(data);
        },function() {
            return null;
        });
    };

    var $set=PromiseMixin.denodeify(fs.writeFile);

    var $setConfig=function(filename,data) {
        return new Promise(function(resolve) {
            resolve(jsyaml.dump(data));
        }).then(function(data) {
            return $set(filename,data,'utf-8');
        });
    };

    var Config=function(data,filename) {
        this.data=data||{};
        this.filename=filename;
    };

    Config.prototype.save=function() {
        return $setConfig(this.filename,this.data);
    };

    Config.prototype.saveAs=function(filename) {
        this.free();
        return $setConfig(filename,this.data);
    };

    Config.prototype.free=function() {
        if (files[this.filename]===this)
            delete files[this.filename];
    };

    Config.load=function(filename) {
        if (filename in files)
            return Promise.resolve(files[filename]);
        else
            return this.reload(filename);
    };

    Config.reload=function(filename) {
        return files[filename]=$getConfig(filename)
        .then(function(data) {
            return new Config(data,filename);
        });
    };

    return Config;
})();