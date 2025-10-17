// const { app, BrowserWindow } = require('electron');
// const path = require('path');

// function createWindow() {
//     const win = new BrowserWindow({
//         width: 1200,
//         height: 800,
//         webPreferences: {
//         nodeIntegration: false, // ما تستخدمش أكواد Node داخل HTML
//         contextIsolation: true
//         },
//     });

//     // يشغل الصفحة الرئيسية
//     win.loadFile('index.html');

//     // لو عايز تفتح صفحة الأدمن من الزرار أو رابط تاني
//     // اعمل نافذة جديدة وقت الحاجة مش من هنا
// }

// app.whenReady().then(createWindow);


const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;
let splash;

function createWindow() {
    // 🟤 أول حاجة نعرض صفحة الـ Splash
    splash = new BrowserWindow({
        width: 400,
        height: 300,
        frame: false, // بدون شريط علوي
        alwaysOnTop: true,
        transparent: false,
        resizable: false,
    });
    splash.loadFile('splash.html');

    // 🟢 نجهز النافذة الأساسية (البرنامج)
    mainWindow = new BrowserWindow({
        width: 1000,
        height: 700,
        show: false, // نخفيها مؤقتًا
        webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        },
    });

    mainWindow.loadFile('index.html');

    // 🕐 بعد فترة قصيرة نغلق الـ Splash ونظهر البرنامج
    setTimeout(() => {
        splash.close();
        mainWindow.show();
    }, 4000); // بعد 4 ثواني
}

app.whenReady().then(createWindow);
