#!/usr/bin/env node

var fs = require('fs-extra');
var https = require('https');
var path = require('path');
var exit = process.exit;
var pkg = require('./package.json');
var version = pkg.version;
var AdmZip = require("adm-zip");
var program = require('commander');
var express = require('express');
var mustache = require('mustache');
var strftime = require('strftime');
var underscore = require('underscore');
var os = require('os');
var multiparty = require('multiparty');
var sqlite3 = require('sqlite3');
var uuidV4 = require('uuid/v4');
var extract = require('ipa-extract-info');
var CODE = require('./src/config/code');
// var apkParser3 = require("apk-parser3");

// const util = require('util');
// const ApkReader = require('adbkit-apkreader');

require('shelljs/global');

/** 格式化输入字符串**/

//用法: "hello{0}".format('world')；返回'hello world'

String.prototype.format = function () {
  var args = arguments;
  return this.replace(/\{(\d+)\}/g, function (s, i) {
    return args[i];
  });
}

before(program, 'outputHelp', function () {
  this.allowUnknownOption();
});

program
  .version(version)
  .usage('[option] [dir]')
  .option('-p, --port <port-number>', 'set port for server (defaults is 1234)')
  .option('-h, --host <host>', 'set host for server (defaults is your LAN ip)')
  .parse(process.argv);

var port = program.port || 1234;
var ipAddress = program.host || "localhost";

// || underscore
//   .chain(require('os').networkInterfaces())
//   .values()
//   .flatten()
//   .find(function(iface) {
//     return iface.family === 'IPv4' && iface.internal === false;
//   })
//   .value()
//   .address;

// test
// var port = program.port || 8888;
// var ipAddress = program.host || "127.0.0.1";

// var basePath = "https://{0}:{1}".format(ipAddress, port);
// var outputIP = "54.187.153.153";
// var outputPort = "8888";
// var basePath = "https://" + outputIP + ":" + outputPort;
var outputIP = "download.iotccoin.com";
var basePath = "https://" + outputIP;

var pageCount = 5;
var serverDir = os.homedir() + "/.ipapk-server/"
var globalCerFolder = serverDir + outputIP;
// var globalCerFolder = serverDir + ipAddress;
var ipasDir = serverDir + "ipa";
var apksDir = serverDir + "apk";
var iconsDir = serverDir + "icon";
createFolderIfNeeded(serverDir)
createFolderIfNeeded(ipasDir)
createFolderIfNeeded(apksDir)
createFolderIfNeeded(iconsDir)
function createFolderIfNeeded(path) {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path, function (err) {
      if (err) {
        console.log(err);
        return;
      }
    });
  }
}

function excuteDB(cmd, params, callback) {
  var db = new sqlite3.Database(serverDir + 'db.sqlite3');
  db.run(cmd, params, callback);
  db.close();
}

function queryDB(cmd, params, callback) {
  var db = new sqlite3.Database(serverDir + 'db.sqlite3');
  db.all(cmd, params, callback);
  db.close();
}

excuteDB("CREATE TABLE IF NOT EXISTS info (\
  id integer PRIMARY KEY autoincrement,\
  guid TEXT,\
  bundleID TEXT,\
  version TEXT,\
  build TEXT,\
  name TEXT,\
  uploadTime datetime default (datetime('now', 'localtime')),\
  platform TEXT,\
  changelog TEXT\
  )");

/**
 * Main program.
 */
process.exit = exit

// CLI
if (!exit.exited) {
  main();
}

/**
 * Install a before function; AOP.
 */

function before(obj, method, fn) {
  var old = obj[method];

  obj[method] = function () {
    fn.call(this);
    old.apply(this, arguments);
  };
}

