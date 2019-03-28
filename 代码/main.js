// 2.0 引入 superagent 包，用于 Node 服务器发送http请求
const request = require("superagent");
// 3.0 导入 cheerio，把字符串解析成 HTML
const cheerio = require("cheerio");
// 4.0 导入模板引擎
const template = require("art-template");
// 4.0.1 导入 path 模块处理路径
const path = require("path");
// 5.0 导入 发送邮件的包
const nodemailer = require("nodemailer");
// 6.0 导入 定时任务模块
const schedule = require("node-schedule");

// 1.0 计算爱人认识的天数
function getDayData() {
    return new Promise((resolve, reject) => {
        // 现在的时间
        const today = new Date();
        // 认识的时间 2019-03-01
        const meet = new Date("2019-03-01");
        // 计算相识到今天的天数，毫秒值，1000毫秒1秒，60秒1分，60分1小时，24小时1天
        const count = Math.ceil((today - meet) / 1000 / 60 / 60 / 24);
        // 今天日期格式化
        const format =
            today.getFullYear() +
            " / " +
            (today.getMonth() + 1) +
            " / " +
            today.getDate();
        const dayData = {
            count,
            format
        };
        // console.log(dayData);
        resolve(dayData);
    });
}
// getDayData();

// 2.1 请求墨迹天气获取数据
function getMojiData() {
    return new Promise((resolve, reject) => {
        request
            .get("https://tianqi.moji.com/weather/china/guangdong/guangzhou")
            .end((err, res) => {
                if (err) return console.log("数据请求失败，请检查路径");
                // console.log(res.text);
                // 把字符串解析成THML，并可用 jQuery 核心选择器获取内容
                const $ = cheerio.load(res.text);
                // 图标
                const icon = $(".wea_weather span img").attr("src");
                // 天气
                const weather = $(".wea_weather b").text();
                // 温度
                const temperature = $(".wea_weather em").text();
                // 提示
                const tips = $(".wea_tips em").text();
                // 墨迹天气数据
                const mojiData = {
                    icon,
                    weather,
                    temperature,
                    tips
                };
                // console.log(mojiData);
                resolve(mojiData);
            });
    });
}
// getMojiData();

// 3.1 请求 One 页面抓取数据
function getOneData() {
    return new Promise((resolve, reject) => {
        request.get("http://wufazhuce.com/").end((err, res) => {
            if (err) return console.log("请求失败");

            // 把返回值中的页面解析成 HTML
            const $ = cheerio.load(res.text);
            // 抓取 one 的图片
            const img = $(
                ".carousel-inner>.item>img, .carousel-inner>.item>a>img"
            )
                .eq(0)
                .attr("src");
            // 抓取 one 的文本
            const text = $(".fp-one .fp-one-cita-wrapper .fp-one-cita a")
                .eq(0)
                .text();
            // one 数据
            const oneData = {
                img,
                text
            };
            // console.log(oneData);
            resolve(oneData);
        });
    });
}
// getOneData();

// 4.0 通过模板引起替换 HTML 的数据
async function renderTemplate() {
    // 获取 日期
    const dayData = await getDayData();
    // 获取 墨迹天气数据
    const mojiData = await getMojiData();
    // 获取 One 的数据
    const oneData = await getOneData();
    // console.log(dayData);
    // console.log(mojiData);
    // console.log(oneData);
    // 2. 所有数据都获取成功的时候，才进行模板引擎数据的替换
    return new Promise((resolve, reject) => {
        const html = template(path.join(__dirname, "./love.html"), {
            dayData,
            mojiData,
            oneData
        });
        // console.log(html);
        resolve(html);
    });
}
// renderTemplate();

// 5. 发送邮件
async function sendNodeMail() {
    // HTML 页面内容，通过 await 等待模板引擎渲染完毕后，再往下执行代码
    const html = await renderTemplate();
    // console.log(html);
    // 使用默认SMTP传输，创建可重用邮箱对象
    let transporter = nodemailer.createTransport({
        host: "smtp.163.com",
        port: 465,
        secure: true, // 开启加密协议，需要使用 465 端口号
        auth: {
            user: "gzqd201802@163.com", // 用户名
            pass: "1234qwer" // 客户端授权密码
        }
    });

    // 设置电子邮件数据
    let mailOptions = {
        from: '"帅气的小哥哥" <gzqd201802@163.com>', // 发件人邮箱
        to: "gzqd201803@163.com", // 收件人列表
        subject: "这个一封充满爱的邮件", // 标题
        html: html // html 内容
    };
    // 发送邮件
    transporter.sendMail(mailOptions, (error, info = {}) => {
        if (error) {
            console.log(error);
            sendNodeMail(); //再次发送
        }
        console.log("邮件发送成功", info.messageId);
        console.log("静等下一次发送");
    });
}
// sendNodeMail();

// 6. 定时每天 5时20分14秒发送邮件给女（男）朋友
// 6.1 创建定时器任务
console.log("爱的邮件正在运行，每天05:20，会自动发送邮件女朋友...");
schedule.scheduleJob("14 20 5 * * *", function() {
    // 时间到了，执行发送邮件的任务
    sendNodeMail();
    console.log("现在时间是05:20，爱的邮件发送成功♥");
});