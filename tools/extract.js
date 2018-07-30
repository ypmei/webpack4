var fs = require('fs');
var path = require('path');
var _ = require('lodash');

var sourcePath = path.join(process.cwd(), 'i18n','en.json')
 , appPath = path.join(process.cwd(), 'app')
 , result = require(sourcePath)
 , store = {};

function hanleFile(filePath){
  fs.readFile(filePath,'utf-8',function(err,data){
    if(err){
      console.log('error:'+filePath)
    }else{
      var cnArr = data.match(/__\(.*?('|`|")\)/g)
      if(cnArr){
        cnArr = _.chain(cnArr).map(function(v){
          var key = v.replace(/__\(('|`|")(.*)('|`|")\)/g,'$2')
          if(!result[key]){
            return key;
          }
          if(result[key]&&result[key]!==key){
            store[key] = result[key]
          }else{
            return key;
          }
        }).filter().value()
        var cnObj = _.zipObject(cnArr,cnArr)
        store = _.assign(store,cnObj)
        fs.writeFileSync(sourcePath,JSON.stringify(store,'',2));
      }
    }
  })
}

function dirLoop(rootPath,hanleFile){
  fs.readdir(rootPath,function(err,files){
    if(err){
      console.log('read dir error',err)
    } else {
      files.forEach(function(item){
        var itemPath = rootPath+'/'+item;
        if(item==='__tests__') return ;
        fs.stat(itemPath,function(error,stats){
          if(error){
            console.log('stat error');
          }else{
            if(stats.isDirectory()){
              dirLoop(itemPath,hanleFile)
            }else{
              hanleFile(itemPath)
            }
          }
        })
      })
    }
  })
}

dirLoop(appPath,hanleFile)