function main() {

  console.log("staticPath--", basePath);
  console.log("UrlPath--", "https://" + ipAddress + ":" + port);

  var key;
  var cert;

  try {
    key = fs.readFileSync(globalCerFolder + '/mycert1.key', 'utf8');
    cert = fs.readFileSync(globalCerFolder + '/mycert1.cer', 'utf8');
  } catch (e) {
    var result = exec('sh  ' + path.join(__dirname, 'bin', 'generate-certificate.sh') + ' ' + outputIP).output;
    key = fs.readFileSync(globalCerFolder + '/mycert1.key', 'utf8');
    cert = fs.readFileSync(globalCerFolder + '/mycert1.cer', 'utf8');
  }

  var options = {
    key: key,
    cert: cert
  };

  var app = express();
  app.use('/cer', express.static(globalCerFolder));
  app.use('/', express.static(path.join(__dirname, 'web')));
  app.use('/ipa', express.static(ipasDir));
  app.use('/apk', express.static(apksDir));
  app.use('/icon', express.static(iconsDir));

  app.get('/allapp', function (req, res, next) {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Content-Type', 'application/json');
    // var page = parseInt(req.params.page ? req.params.page : 1);
    queryDB("select * from info group by platform order by uploadTime", [], function (error, result) {
      // 1. select * from info i where (uploadTime=(select max(uploadTime) from info where platform = i.platform ))
      // 2. select * from info where id in (select max(id) from info group by platform) order by uploadTime desc 
      // select * from( select * from info order by uploadTime desc) as t group by platform
      // 3. select * from( select * from info order by uploadTime) group by platform
      // 4. select * from info group by platform order by uploadTime
      // 5. select id,max(uploadTime) from info group by platform
      if (result) {
        successHandler(res, mapIconAndUrl(result));
      } else {
        console.log(error);
        errorHandler(res);
      }
    });
  });
  app.get(['/apps/:platform', '/apps/:platform/:page'], function (req, res, next) {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Content-Type', 'application/json');
    var page = parseInt(req.params.page ? req.params.page : 1);
    if (req.params.platform === 'android' || req.params.platform === 'ios') {
      queryDB("select * from info where platform=? group by bundleID order by uploadTime desc limit ?,?", [req.params.platform, (page - 1) * pageCount, page * pageCount], function (error, result) {
        if (result) {
          res.send(mapIconAndUrl(result))
        } else {
          errorHandler(res, error);
        }
      })
    }
  });
  app.get(['/apps/:platform/:bundleID', '/apps/:platform/:bundleID/:page'], function (req, res, next) {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Content-Type', 'application/json');
    var page = parseInt(req.params.page ? req.params.page : 1);
    if (req.params.platform === 'android' || req.params.platform === 'ios') {
      queryDB("select * from info where platform=? and bundleID=? order by uploadTime desc limit ?,? ", [req.params.platform, req.params.bundleID, (page - 1) * pageCount, page * pageCount], function (error, result) {
        if (result) {
          res.send(mapIconAndUrl(result))
        } else {
          errorHandler(res, error)
        }
      })
    }
  });


  app.get('/plist/:guid', function (req, res) {
    queryDB("select name,bundleID from info where guid=?", [req.params.guid], function (error, result) {
      if (result) {
        fs.readFile(path.join(__dirname, 'templates') + '/template.plist', function (err, data) {
          if (err) throw err;
          var template = data.toString();
          var rendered = mustache.render(template, {
            guid: req.params.guid,
            name: result[0].name,
            bundleID: result[0].bundleID,
            basePath: basePath,
          });
          res.set('Content-Type', 'text/plain; charset=utf-8');
          res.set('Access-Control-Allow-Origin', '*');
          res.send(rendered);
        })
      } else {
        errorHandler(res, error)
      }
    })
  });

  app.post('/upload', function (req, res) {
    var form = new multiparty.Form();
    form.parse(req, function (err, fields, files) {
      if (err) {
        errorHandler(res, err);
        return;
      }
      var changelog;
      if (fields.changelog) {
        changelog = fields.changelog[0];
      }
      if (!files.package) {
        errorHandler(res, "params error")
        return
      }
      var obj = files.package[0];
      var tmp_path = obj.path;
      // console.log("tmp_path------------", files);
      parseAppAndInsertToDb(tmp_path, changelog, info => {
        storeApp(tmp_path, info["guid"], error => {
          if (error) {
            errorHandler(res, error)
          }
          console.log(info)
          res.send(info)
        })
      }, error => {
        errorHandler(res, error)
      });
    });
  });

  https.createServer(options, app).listen(port);
}

