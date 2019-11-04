//////////////////
// 设置需求      //
//////////////////
//1. 创建AccessTokenDb collection with one doc with id of ‘at’
//2. 配置ENV for APPID & SECRET
//      process.env.APPID
//      process.env.SECRET

////////////////////////////////////////////////
////////////////////////////////////////////////
// 云函数入口文件
const cloud = require('wx-server-sdk');
const https = require('https');

//init cloud function before other cloud calls
cloud.init({
    env: 'lianyi-z6q87'//cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const tokenUrl = 'https://api.weixin.qq.com/cgi-bin/token?' +
    'grant_type=client_credential&appid=' + process.env.APPID +
    '&secret=' + process.env.SECRET;

// 云函数入口函数
exports.main = async (event, context) => {
    const wxContext = cloud.getWXContext();
    let url = tokenUrl;
    let eventuallySccessToken = '';
    let accessToken = '';

    const myAccessToken = await retrieveAccessToken();
    // 检查数据库中是否有存储过accessToken记录
    if (myAccessToken && myAccessToken.creat_time && myAccessToken.access_token) {
        // 判断是否过期
        let oldTime = myAccessToken.creat_time;
        oldTime = new Date(oldTime).getTime();
        let newTime = (new Date()).getTime();
        let resutl = parseInt((newTime - oldTime) / 1000 / 60 / 60); //hours
        if (resutl > 1) { //renew before 1 hour
            // 从新获取access_token值
            accessToken = await getHttpOption(url);
            // 存储后台
            if (accessToken) {
                // 存储后台
                await updateAccessToken(accessToken.access_token, (new Date()).toISOString());
                eventuallySccessToken = accessToken.access_token
            } else {
                console.error({
                    code: -1,
                    msg: '获取失败！'
                });
                return -1;
            }
        } else {
            // 没有过期 继续使用数据库中的access_token值
            eventuallySccessToken = myAccessToken.access_token
        }
    } else {
        // 从新请求并存储
        accessToken = await getHttpOption(url)
        // 插入数据库
        if (accessToken) {
            // 存储后台
            await updateAccessToken(accessToken.access_token, (new Date()).toISOString());
            eventuallySccessToken = accessToken.access_token
        } else {
            console.error({
                code: -1,
                msg: '获取失败！'
            });
            return -1;
        }
    }

    return {
        event,
        token: {
            eventuallySccessToken,
            msg: '获取成功！'
        },
        openid: wxContext.OPENID,
        appid: wxContext.APPID,
        unionid: wxContext.UNIONID,
    }
};


// 自己封装的同步请求函数
function getHttpOption(url) {
    return new Promise((resolve, reject) => {
        https.get(url, res => {
            let urlDate = ''
            res.on('data', data => {
                urlDate += data
            })
            res.on('end', data => {
                const accessToken = JSON.parse(urlDate)
                if (accessToken) {
                    resolve(accessToken)
                }
                reject(accessToken)
            })
        })
    })
}

// 自己封装的同步更新函数
async function updateAccessToken(access_token, creat_time) {
    try {
        return await db.collection('AccessTokenDb').doc('at').update({
            data: {
                description: "latest accesstoken",
                access_token: access_token,
                creat_time: creat_time
            }
        })
    } catch (e) {
        console.error(e)
    }
}

// 自己封装的同步提取函数
async function retrieveAccessToken() {
    try {
        return await db.collection('AccessTokenDb').doc('at').get()
    } catch (e) {
        console.error(e)
    }
}
