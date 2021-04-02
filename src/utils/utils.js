import store from '@/store/store'; // vuex
import CryptoJS from 'crypto-js'; // 加密工具
const util = {
    install(Vue) {
        /**
         * 通过url在当前页面下载文件
         * @param res 后端传回的文件流，axios返回的res.data的值
         * @param fileName 文件名，可能在文件流里面不包含，获取需要重命名
         * @param htmlType a标签页打开,传入html格式
         * @param enctype 文件格式
         */
        Vue.prototype.$downLoadFile = function (res, fileName, htmlType, enctype = 'multipart/form-data') {
            // 文件名存在header的content-disposition里
            if (!fileName) { // 如果没有传入文件名，则从数据中获取
                let disposition = res.headers['content-disposition'];
                // 获取到文件名
                fileName = decodeURI(disposition.split('filename=')[1]);
            }
            if (enctype === 'application/json;charset=UTF-8') {
                // application/json;charset=UTF-8：就是指“无类型”，一般的字节流用于数据传输，非文件下载
                let uint8 = new Uint8Array(this.response);
                // 解决使用fromCharCode后中文乱码的问题
                let resToString = decodeURIComponent(escape((String.fromCharCode(...uint8))));
                let message = JSON.parse(resToString).message;
                console.log(message);
                return;
            }
            // Blob()的第一个参数必须为数组，即使只有一个字符串也必须用数组装起来
            let blob = new Blob([res.data], { type: enctype });
            if (typeof window.navigator.msSaveBlob !== 'undefined') {
                // window.navigator.msSaveBlob：以本地方式保存文件
                window.navigator.msSaveBlob(blob, fileName);
            } else {
                // 创建新的URL表示指定的File对象或者Blob对象
                let URL = window.URL || window.webkitURL;
                let objectUrl = URL.createObjectURL(blob);
                if (fileName) {
                    // 创建a标签用于跳转至下载链接
                    let a = document.createElement('a');
                    // download：指示浏览器下载URL而不是导航到它，也可设置下载文件的名称
                    if (typeof a.download === 'undefined') {
                        // window.location：获得当前页面的地址 (URL)，并把浏览器重定向到新的页面
                        window.location = objectUrl;
                    } else {
                        a.href = objectUrl;
                        if (htmlType === 'html') {
                            // 如果为超链接，在新标签页打开文件
                            a.target = '_blank';
                        } else {
                            // 如果下载文件
                            a.download = fileName;
                        }
                        document.body.appendChild(a);
                        a.click(); // click()事件触发下载
                        a.remove(); // 去除a标签，以免影响其他操作
                    }
                } else {
                    window.location = objectUrl;
                }
                // 将URL释放
                URL.revokeObjectURL(objectUrl);
            }
        };
        /**
         * 判断一个对象是否为空
         * @param {Object} obj
         * @return {Boolean} true:对象为空 false:对象非空
         */
        Vue.prototype.$isEmptyObj = function(obj) {
            return obj ? !Object.keys(obj).length : true;
        };

        /**
         * 判断一个数组是否为空
         * @param {Array} arr
         * @return {Boolean} true:数组为空 false:数组非空
         */
        Vue.prototype.$isEmptyArray = function(arr) {
            return arr ? !(Array.isArray(arr) && arr.length) : true;
        };

        /**
         * 对一个json数据进行深拷贝（一般数据的拷贝，可以应对项目大部分需求）
         * 局限性
         * 1.如果json里面有时间对象，则序列化结果：时间对象=>字符串的形式；
         * 2.如果json里有RegExp、Error对象，则序列化的结果将只得到空对象 RegExp、Error => {}；
         * 3.如果json里有 function,undefined，则序列化的结果会把 function,undefined 丢失；
         * 4.如果json里有NaN、Infinity和-Infinity，则序列化的结果会变成null；
         * 5.如果json里有对象是由构造函数生成的，则序列化的结果会丢弃对象的 constructor；
         * 6.如果对象中存在循环引用的情况也无法实现深拷贝
         * @param {Object} json
         * @return {Object} 深拷贝之后的对象
         */
        Vue.prototype.$deepCopyJson = function(json) {
            return JSON.parse(JSON.stringify(json));
        };

        /**
         * 对一个字符串进行切割，转换成数组
         * @param {String} str 需要切割的字符串
         * @return {Array}  切割之后的数组
         */
        Vue.prototype.$splitStr = function(str) {
            return str ? str.split(',') : [];
        };

        /**
         * 判断一个数据是否为对象类型的数据
         * @param {*} data      需要判断的数据
         * @returns {boolean}   返回值
         */
        Vue.prototype.$isObject = function(data) {
            return Object.prototype.toString.call(data) === '[object Object]';
        };

        /**
         * 判断一个数据是否为数组类型的数据
         * 也可以使用 Array.isArray()，不过它是ES 5.1推出的，不支持IE6~8，在使用的时候要注意兼容问题
         * @param {*} data      需要判断的数据
         * @returns {boolean}   返回值
         */
        Vue.prototype.$isArray = function(data) {
            return Object.prototype.toString.call(data) === '[object Array]';
        };

        /**
         * 路由的跳转方法封装,主要是在保留路由参数状态下进行路由跳转
         * 将用户传入的参数(优先级最高),路由上的参数合并到空对象中,然后路由跳转
         * 注意: 直接改为 query.assign(vm.$route.query, routeObj.query) 无效
         * */
        Vue.prototype.$akRoute = {
            savePush: function (vm, routeObj) {
                vm.$router.push({
                    name: routeObj.name,
                    query: Object.assign({}, vm.$route.query, routeObj.query),
                    params: Object.assign({}, vm.$route.params, routeObj.params)
                });
            },
            saveReplace: function (vm, routeObj) {
                vm.$router.replace({
                    name: routeObj.name,
                    query: Object.assign({}, vm.$route.query, routeObj.query),
                    params: Object.assign({}, vm.$route.params, routeObj.params)
                });
            }
        };

        /**
         * 取消所有正在发送的请求
         * @param {Array} urlArr 可选参数，需要取消的请求，接受 请求地址&请求方式 组成的数组。不传则取消所有正在进行的请求
         */
        Vue.prototype.$cancelPendingHttp = function (urlArr) {
            // 获取缓存的 请求取消数组，取消所有关联的请求
            let cancelArr = window.axiosCancel;
            if (urlArr && urlArr instanceof Array) {
                urlArr.forEach(uri => {
                    // 匹配到所有需要取消的请求，执行取消操作（可能会有同个url对应的多个请求）。这里不能用findIndex
                    cancelArr.forEach((item, index) => {
                        if (item.uri === uri) {
                            item.cancelFn(); // 执行取消操作
                            cancelArr.splice(index, 1); // 删除 取消请求数组 里对应的项
                        }
                    });
                });
            } else {
                cancelArr.forEach((item, index) => {
                    item.cancelFn('Canceled request.');  // 执行取消操作，在失败函数中返回这里自定义的错误信息
                });
                window.axiosCancel = []; // 清空 取消请求数组
            }
        };

        /**
         * 判断数组a是否包含数组b的元素,是返回true,不是返回false
         * @param  {Array}     a    数组
         * @param  {Array}     b    数组
         * @return {Boolean}   true:数组a包含数组b的元素  false:数组a不包含数组b的元素
         */
        Vue.prototype.$isArrContain = function (a, b) {
            if (!(a instanceof Array) || !(b instanceof Array)) {
                return false;
            }
            if (a.length < b.length) return false;
            for (let i = 0; i < b.length; i++) {
                if (a.indexOf(b[i]) === -1) {
                    return false;
                }
            }
            return true;
        };

        /**
          * 弹出框组件,可以显示内容,和执行确认函数
          * 使用方法: Vue.$showAlert({ title: 标题(可选), content: 内容(可选), okFn: 确认函数(可选) })
          * */
        Vue.prototype.$showAlert = params => {
            store.commit('showAlert', params);
        };

        /**
          * 确认框组件,可以显示标题,内容,执行确认函数,执行取消函数
          * 使用方法: Vue.$showConfirm({ title: 标题(可选), content: 内容(可选), okFn: 确认函数(可选), cancelFn: 取消函数(可选) })
          * */
        Vue.prototype.$showConfirm = params => {
            store.commit('showConfirm', params);
        };

        /**
          * 提示框组件,可以显示标题,结果
          * 使用方法: Vue.$setTip({ title: 标题(可选), result: 结果(可选， 'success':成功，'fail':失败，'abnormal':异常 ) })
          * */
        Vue.prototype.$showTip = params => {
            store.commit('showTip', params);
        };

        /**
         * 此方法是专为密码加密用的
         * @params {String}     word    需要加密的密码
         * @params {String}     keyStr  加密的秘钥
         * @return {String}     加密后的结果，密文
         */
        Vue.prototype.$AesEncrypt = (word, keyStr) => {
            if (!word) return '';
            let source = CryptoJS.enc.Utf8.parse(word);
            let encrypted = CryptoJS.AES.encrypt(
                source,
                CryptoJS.enc.Utf8.parse(keyStr),
                {
                    mode: CryptoJS.mode.ECB,
                    padding: CryptoJS.pad.Pkcs7
                }
            );
            let hexValue = encrypted.ciphertext.toString();
            let parseHex = CryptoJS.enc.Hex.parse(hexValue);
            return CryptoJS.enc.Base64.stringify(parseHex);
        };

        /**
         * 对加密之后的密文进行解密
         * @param  {String}     word        需要解密的密码
         * @param  {String}     keyStr      解密的秘钥
         * @return {String}     解密之后的结果，明文
         */
        Vue.prototype.$AesDecrypt = (word, keyStr) => {
            if (!word) return '';
            let key = CryptoJS.enc.Utf8.parse(keyStr);
            let decrypt = CryptoJS.AES.decrypt(word, key, {
                mode: CryptoJS.mode.ECB,
                padding: CryptoJS.pad.Pkcs7
            });
            return CryptoJS.enc.Utf8.stringify(decrypt).toString();
        };

        /**
         * 防抖函数，常用场景：输入框实时请求搜索
         * 解释：某个事件被连续触发，但是希望处理函数不要连续执行，而是在事件被触发之后的一定时间内 没有事件再被触发了 才去执行处理函数
         * @param  {Function}   fn      事件触发之后的处理函数
         * @param  {Number}     delay   延时时间，单位：ms
         * @return {Function}
         */
        Vue.prototype.$debounce = (fn, delay = 200) => {
            if (!fn) { return }
            let timer;
            return function () {
                let vm = this;
                let args = arguments;
                // 取消之前的延时调用
                clearTimeout(timer);
                timer = setTimeout(function () {
                    fn.apply(vm, args);
                }, delay);
            };
        };

        /**
         * 节流函数，场景：在页面无限加载场景下，我们需要用户在滚动页面时，每隔一段时间发一次 Ajax 请求
         * 解释：某个事件被连续触发，但是希望处理函数不要连续执行，而是在事件被连续触发的过程中，每过一定时间，就执行一次处理函数
         * @param  {Function}   fn      事件触发之后的处理函数
         * @param  {Number}     delay   延时时间，单位：ms
         * @return {Function}
         */
        Vue.prototype.$throttle = (fn, delay = 200) => {
            let runFlag = false;
            return function () {
                let vm = this;
                let args = arguments;
                // 判断之前的调用是否完成
                if (runFlag) return false;
                runFlag = true;
                setTimeout(function () {
                    fn.apply(vm, args);
                    runFlag = false;
                }, delay);
            };
        };

        /**
         * 比较两个对象的值是否相同。适用于 键=>值 {name:'hhh', age:18, flag:true}，如果嵌套了引用类型的数据需自行判断
         * @param  {Object}     obj1    对象1
         * @param  {Object}     obj2    对象2
         * @return {Boolean}    flag    一个标识，true:相同，false:不相同
         */
        Vue.prototype.$isObjEqual = (obj1, obj2) => {
            let props1 = Object.keys(obj1);
            let props2 = Object.keys(obj2);
            if (props1.length !== props2.length) {
                return false;
            }
            for (let name of props1) {
                if (obj1[name] !== obj2[name]) {
                    return false;
                }
            }
            return true;
        };

        /**
         * 比较两个数组是否相同，适用于 ['hhh', 18, true]，如果嵌套了引用类型的数据需自行判断
         * 如果两个数组全部元素相同，但是顺序不同，返回true(使用了sort方法)
         * @param  {Array}      array1    数组1
         * @param  {Array}      array2    数组2
         * @return {Boolean}    flag      一个标识，true:相同，false:不相同
         */
        Vue.prototype.$isArrEqual = function (array1, array2) {
            let arr1 = array1.sort();
            let arr2 = array2.sort();
            if (arr1.length !== arr2.length) {
                return false;
            }
            for (let [index, value] of arr1.entries()) {
                if (value !== arr2[index]) {
                    return false;
                }
            }
            return true;
        };

        /**
         * 比较两个数组，获取增加的项/移除的项
         * @param  {Array}     arr1    最终数组
         * @param  {Array}     arr2    初始数组
         * @param  {String}    key(非必须)     数组的元素是对象时，可以用key判断
         * @return {Object}    addArr 增加的项    removeArr 移除的项
         */
        Vue.prototype.$getArrayChange = function (arr1, arr2, key) {
            let addArr = [];
            let removeArr = [];
            if (!key) {
                arr1.forEach(function (item) {
                    if (item instanceof Object) {
                        let itemStr = JSON.stringify(item);
                        if (JSON.stringify(arr2).indexOf(itemStr) < 0) {
                            addArr.push(item);
                        }
                    } else {
                        if (arr2.indexOf(item) < 0) {
                            addArr.push(item);
                        }
                    }
                });
                arr2.forEach(function (item) {
                    if (item instanceof Object) {
                        let itemStr = JSON.stringify(item);
                        if (JSON.stringify(arr1).indexOf(itemStr) < 0) {
                            removeArr.push(item);
                        }
                    } else {
                        if (arr1.indexOf(item) < 0) {
                            removeArr.push(item);
                        }
                    }
                });
                return {
                    addArr: addArr,
                    removeArr: removeArr
                };
            } else {
                addArr = arr1.filter(item1 => arr2.every(item2 => item1[key] !== item2[key]));
                removeArr = arr2.filter(item2 => arr1.every(item1 => item2[key] !== item1[key]));
                return {
                    addArr: addArr,
                    removeArr: removeArr
                };
            }
        };

        /**
         * 判断是否是ie浏览器
         * @return {boolean} true: 是IE浏览器 ，false: 不是IE浏览器
         */
        Vue.prototype.$isIE = function () {
            let userAgent = navigator.userAgent;
            // 判断是否IE<11浏览器
            let isMSIE = userAgent.indexOf('compatible') > -1 && userAgent.indexOf('MSIE') > -1;
            // 判断是否IE的Edge浏览器
            let isEdge = userAgent.indexOf('Edge') > -1 && !isMSIE;
            let isIE11 = userAgent.indexOf('Trident') > -1 && userAgent.indexOf('rv:11.0') > -1;
            return isMSIE || isEdge || isIE11;
        };

        /**
         * 获取某个月的天数数组，如：获取2019-9，返回 [1,2,3,...,30]。如果不传参默认返回当前月
         * @param year {Number} 年
         * @param month {Number} 月
         * @returns {number[]}
         */
        Vue.prototype.$getDateArr = function (year, month) {
            year = year || new Date().getFullYear();
            month = month || new Date().getMonth() + 1;
            return Array.from(new Array(new Date(year, month, 0).getDate()), (val, index) => index + 1);
        };

        /**
         * 获取最近xx小时的时刻数组
         * @param hours {number} 最近xx小时
         * @param timeUnit {string} 时间单位，默认为'ms'毫秒，可以传入's'改为秒
         * @returns {{name: string, time: number}[]}
         * [{name: "16:00", time: 1584777600000}, {name: "17:00", time: 1584781200000}, {name: "18:00", time: 1584784800000}]
         */
        Vue.prototype.$getRecentHours = function (hours, timeUnit = 'ms') {
            let curHour = new Date().getHours();
            let startHour = curHour - hours + 1; // 如果时间数组不包括当前小时，则无需 +1
            let arr = new Array(hours).fill(startHour).map((value, index) => value + index);
            arr = arr.map(i => (i < 0 ? i + 24 : i >= 24 ? i - 24 : i)); // 处理正负数
            let curHourTime = new Date().setHours(curHour, 0, 0, 0); // 当前小时零分零秒的时间戳
            let oneHourTime = 60 * 60 * 1000; // 一个小时对应的时间戳
            return arr.map((hour, index) => {
                let time = curHourTime + (index - hours + 1) * oneHourTime;
                return {
                    name: hour + ':00', // 统一字段叫name，便于外部统一处理
                    time: timeUnit === 'ms' ? time : Math.floor(time / 1000), // 根据时间单位转换
                };
            });
        };

        /**
         * 获取最近xx天的日期数组
         * @param days {number} 最近xx天
         * @param timeUnit {string} 时间单位，默认为'ms'毫秒，可以传入's'改为秒
         * @returns {{name: string, time: number}[]}
         * [{name: "2020-3-19", time: 1584547200000}, {name: "2020-3-20", time: 1584633600000}, {name: "2020-3-21", time: 1584720000000}]
         */
        Vue.prototype.$getRecentDays = function (days, timeUnit = 'ms') {
            let now = new Date().getTime();
            let oneDayTime = 24 * 60 * 60 * 1000;
            let arr = [];
            for (let i = days - 1; i >= 0; i--) {
                let timeObj = new Date(now - oneDayTime * i);
                let year = timeObj.getFullYear();
                let month = timeObj.getMonth() + 1;
                let date = timeObj.getDate();
                arr.push(`${year}-${month}-${date}`);
            }
            let curDayTime = new Date().setHours(0, 0, 0, 0); // 当天零点的时间戳

            return arr.map((day, index) => {
                let time = curDayTime + (index - days + 1) * oneDayTime;
                return {
                    name: day, // 统一字段叫name，便于外部统一处理
                    time: timeUnit === 'ms' ? time : Math.floor(time / 1000), // 根据时间单位转换
                };
            });
        };

        /**
         * 获取最近xx天的起始时间戳
         * 因为java端预统计是按一小时来计算的，所以起始时间需要往前取整到天，再传递到后端
         * @param days {number} 最近xx天   例如：30
         * @returns {number} 时间戳    例如：1589731200000
         */
        Vue.prototype.$getStartTimeByDay = function (days = 30) {
            let rangeTime = days * 24 * 60 * 60 * 1000;
            let date = new Date();
            let hours = date.getHours() * 60 * 60 * 1000;
            let minutes = date.getMinutes() * 60 * 1000;
            let seconds = date.getSeconds() * 1000;
            let milliseconds = date.getMilliseconds();  // 返回时间的毫秒
            let time = Date.now() - rangeTime - hours - minutes - seconds - milliseconds;
            return time;
        };

        /**
         * hex16进制颜色转rgb(rgba)
         * @param hex {String}      例如: '#AD5CC4'
         * @param opacity {Number}  例如: 0.5
         * @returns {String}        例如: 'rgba(173,92,196,0.5)'
         */
        Vue.prototype.$hexToRgba = function (hex, opacity = 1) {
            if (!hex) return '#fff';
            let sli = (start, end) => parseInt(hex.slice(start, end), 16);
            return 'rgba(' + sli(1, 3) + ',' + sli(3, 5) + ',' + sli(5, 7) + ',' + opacity + ')';
        };

        /**
         * 通过key获取 url? 后面的查询字符串对应的value
         * @param key {String}
         * @returns {String}
         */
        Vue.prototype.$getUrlSearchValue = function (key = '') {
            let url = window.location.search || '';
            let arr = url.substr(1).split('&').map(item => ({
                key: item.split('=')[0],
                value: item.split('=')[1],
            }));
            let resultObj = arr.find(item => item.key === key) || {};
            return resultObj.value;
        };

        /**
         * 获取当前月份的数据，返回年、月、日
         * @param year      年份，非必填，不填则默认今年
         * @param month     月份，非必填，不填则默认本月
         * @param isStartFromMonday  日历是否从周一开始，默认是从周一开始，改为 false 则从周日开始
         * @returns {{year: number, month: number, days: Array}}
         */
        Vue.prototype.$getCalendarData = function (year, month, isStartFromMonday = true) {
            let ret = [];
            // 如果没有传year,month，给默认值为今天
            if (!year || !month) {
                let today = new Date();
                year = today.getFullYear();
                month = today.getMonth() + 1;
            }

            let firstDay = new Date(year, month - 1, 1); // 当月第一天
            let firstDayWeekDay = firstDay.getDay(); // 当月第一天是周几
            if (firstDayWeekDay === 0) firstDayWeekDay = 7;
            year = firstDay.getFullYear();
            month = firstDay.getMonth() + 1;

            let lastDayOfLastMonth = new Date(year, month - 1, 0); // 上个月最后一天
            let lastDateOfLastMonth = lastDayOfLastMonth.getDate(); // 上个月最后一天是几号

            // 注意：日历如果从周日开始，就无需减1，如果从周一开始，就要减1
            let preMonthDayCount = firstDayWeekDay - (isStartFromMonday ? 1 : 0); // 日历第一行1号之前需要显示上个月几天
            let lastDay = new Date(year, month, 0); // 本月最后一天
            let lastDate = lastDay.getDate(); // 本月最后一天是几号

            for (let i = 0; i < 7 * 6; i++) {
                let date = i + 1 - preMonthDayCount;
                let showDate = date; // 用来显示超出本月应该显示在头部和尾部的日期
                let thisMonth = month; // 表示这个月
                if (date <= 0) {
                    // 上一月
                    thisMonth = month - 1;
                    showDate = lastDateOfLastMonth + date;
                } else if (date > lastDate) {
                    // 下一月
                    thisMonth = month + 1;
                    showDate = showDate - lastDate;
                }
                if (thisMonth === 0) thisMonth = 12;
                if (thisMonth === 13) thisMonth = 1;
                ret.push({
                    month: thisMonth,
                    date: date,
                    showDate: showDate
                });
            }
            return {
                year: year,
                month: month,
                days: ret
            };
        };

        /**
         * 下钻相关的页面需要调用此函数，用于修改组件 data 定义的初始变量
         * @param vm {object} vue组件实例
         * @param query {object} 非必填，用于校验query 以确定一个唯一的页面（如：tab页有相同的$route.name，需要加上query才能确定页面的唯一性）
         */
        Vue.prototype.$changeData = (vm, query) => {
            let tgtPage = vm.$store.state.targetPage;
            let srcPage = vm.$store.state.sourcePage.slice(-1)[0] || {};
            let routeName = vm.$route.name;

            // 判断$store存储的页面 跟 当前页面是否为同一页面
            // 路由名字相同，并且，如果传进来的query有值 参数跟 $store.state.targetPage.query 对应的参数值相同，否则query为空则忽略，就认定为同一页面
            let isTgtPage = tgtPage.name === routeName &&
                (query ? Object.keys(query).every(name => tgtPage.query[name] === query[name]) : true);
            let isSrcPage = srcPage.name === routeName &&
                (query ? Object.keys(query).every(name => srcPage.query[name] === query[name]) : true);

            // 1.当前页面是目标页面，需要将 源页面传过来的数据 更新到当前页面的 data()，以便页面进行查询
            isTgtPage && Object.assign(vm.$data, tgtPage.data);
            // 2.当前页面是源页面，需要将 跳转前保存的数据 更新到当前页面的 data()，以便页面进行还原
            isSrcPage && Object.assign(vm.$data, srcPage.data);
            // 关键！如果当前页面是源页面，更新了数据之后，要将 sourcePage 的最后一项数据删除
            isSrcPage && vm.$store.state.sourcePage.pop();
        };

        // 关联跳转，跳转到目标页面，并保存目标页面数据
        Vue.prototype.$goTargetPage = params => {
            store.commit('goTargetPage', params);
        };

        // 关联跳转，保存源页面数据
        Vue.prototype.$pushSourcePage = params => {
            store.commit('pushSourcePage', params);
        };

        // 关联跳转，跳转回源页面
        Vue.prototype.$goSourcePage = () => {
            store.commit('goSourcePage');
        };

        /**
        * 根据时间范围获取折线图x轴对应格式的日期
        * @param start      起始时间戳
        * @param end       结束时间戳
        * @param split     时间格式，默认以'-' 间隔
        * @param timeUnit {string} 时间单位，默认为'ms'毫秒，可以传入's'改为秒
        */
        Vue.prototype.$getXDate = (start, end, split = '-', timeUnit = 'ms') => {
            let timeDiff = end - start;
            let oneDay = 24 * 3600 * 1000;
            let pad = val => String(val).padStart(2, 0);
            let date = []; // 存储x轴的时间轴，开始时间-结束时间，精确到天
            for (let i = 0; i <= timeDiff; i += oneDay) {
                let now = new Date(start + i);
                date.push([now.getFullYear(), pad(now.getMonth() + 1), pad(now.getDate())].join(split));
            }
            return date.map(day => {
                let time = new Date(day).setHours(0, 0, 0, 0);
                return {
                    name: day, // 统一字段叫name，便于外部统一处理
                    time: timeUnit === 'ms' ? time : Math.floor(time / 1000), // 根据时间单位转换
                };
            });
        };

        // 重置路由
        Vue.prototype.$resetRouter = (vm, size = 10) => {
            vm.$akRoute.savePush(vm, {
                name: vm.$route.name,
                query: { page: 1, size: size }
            });
        };

        /**
         * 对象深度合并的方法。Object.assign() 只能合并对象的第一层属性，后续参数值会直接覆盖掉原对象的属性值。深度合并可以使用此方法
         * @arguments {object}
         * @returns {object}
         */
        const deepExtend = Vue.prototype.$deepExtend = function () {
            const extended = {};
            let i = 0;
            const length = arguments.length;

            function merge(obj) {
                for (const prop in obj) {
                    if (obj.hasOwnProperty(prop)) {
                        if (Object.prototype.toString.call(obj[prop]) === '[object Object]') {
                            extended[prop] = deepExtend(extended[prop], obj[prop]);
                        } else {
                            extended[prop] = obj[prop];
                        }
                    }
                }
            }

            for (; i < length; i++) {
                merge(arguments[i]);
            }
            return extended;
        };
    }
};

export default util;