// result handle
function successHandler(res, data){
  res.send({
    status: 0,
    flag: true,
    data
  });
}
function errorHandler(res, error) {
  // console.log(error)
  res.send({ 
    "status": CODE.ERROR,
    "msg": error || "请求失败",
    "flag": false
  });
}

function mapIconAndUrl(result) {
  var items = result.map(function (item) {
    // item.icon = "{0}/icon/{1}.png".format(basePath, item.guid);
    item.icon = "{0}/icon/IOTC.png".format(basePath);
    if (item.platform === 'ios') {
      item.url = "itms-services://?action=download-manifest&url={0}/plist/{1}".format(basePath, item.guid);
    } else if (item.platform === 'android') {
      item.url = "{0}/apk/{1}.apk".format(basePath, item.guid);
    }
    return item;
  })
  return items;
}

function parseAppAndInsertToDb(filePath, changelog, callback, errorCallback) {
  var guid = uuidV4();
  var parse, extract
  if (path.extname(filePath) === ".ipa") {
    parse = parseIpa
    extract = extractIpaIcon
  } else if (path.extname(filePath) === ".apk") {
    parse = parseApk
    extract = extractApkIcon
  } else {
    errorCallback("params error")
    return;
  }
  Promise.all([parse(filePath), extract(filePath, guid)]).then(values => {
    var info = values[0]
    // console.log("info--------", values[0], "------------", values[1]);
    info["guid"] = guid
    info["changelog"] = changelog
    excuteDB("INSERT INTO info (guid, platform, build, bundleID, version, name, changelog) VALUES (?, ?, ?, ?, ?, ?, ?);",
      [info["guid"], info["platform"], info["build"], info["bundleID"], info["version"], info["name"], changelog], function (error) {
        if (!error) {
          callback(info)
        } else {
          errorCallback(error)
        }
      });
  }, reason => {
    errorCallback(reason)
  })
}

function storeApp(fileName, guid, callback) {
  var new_path;
  if (path.extname(fileName) === ".ipa") {
    new_path = path.join(ipasDir, guid + ".ipa");
  } else if (path.extname(fileName) === ".apk") {
    new_path = path.join(apksDir, guid + ".apk");
  }
  fs.rename(fileName, new_path, callback)
}

function parseIpa(filename) {
  // console.log("parseIpa----------", filename)
  return new Promise(function (resolve, reject) {
    var fd = fs.openSync(filename, 'r');
    extract(fd, function (err, info, raw) {
      // console.log("parseIpa----------", err, "----------", info, "---------", raw);
      if (err) reject(err);
      var data = info[0];
      var info = {}
      info["platform"] = "ios"
      info["build"] = data.CFBundleVersion,
        info["bundleID"] = data.CFBundleIdentifier,
        info["version"] = data.CFBundleShortVersionString,
        info["name"] = data.CFBundleName
      resolve(info)
    });
  });
}

function parseApk(filename) {
  return new Promise(function (resolve, reject) {

    // 方法一： apkParser3 使用aapt反编译apk  CentOS服务器上报错
    // apkParser3(filename, function (err, data) {
    //   console.log("parseApk---------", err, "-----------", data)
    //   if (err) return reject(err);
    //   var package = parseText(data.package)
    //   var info = {
    //     "name": data["application-label"].replace(/'/g, ""),
    //     "build": package.versionCode,
    //     "bundleID": package.name,
    //     "version": package.versionName,
    //     "platform": "android"
    //   }
    //   resolve(info)
    // });

    // 方法二： ApkReader
    // ApkReader.open(filename)
    //   .then(reader => reader.readManifest())
    //   .then(manifest => {
    //     console.log("Data-----------------", util.inspect(manifest, { depth: null }))
    //     var data = util.inspect(manifest, { depth: null });

    //   })

    // 方法三： python脚本 + jar包
    var data = JSON.parse(exec('python3 main.py ' + filename));
    // console.log("parseApk----------", data)
    if (!data.name) {
      return reject(err);
    }
    resolve(data)

  });
}

