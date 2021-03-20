/** 第一个界面 */
const firstFrameSelector = ".first";
/** 第二个界面 */
const secondFrameSelector = ".second";
/** 休息按钮 */
const restBtnSelector = ".rest-btn";
/** 工作按钮 */
const workBtnSelector = ".work-btn";
/** 下一个任务按钮 */
const taskBtnSelector = ".task-btn";
/** 暂停按钮 */
const pauseBtnSelector = ".pause-btn";
/** 保存设置按钮 */
const saveBtnSelector = ".save-btn";
/** 取消保存设置按钮 */
const cancelBtnSelector = ".cancel-btn";
/** 设置按钮 */
const settingBtnSelector = ".setting-btn";
/** 返回主页按钮 */
const homeBtnSelector = ".home-btn";
/** 设置面板 */
const settingFrameSelector = ".setting-frame";
/** 输入工作时间的文本框 */
const workInputSelector = "#work-input";
/** 输入休息时间的文本框 */
const restInputSelector = "#rest-input";
/** 输入背景颜色的文本框 */
const colorInputSelector = "#color-input";
/** 显示颜色提示 */
const colorShowSelector = "#color-show";
/** 显示标题的元素 */
const titleDivSelector = ".title";
/** 显示倒计时的元素 */
const timerDivSelector = ".timer";

/** 工作时间，单位：秒 */
let workTime = 10;
/** 休息时间，单位：秒 */
let restTime = 5;
/** 背景颜色 */
let background = '#87CEAA';

let timer = null;
/** 是否已经开始任务 */
let isClocking = false;
let isPause = false;

window.onload = () => {
};

utools.onPluginEnter(({code}) => {
    initData();
    main(code);
});

function clearTimer() {
    if (timer != null) {
        timer.stop();
        timer.off();
        timer = null;
    }
    isClocking = false;
}

function startTimer(second) {
    if (timer != null) timer.start(second);
    isClocking = true;
}

function run(type) {
    timer = new Timer({
        onstart: () => timerStart(type),
        ontick: (ms) => $(timerDivSelector).html(getClockTime(Math.round(ms / 1000))),
        onend: () => timerEnd(type)
    });

    if (!isClocking) {
        $(firstFrameSelector).css("display", 'none');
        $(secondFrameSelector).css("display", 'block');
        isClocking = true;
        if (type === 'work') {
            $(timerDivSelector).html(getClockTime(workTime));
            startTimer(workTime);
        } else if (type === 'rest') {
            $(timerDivSelector).html(getClockTime(restTime));
            startTimer(restTime);
        }
    }
}

/**
 * 开始计时调用执行
 */
function timerStart(type) {
    $(taskBtnSelector).css("display", 'none');
    $(pauseBtnSelector).css("display", 'block');
    $(pauseBtnSelector).html('暂停');

    if (type === 'work') {
        $(taskBtnSelector).html("休息");
        $(titleDivSelector).html("Working");
        utools.showNotification("开始工作! 倒计时：" + getClockTime(workTime), type);
        utools.hideMainWindow();
        setTimeout(() => {
            utools.outPlugin();
        }, 2000);
    } else if (type === 'rest') {
        $(taskBtnSelector).html("工作");
        $(titleDivSelector).html("Resting");
        utools.showMainWindow();
        $(pauseBtnSelector).css("display", "none");
    }
}

/**
 * 计时结束调用执行
 */
function timerEnd(type) {
    $(pauseBtnSelector).css("display", 'none');
    $(taskBtnSelector).css("display", 'block');
    $(titleDivSelector).html('');

    if (type === 'work') {
        $(timerDivSelector).html('工作完成!');
        utools.showNotification("工作完成! ", type);

    } else if (type === 'rest') {
        let notification = "休息完成!";
        $(timerDivSelector).html(notification);
        // ipcRenderer.send("end-rest", notification);
        utools.showNotification(notification, type);
    }
    clearTimer();
}

