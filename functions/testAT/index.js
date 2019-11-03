//需求
//1. 创建AccessTokenDb collection with one doc with id of ‘at’
//2. 配置ENV for appid & secret

////////////////////////////////////////////////
////////////////////////////////////////////////
// 云函数入口文件
const cloud = require('wx-server-sdk')
const https = require('https')

//init cloud function before other cloud calls
cloud.init({
  env: 'lianyi-z6q87'//cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
    const wxContext = cloud.getWXContext()
    console.info(await updateAccessToken('this is a token', process.env.TEST))
    return {
        event,
        token: await retrieveAccessToken(),
        openid: wxContext.OPENID,
        appid: wxContext.APPID,
        unionid: wxContext.UNIONID,
    }
}

//
// async function getAccessToken(ctx) {
//     let url = 'https://api.weixin.qq.com/cgi-bin/token?' +
//         'grant_type=client_credential&appid="你的addid"&secret=你的appsecret'
//     let eventuallySccessToken = ''
//     let accessToken = ''
//     // wx_accessToken为存储accessToken的表
//     const sqlAccessToken = await mysql('wx_accessToken').select('*').first()
//
//     // 数据库中是否有存储过accessToken记录
//     if (sqlAccessToken !== undefined) {
//         // 判断是否过期
//         let oldTime = sqlAccessToken.creat_time
//         oldTime = new Date(oldTime).getTime()
//         let newTime = (new Date()).getTime()
//         let resutl = parseInt((newTime - oldTime) / 1000 / 60 / 60)
//         if (resutl > 1) {
//             // 从新获取access_token值
//             accessToken = await getHttpOption(url)
//             // 存储后台
//             if (accessToken) {
//                 // 存储后台
//                 await mysql('wx_accessToken').update({access_token: accessToken.access_token}).where('id', sqlAccessToken.id)
//                 eventuallySccessToken = accessToken.access_token
//             } else {
//                 ctx.state.data = {
//                     code: -1,
//                     msg: '获取失败！'
//                 }
//                 return
//             }
//         } else {
//             // 没有过期 继续使用数据库中的access_token值
//             eventuallySccessToken = sqlAccessToken.access_token
//         }
//     } else {
//         // 从新请求并存储
//         accessToken = await getHttpOption(url)
//         // 插入数据库
//         if (accessToken) {
//             // 存储后台
//             await mysql('wx_accessToken').insert({access_token: accessToken.access_token})
//             eventuallySccessToken = accessToken.access_token
//         } else {
//             ctx.state.data = {
//                 code: -1,
//                 msg: '获取失败！'
//             }
//             return
//         }
//     }
//     ctx.state.data = {
//         eventuallySccessToken,
//         msg: '获取成功！'
//     }
// }
//
//

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