function parseText(text) {
  var regx = /(\w+)='([\w\.\d]+)'/g
  var match = null, result = {}
  while (match = regx.exec(text)) {
    result[match[1]] = match[2]
  }
  return result
}

function extractApkIcon(filename, guid) {
  return new Promise(function (resolve, reject) {

    resolve({ "success": true });
    // ApkReader.open(filename)
    //   .then(reader => reader.readManifest())
    //   .then(manifest => {

    //     console.log("Data-----------------", util.inspect(manifest, { depth: null }));
    //     var icon = manifest.application &&  manifest.application.icon;
    //     if (!icon) return reject(manifest);

    //     console.log("icon-------------", icon)
    //     // resolve()
    // })

    // var data = JSON.parse(exec('python3 main.py ' + filename));
    // console.log("parseApk----------", data)

    // apkParser3(filename, function (err, data) {
    //   if (err) return reject(err);
    //   var iconPath = false;
    //   [640, 320, 240, 160].every(i => {
    //     if (typeof data["application-icon-" + i] !== 'undefined') {
    //       iconPath = data["application-icon-" + i];
    //       return false;
    //     }
    //     return true;
    //   });
    //   if (!iconPath) {
    //     reject("can not find icon ");
    //   }
    //   console.log("iconPath--------------", iconPath)
    //   iconPath = iconPath.replace(/'/g, "")
    //   var tmpOut = iconsDir + "/{0}.png".format(guid)
    //   var zip = new AdmZip(filename);
    //   var ipaEntries = zip.getEntries();
    //   var found = false
    //   console.log("extractApkIcon---------", tmpOut, "---------", iconPath)

    //   ipaEntries.forEach(function (ipaEntry) {
    //     if (ipaEntry.entryName.indexOf(iconPath) != -1) {
    //       var buffer = new Buffer(ipaEntry.getData());
    //       if (buffer.length) {
    //         found = true
    //         fs.writeFile(tmpOut, buffer, function (err) {
    //           if (err) {
    //             reject(err)
    //           }
    //           resolve({ "success": true })
    //         })
    //       }
    //     }
    //   })
    //   if (!found) {
    //     reject("can not find icon ")
    //   }
    // });
  })
}

function extractIpaIcon(filename, guid) {
  return new Promise(function (resolve, reject) {
    resolve({ "success": true });
    // var tmpOut = iconsDir + "/{0}.png".format(guid)
    // var zip = new AdmZip(filename);
    // var ipaEntries = zip.getEntries();
    // var found = false;
    // ipaEntries.forEach(function (ipaEntry) {
    //   if (ipaEntry.entryName.indexOf('AppIcon60x60@2x.png') != -1) {
    //     found = true;
    //     var buffer = new Buffer(ipaEntry.getData());
    //     if (buffer.length) {
    //       fs.writeFile(tmpOut, buffer, function (err) {
    //         if (err) {
    //           reject(err)
    //         } else {
    //           var execResult = exec(path.join(__dirname, 'bin', 'pngdefry -s _tmp ') + ' ' + tmpOut)
    //           if (execResult.stdout.indexOf('not an -iphone crushed PNG file') != -1) {
    //             resolve({ "success": true })
    //           } else {
    //             fs.remove(tmpOut, function (err) {
    //               if (err) {
    //                 reject(err)
    //               } else {
    //                 var tmp_path = iconsDir + "/{0}_tmp.png".format(guid)
    //                 fs.rename(tmp_path, tmpOut, function (err) {
    //                   if (err) {
    //                     reject(err)
    //                   } else {
    //                     resolve({ "success": true })
    //                   }
    //                 })
    //               }
    //             })
    //           }
    //         }
    //       })
    //     }
    //   }
    // })
    // if (!found) {
    //   reject("can not find icon ")
    // }
  })
}