function main(type) {
    if (type === 'work' && !isClocking) {
        $(workBtnSelector).click();
        console.log(type);
    } else if (type === 'rest' && !isClocking) {
        $(restBtnSelector).click();
    }


    $(settingBtnSelector).click((event) => {
        $(settingFrameSelector).fadeToggle("fast");
        event.stopPropagation();
    });

    $(settingBtnSelector).mousedown(() => false);

    $(colorInputSelector).keyup(() => $(colorShowSelector).css("background-color", $(colorInputSelector).val()));

    $(saveBtnSelector).click(() => {
        updateData({
            workHours: parseInt($(workInputSelector).val()),
            restHours: parseInt($(restInputSelector).val()),
            backgroundColor: $(colorInputSelector).val()
        });
        $(settingBtnSelector).click();
    });

    $(cancelBtnSelector).click(() => $(settingBtnSelector).click());

    $(workBtnSelector).on("click", () => run('work'));

    $(restBtnSelector).click(() => run('rest'));

    $(homeBtnSelector).click(() => {
        if ($(firstFrameSelector).css("display") === 'none') {
            if (isClocking) {
                let index = utools.showMessageBox({
                    type: 'question',
                    buttons: ['确定', '取消'],
                    title: '提示',
                    message: '退出倒计时？',
                    defaultId: 1,
                    cancelId: 1
                });
                if (index === 0) {
                    clearTimer();
                    $(firstFrameSelector).css("display", "block");
                    $(secondFrameSelector).css("display", "none");
                }
            } else {
                clearTimer();
                $(firstFrameSelector).css("display", "block");
                $(secondFrameSelector).css("display", "none");
            }
        }
    });

    $(document).on('click', () => {
        $(settingFrameSelector).fadeOut();
    });

    $(settingFrameSelector).on('click', (event) => {
        event.stopPropagation();
    });

    $(pauseBtnSelector).click(() => {
        if (timer != null) {
            if (isPause) {
                timer.start();
                $(pauseBtnSelector).html("暂停");
                isPause = false;
            } else {
                timer.pause();
                $(pauseBtnSelector).html("继续");
                isPause = true;
            }
        }
    });

    $(taskBtnSelector).click(() => {
        clearTimer();
        $(taskBtnSelector).css("display", "none");
        $(pauseBtnSelector).css("display", "block");
        if ($(taskBtnSelector).text().trim() === '工作') {
            run('work');
        } else if ($(taskBtnSelector).text().trim() === '休息') {
            run('rest');
        }
        $(settingFrameSelector).fadeOut('fast');
    });
}

/**
 *  通过秒数，获取时钟，小时分钟秒，如果小时为0就不返回小时
 */
function getClockTime(second) {
    let ss = Math.floor(second % 60);
    let mm = Math.floor(second / 60);
    let hh = Math.floor(second / 3600);
    return ((hh === 0) ? "" : hh.toString().padStart(2, '0') + ":") + mm.toString().padStart(2, '0') + ":" + ss.toString().padStart(2, '0');
}

/**
 * 初始化数据
 */
function initData() {
    let workTimeTemp = utools.db.get('work');
    let restTimeTemp = utools.db.get('rest');
    let backgroundTemp = utools.db.get('background');

    if (workTimeTemp == null || restTimeTemp == null || backgroundTemp == null) {
        updateData({
            workHours: workTime,
            restHours: restTime,
            backgroundColor: background
        });
    } else {
        workTime = workTimeTemp.data;
        restTime = restTimeTemp.data;
        background = backgroundTemp.data;
    }

    updateViewData();
}

/**
 * 更新数据
 */
function updateData({workHours, restHours, backgroundColor}) {
    if (workHours != null) {
        let workTemp = utools.db.get('work');
        if (workTemp != null) {
            workTemp.data = workHours;
            utools.db.put(workTemp);
            workTime = workHours;
        } else {
            utools.db.put({
                _id: 'work',
                data: workHours
            });
        }
    }

    if (restHours != null) {
        let restTemp = utools.db.get('rest');
        if (restTemp != null) {
            restTemp.data = restHours;
            utools.db.put(restTemp);
            restTime = restHours;
        } else {
            utools.db.put({
                _id: 'rest',
                data: restHours
            });
        }
    }

    if (backgroundColor != null) {
        let backgroundTemp = utools.db.get('background');
        if (backgroundTemp != null) {
            backgroundTemp.data = backgroundColor;
            utools.db.put(backgroundTemp);
            background = backgroundColor;
        } else {
            utools.db.put({
                _id: 'background',
                data: backgroundColor
            });
        }
    }

    updateViewData();
}

/**
 * 更新视图数据
 */
function updateViewData() {
    $('html').css("background-color", background);
    $(colorShowSelector).css("background-color", background);
    $(colorInputSelector).val(background);

    $(workInputSelector).val(workTime);
    $(restInputSelector).val(restTime);
}