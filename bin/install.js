#!/usr/bin/env node

var child_process=require('child_process');
var yardsCli=require('yards-cli');
var path=require('path');
var PromiseMixin=yardsCli.yards.API.PromiseMixin;

var execCommand=PromiseMixin.denodeifySpec(
    child_process.exec.bind(child_process),
    function(err,stdio,stderr) {
        if (err)
            throw stderr;
        else
            return stdio;
    }
);

module.exports=execCommand('npm install -g bower')
.then(function(out) {
    console.log(out);
    return execCommand('bower install',{
        cwd: path.resolve(__dirname,'..')
    })
})
.then(function(out) {
    console.log(out);
})
.catch(function(err) {
    console.log(err.stack||err);
});