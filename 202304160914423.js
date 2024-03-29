"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
const fs = __importStar(require("fs"));
const path_1 = __importDefault(require("path"));
const os = __importStar(require("os"));
//返回false或者stdout
function precheck(ctx) {
    var userConfig0 = ctx.getConfig("picBed.rclone");
    var lloc = os.homedir() + "/.picgo-rclone-local.json";
    var lJson = {
        'remoteName': userConfig0.remoteName,
        'remoteBucketName': userConfig0.remoteBucketName,
        'remotePrefix': userConfig0.remotePrefix,
        'urlPrefix': userConfig0.urlPrefix,
        'uploadPath': userConfig0.uploadPath,
        'localPostion': userConfig0.localPostion,
        'backupName1': userConfig0.backupName1,
        'backupName2': userConfig0.backupName2,
        'backupName3': userConfig0.backupName3
    };
    try {
        //var fjson = JSON.parse(fs.readFileSync(lloc,'utf-8'))
        var fjson = fs.readFileSync(lloc, 'utf-8');
        if (JSON.stringify(lJson) == fjson) {
            console.log("配置没有变更，跳过存储桶检查");
        }
    }
    catch (_a) {
        console.log("配置变更，重新判断存储桶信息");
        fs.writeFileSync(lloc, JSON.stringify(lJson));
        let checkTasks = [];
        if (userConfig0.remoteName) {
            const promiseRemote = utils_1.checkRemoteExist(userConfig0.remoteName, userConfig0.remoteBucketName);
            checkTasks.push(promiseRemote);
        }
        if (userConfig0.backupName1) {
            const promise1 = utils_1.checkRemoteExist(userConfig0.backupName1, userConfig0.remoteBucketName);
            checkTasks.push(promise1);
        }
        if (userConfig0.backupName2) {
            const promise2 = utils_1.checkRemoteExist(userConfig0.backupName2, userConfig0.remoteBucketName);
            checkTasks.push(promise2);
        }
        if (userConfig0.backupName3) {
            const promise3 = utils_1.checkRemoteExist(userConfig0.backupName3, userConfig0.remoteBucketName);
            checkTasks.push(promise3);
        }
        console.log(checkTasks);
        Promise.all(checkTasks).catch((err) => {
            ctx.log.error("检查存储名称失败");
            ctx.log.error(err);
            ctx.emit('notification', {
                title: 'rclone上传错误',
                body: '请检查存储桶、远程源名字是否正确',
                text: ''
            });
            throw err;
        });
    }
}
const handle = async (ctx) => {
    let ListExec = [];
    let userConfig = ctx.getConfig("picBed.rclone");
    if (!userConfig) {
        throw new Error("RCLONE in Picgo config not exist!");
    }
    if (userConfig.uploadPath) {
        userConfig.uploadPath = userConfig.uploadPath.replace(/\/?$/, '');
    }
    if (userConfig.urlPrefix) {
        userConfig.urlPrefix = userConfig.urlPrefix.replace(/\/$/, '');
    }
    if (userConfig.localPostion) {
        try {
            fs.mkdirSync(userConfig.localPostion);
        }
        catch (error) {
            console.log("创建文件夹失败，检查位置是否正确");
        }
    }
    //item 属于IImgInfo类型
    // 顺序 idx
    // 定义返回值，url，index
    //通常上传成功之后要给这个数组里每一项加入imgUrl以及url项。可以参
    let rcloneLocalURI = ""; //  路径 返回，同时存储到文件
    for (let index in ctx.output) {
        let item = ctx.output[index];
        console.log(item);
        var fPath = utils_1.formatPath(item, userConfig.uploadPath);
        // 修改成loc路径
        rcloneLocalURI = utils_1.backupInLocalSync(ctx, os.homedir(), item);
        if (userConfig.remotePrefix) {
            var rcloneBackupDir1 = userConfig.backupName1 + ":" + userConfig.remoteBucketName + "/" + userConfig.remotePrefix + "/" + fPath;
            var rcloneBackupDir2 = userConfig.backupName2 + ":" + userConfig.remoteBucketName + "/" + userConfig.remotePrefix + "/" + fPath;
            var rcloneBackupDir3 = userConfig.backupName3 + ":" + userConfig.remoteBucketName + "/" + userConfig.remotePrefix + "/" + fPath;
        }
        else {
            var rcloneBackupDir1 = userConfig.backupName1 + ":" + userConfig.remoteBucketName + "/" + fPath;
            var rcloneBackupDir2 = userConfig.backupName2 + ":" + userConfig.remoteBucketName + "/" + fPath;
            var rcloneBackupDir3 = userConfig.backupName3 + ":" + userConfig.remoteBucketName + "/" + fPath;
        }
        console.log(userConfig.localPostion);
        console.log(rcloneLocalURI);
        await precheck(ctx);
        // 带URL的远程
        var up = utils_1.execFilefunc("rclone", ['sync', '-P', rcloneLocalURI, rcloneRemoteDir]);
        ListExec.push(up);
        if (userConfig.localPostion) {
            var lo = utils_1.execFilefunc("rclone", ['sync', '-P', rcloneLocalURI, rcloneLocalPosition]);
            ListExec.push(lo);
        }
        if (userConfig.backupName1) {
            var up1 = utils_1.execFilefunc("rclone", ['sync', '-P', rcloneLocalURI, rcloneBackupDir1]);
            ListExec.push(up1);
        }
        if (userConfig.backupName2) {
            var up2 = utils_1.execFilefunc("rclone", ['sync', '-P', rcloneLocalURI, rcloneBackupDir2]);
            ListExec.push(up2);
        }
        if (userConfig.backupName3) {
            var up3 = utils_1.execFilefunc("rclone", ['sync', '-P', rcloneLocalURI, rcloneBackupDir3]);
            ListExec.push(up3);
        }
        await Promise.all(ListExec).then(() => {
            console.log(item);
            //if (!ctx.output[index].buffer && !ctx.output[index].base64Image) {
            //  ctx.log.error(new Error('undefined image'))
            //}
            if (userConfig.remotePrefix) {
                var imgURL = userConfig.remotePrefix + "/" + fPath + "/" + path_1.default.basename(rcloneLocalURI);
            }
            else {
                var imgURL = fPath + "/" + path_1.default.basename(rcloneLocalURI);
            }
            delete item.buffer;
            delete item.base64Image;
            item.url = `${userConfig.urlPrefix}/${imgURL}`;
            item.imgUrl = `${userConfig.urlPrefix}/${imgURL}`;
            ctx.output[index] = item;
            return ctx;
        }).catch((err) => {
            ctx.log.error('rclone上传发生错误，请检查配置是否正确');
            ctx.log.error(err);
            ctx.emit('notification', {
                title: 'rclone上传错误',
                body: '请检查存储桶、远程源名字是否正确',
                text: ''
            });
            throw err;
        }).then(() => { fs.unlinkSync(rcloneLocalURI); ctx.log.info(`rcloneLocalURI:${rcloneLocalURI}`); ctx.log.info("已经删除临时文件"); }).catch(() => { console.log("执行rclone 命令失败"); ctx.log.info("执行rclone 命令失败"); });
    } //for
}; //handle
const config = (ctx) => {
    const defaultConfig = {
        remoteName: '',
        remoteBucketName: '',
        remotePrefix: '',
        urlPrefix: '',
        uploadPath: '{year}/{month}/',
        backupName1: '',
        backupName2: '',
        backupName3: '',
        localPostion: '',
    };
    let userConfig = ctx.getConfig('picBed.rclone');
    userConfig = Object.assign(Object.assign({}, defaultConfig), (userConfig || {}));
    return [
        {
            name: 'remoteName',
            type: 'input',
            default: userConfig.remoteName,
            required: true,
            message: '您设定的远程存储的名称',
            alias: '远端存储名'
        },
        {
            name: 'remotePrefix',
            type: 'input',
            default: userConfig.remotePrefix,
            required: false,
            message: '桶下前缀文件夹名',
            alias: '桶下前缀Prefix'
        },
        {
            name: 'urlPrefix',
            type: 'input',
            default: userConfig.urlPrefix,
            message: '根据存储后端设定的域名前缀',
            required: true,
            alias: '域名前缀'
        },
        {
            name: 'uploadPath',
            type: 'input',
            default: userConfig.uploadPath,
            message: '为空则以原始文件名上传到根目录',
            required: false,
            alias: '上传路径'
        },
        {
            name: 'backupName1',
            type: 'input',
            default: userConfig.backupName1,
            required: false,
            message: '您设定的远程存储的名称(备份位1)',
            alias: '备份存储名1'
        },
        {
            name: 'backupName2',
            type: 'input',
            default: userConfig.backupName2,
            required: false,
            message: '您设定的远程存储的名称(备份位2)',
            alias: '备份存储名2'
        },
        {
            name: 'bucketName3',
            type: 'input',
            default: userConfig.backupName3,
            required: false,
            message: '您设定的远程存储的名称(备份位2)',
            alias: '备份存储名3'
        },
        {
            name: 'localPostion',
            type: 'input',
            default: userConfig.localPostion,
            required: false,
            message: '/home/picgo-rclone or D:\\picgo-rclone',
            alias: '本地备份绝对路径'
        }
    ];
};
module.exports = (ctx) => {
    const register = () => {
        ctx.helper.uploader.register('rclone', {
            config,
            handle,
            name: "RCLONE"
        });
    };
    return {
        register,
        uploader: 'RCLONE'
    };
};
