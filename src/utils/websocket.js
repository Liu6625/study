const config = require('../../../../config');

let baseURLArr = config.dev.proxyTable['/api'].target.split('//');
let baseURL = (baseURLArr[0] === 'http:' ? 'ws://' : 'wss://') + baseURLArr[1];

// 生产环境替换协议和端口号
if (process.env.NODE_ENV === 'production') {
    let base = location.protocol === 'http:' ? 'ws://' : 'wss://';
    let basePort = location.protocol === 'http:' ? ':8080' : ':8443';
    baseURL = base + location.hostname + basePort;
}

class CreateWebSocket {
    constructor() {
        this.url = baseURL + '/websocket';
        this.webSocket = new WebSocket(this.url);
    }
    // 打开websocket
    open(fn) {
        this.webSocket.onopen = () => {
            console.log('webSocket连接成功');
            typeof fn === 'function' && fn.call(this, this.webSocket.readyState);
        };
    }
    // 接收数据
    message(fn) {
        if (typeof fn !== 'function') {
            return;
        }

        this.webSocket.onmessage = (e) => {
            fn.call(this, JSON.parse(e.data), e);
        };
    }
    // websocket发送信号
    send(data) {
        data = typeof data === 'object' ? JSON.stringify(data) : data;

        if (this.webSocket.readyState === this.webSocket.OPEN) {
            this.webSocket.send(data);
        }
        else if (this.webSocket.readyState === this.webSocket.CLOSED) {
            this.webSocket = new WebSocket(this.url);
            setTimeout(() => {
                this.send(data);
            }, 1000);
        }
    }
    // 关闭websocket
    close(fn) {
        typeof fn === 'function' && fn.call(this, this.webSocket.readyState);
        this.webSocket.close();
    }
}

export default CreateWebSocket;
