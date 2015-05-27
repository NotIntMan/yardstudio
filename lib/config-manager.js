window.Config=(function() {
    var files={};

    var $get=window.GET=function(filename) {
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
    };
    var $getConfig=function(filename) {
        return $get(filename).then(function(data) {
            return jsyaml.load(data);
        },function() {
            return null;
        });
    };

    var Config=function(data) {
        this.data=data||{};
    };

    Config.load=function(filename) {
        if (filename in files)
            return Promise.resolve(files[filename]);
        return files[filename]=Promise.all([
            $getConfig(filename+'.yaml'),
            $getConfig(filename+'.user.yaml')
        ]).then(function(_data) {
            var defaultData=_data[0];
            var userData=_data[1];
            if (defaultData===null||userData===null) return defaultData;
            for (var i in userData)
                defaultData[i]=userData[i];
            return defaultData;
        }).then(function(data) {
            return new Config(data);
        });
    };

    return Config;
})();