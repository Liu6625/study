<!--折线图组件（可以配置成 折线图、曲线图、单线条、多线条、实时刷新图表，具体参考 defaultConfig ）-->
<template>
    <div :id="chartId" style="height:100%;width:100%;"></div>
</template>

<script>
import echarts from 'echarts';

let chartIdSeed = 1;
export default {
    name: 'line-chart',
    props: {
        /* 图表数据，格式举例： yValue->y轴的值， xValue->x轴的值
        历史数据图表格式：得到所有数据，key值就是图例的值，key的数量表示线条数量，xValue组成的数组就是x轴数据
        chartData: [
            {
                name: '邮件营销',
                list: [
                    { yValue: 120, xValue: '周一' },
                    { yValue: 132, xValue: '周二' },
                    { yValue: 101, xValue: '周三' },
                ],
            },
            {
                name: '联盟广告',
                list: [
                    { yValue: 30, xValue: '周一' },
                    { yValue: 80, xValue: '周二' },
                    { yValue: 70, xValue: '周三' },
                ],
            },
        ]
        实时数据图表格式：一次只传一个点的数据，key的数量表示线条数量，x轴数据默认取当前时间
        chartData: [
            {
                name: '邮件营销',
                list: [{ yValue: 120 }],
            },
            {
                name: '联盟广告',
                list: [{ yValue: 30 }],
            },
            {
                name: '视频广告',
                list: [{ yValue: 50 }],
            },
        ], */
        chartData: {
            type: Array,
            default: () => []
        },
        // 图表配置项
        chartConfig: {
            type: Object,
            default: () => {}
        },
        // 图表图片的base64
        chartImg: {
            type: String,
            default: ''
        },
    },
    data() {
        return {
            // 默认配置项。以下配置项可以在父组件 :chartConfig 进行配置，会覆盖这里的默认配置
            defaultConfig: {
                isRealTime: false, // 是否为实时刷新。如果为true，xAxis.data 取的是当前时间
                keepNodes: 30, // 实时刷新时，最多保留的节点数
                tooltipPosition: '', // 设置为 'left':悬浮提示在鼠标左侧；'right':悬浮提示在鼠标右侧。常用于悬浮提示超出浏览器范围的情况
                ellipsis: true, // 是否开启图例内容超出显示省略号
                // 颜色数组。按数组中颜色的顺序依次循环设置颜色，颜色不足取数组第一项
                colors: ['#369EFF', '#25D7C4', '#F0C417', '#4D6DF0', '#8D43F4', '#06C9EC', '#C858AC', '#F15C75', '#D9E016'],
                isAreaStyle: false, // 是否开启区域颜色设置。当只有一条线时，则取 colors 设置渐变色
                seriesSmooth: false, // 默认为折线图，改为 true:平滑曲线图
                symbolLight: [], // 线条标记点高亮的配置，如：[{name: 'safetyScore', index: 10},...] series.name 和 series.data的index
                seriesZReverse: false, // 是否将图形的前后顺序 倒序。默认正序，是根据 series 的顺序依次绘制，层级由低到高。
                legend: {}, // 图例的相关配置。参考echarts
                legendIcons: [], // 图例图标的配置，当需要设置每条线的图标都不一样时传入
                tooltip: {}, // tooltip的相关配置。参考echarts
                grid: {}, // 网格区域的相关配置。参考echarts
                yAxis: {}, // y轴的相关配置。参考echarts
                xAxis: {}, // x轴的相关配置。参考echarts
                series: {}, // 折线系列列表配置 Array|Object 。参考echarts。可以设置成Array类型的配置，各项分别对应各条线的配置
                dataZoomShow: false, // 是否显示滑动条
                dataZoomSlider: {}, // 滑动条型数据区域缩放组件配置，需要配合 dataZoomShow: true 来使用
                animation: true, // 是否开启动画。注意：开启动画的情况下，导出的chartImg有问题，涉及到导出的图表需要设置成false
            },
            finallyConfig: {}, // 最后配置项
            option: {}, // 图表配置项
            myChart: '',
            chartId: 1,
            chartResizeTimer: null, // 定时器，用于resize事件函数节流
        };
    },
    watch: {
        chartData() {
            let vm = this;
            vm.$nextTick(() => {
                // 数据更新之后，重新更新 finallyConfig 的值（为了让 chartConfig 可以在父组件动态配置|异步回调配置）
                vm.finallyConfig = Object.assign({}, vm.defaultConfig, vm.chartConfig);
                vm.updateChartData();
            });
        }
    },
    mounted() {
        let vm = this;
        vm.chartId = 'line-chart_' + chartIdSeed++;    // 图表id自增
        vm.finallyConfig = Object.assign({}, vm.defaultConfig, vm.chartConfig);
        vm.initOption();
        vm.$nextTick(() => {
            vm.ready();
        });
    },
    // 此钩子函数，防止在 keep-alive 的页面，切换菜单页面时图表缩在一个角落
    activated() {
        this.resizeChart();
    },
    methods: {
        // 初始化配置項
        initOption() {
            let vm = this;
            let cfg = vm.finallyConfig;
            vm.option = {
                // title: {
                //     text: cfg.title,
                //     textStyle: {
                //         color: '#333',
                //         fontSize: 14,
                //         fontWeight: 'bold',
                //     },
                //     left: 'center', // 可以是number/string，也可以是 'left', 'center', 'right'。
                // },
                animation: cfg.animation,
                legend: Object.assign({}, {
                    show: true,
                    tooltip: {
                        show: true
                    },
                    itemGap: 26,
                    icon: 'rect', // 图例标记的图标类型
                    itemWidth: 30, // 图例标记的图标类型宽度
                    itemHeight: 6, // 图例标记的图标类型高度
                    // bottom: 0,
                    padding: 5,
                    type: 'scroll',
                    width: '90%',
                    textStyle: {
                        color: '#333',
                        fontSize: 14,
                        fontWeight: 700,
                        padding: [5, 0, 3, 0], // 图例文字块的内边距。为解决中文、英文部分文字被遮挡的问题，设置上下内边距
                    },
                    formatter: function (val) {
                        // 图例文本超长时，显示省略号
                        if (cfg.ellipsis && val != null && val.length > 16) {
                            val = val.substr(0, 16) + '...';
                        }
                        return val;
                    },
                    data: [],
                }, cfg.legend),
                tooltip: Object.assign({}, {
                    trigger: 'axis',
                    show: true,
                    // 设置tooltip悬浮位置。根据 tooltipPosition 来设置
                    position: (pos, params, dom, rect, size) => {
                        if (cfg.tooltipPosition === 'right') {
                            // 悬浮提示在鼠标的右侧
                            return { left: pos[0] + 20, top: pos[1] };
                        } else if (cfg.tooltipPosition === 'left') {
                            // 悬浮提示在鼠标的左侧
                            return { right: size.viewSize[0] - pos[0] + 10, top: pos[1] };
                        }
                        return null;
                    },
                }, cfg.tooltip),
                grid: Object.assign({}, {
                    top: 45,
                    left: 80,
                    right: 60,
                    bottom: 60,
                }, cfg.grid),
                xAxis: Object.assign({}, {
                    type: 'category',
                    // name: '', // x轴单位名称
                    nameTextStyle: {
                        color: '#333'
                    },
                    boundaryGap: false,
                    // axisTick: {
                    //     show: false, // 不显示x轴刻度。先注释掉，默认显示
                    // },
                    axisLabel: {
                        margin: 12,
                        color: '#333'
                    },
                    axisLine: {
                        lineStyle: {
                            color: '#D0D9DF'
                        }
                    },
                    data: [],
                }, cfg.xAxis),
                yAxis: Object.assign({}, {
                    type: 'value',
                    // name: '', // y轴单位
                    scale: true,  // y轴开始位置不强制显示0
                    nameTextStyle: {
                        color: '#333'
                    },
                    axisTick: {
                        show: false, // 不显示y轴刻度
                    },
                    axisLabel: {
                        margin: 12,
                        color: '#333'
                    },
                    axisLine: {
                        lineStyle: {
                            color: '#D0D9DF'
                        }
                    },
                    splitLine: {
                        lineStyle: {
                            color: '#D0D9DF'
                        }
                    },
                }, cfg.yAxis),
                // dataZoom 组件 用于区域缩放
                dataZoom: cfg.dataZoomShow ? [
                    {
                        type: 'inside',
                    },
                    Object.assign({}, {
                        type: 'slider',
                        height: 20,
                        bottom: 5,
                    }, cfg.dataZoomSlider),
                ] : [],
                color: cfg.colors,
                series: [],
            };
        },
        // 初始化图表
        ready() {
            let vm = this;
            let dom = document.getElementById(vm.chartId);
            if (!dom) return false;
            vm.myChart = echarts.init(dom);

            // 添加窗口resize事件
            window.addEventListener('resize', vm.handleChartResize);

            // 触发父组件的 @chartClick 事件
            vm.myChart.on('click', function(param) {
                vm.$emit('chartClick', param);
            });

            vm.updateChartData();
        },
        // 处理窗口resize事件
        handleChartResize() {
            let vm = this;
            clearTimeout(vm.chartResizeTimer);
            vm.chartResizeTimer = setTimeout(function() {
                vm.myChart && vm.myChart.resize();
            }, 200);
        },
        // 重绘图表
        resizeChart() {
            this.myChart && this.myChart.resize();
        },
        // 更新图表数据
        updateChartData() {
            let vm = this;
            let cfg = vm.finallyConfig;
            let chartData = vm.chartData;
            let linesTotal = chartData.length; // 图表线条数量
            if (linesTotal === 0) return false;
            let dataKeys = chartData.map(item => item.name); // 图例名称数组

            // 得到legend图例数据
            vm.option.legend.data = cfg.legendIcons && cfg.legendIcons.length
                ? dataKeys.map((name, i) => ({ name: name, icon: cfg.legendIcons[i] || 'rect' }))
                : dataKeys;

            // 设置每条线的配置样式，并处理得到每条线的数据
            let series = [];
            let seriesCfgIsArr = Array.isArray(cfg.series);
            for (let i = 0; i < linesTotal; i++) {
                let obj = Object.assign({}, {
                    name: dataKeys[i],
                    type: 'line',
                    smooth: cfg.seriesSmooth,
                    data: chartData[i].list.map(item => item.yValue),
                    z: cfg.seriesZReverse ? linesTotal - i : i + 1,
                }, seriesCfgIsArr ? (cfg.series[i] || {}) : cfg.series);

                // 设置图形标记高亮
                let symbol = cfg.symbolLight.find(item => item.name === dataKeys[i]);
                if (symbol) {
                    let value = obj.data[symbol.index];
                    if (value || value === 0) {
                        obj.showAllSymbol = true; // 如果设置了图形高亮，则显示所有图形
                        obj.data[symbol.index] = {
                            value: value,
                            symbolSize: 12,
                            symbol: 'circle',
                            itemStyle: {
                                normal: {
                                    borderColor: vm.hexToRgba(cfg.colors[i], 0.55),
                                    borderWidth: 12,
                                }
                            }
                        };
                    }
                }

                // 设置 areaStyle 区域颜色
                if (cfg.isAreaStyle) {
                    // 定义一个变量存储当前obj.data是否全为null，为了处理 y轴数据全为null时，处理渐变的函数报错
                    let isDataEmpty = obj.data.every(value => value === null);
                    // 默认在 只有一条线时，并且y轴数据不全为null时 开启渐变色
                    let color = linesTotal === 1 && !isDataEmpty ?
                        new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
                            offset: 0,
                            color: cfg.colors[0]
                        }, {
                            offset: 1,
                            color: cfg.colors[1] || cfg.colors[0]
                        }])
                        : cfg.colors[i];
                    // isDataEmpty 为 true时，再取渐变配置obj.areaStyle，则会报错
                    obj.areaStyle = Object.assign({}, {
                        normal: {
                            opacity: 0.5,
                            color: color,
                        }
                    }, isDataEmpty ? {} : obj.areaStyle);
                }

                series.push(obj);
            }

            // 实时刷新和历史数据图表需要做不同处理
            if (cfg.isRealTime) {
                let curOption = vm.myChart.getOption();
                // 保存一个变量用来存储x轴数据
                let xAxisData = vm.option.xAxis.data;
                // 数据超过一定长度时，截断第一位
                if (xAxisData.length > cfg.keepNodes) {
                    xAxisData.shift();
                    for (let i = 0; i < linesTotal; i++) {
                        curOption.series[i].data.shift();
                    }
                }
                // 把当前时间作为x轴数据，如：11:58:32
                xAxisData.push(new Date().toTimeString().substr(0, 8));
                if (curOption) {
                    // 当 curOption 存在（即非第一次加载图表），就取 历史数据拼接上当前点的数据 赋值给 vm.option.series
                    for (let i = 0; i < linesTotal; i++) {
                        vm.option.series[i].data = curOption.series[i].data.concat(series[i].data);
                    }
                } else {
                    // 当 curOption 没有值（即第一次加载图表），就取已经处理好的 series 赋值给 vm.option.series
                    vm.option.series = series;
                }
            } else {
                // 历史数据的图表，直接遍历 chartData 的第一项数据的 xValue 属性，作为x轴数据
                vm.option.xAxis.data = chartData[0].list.map(item => item.xValue);
                // 直接取已经处理好的 series 赋值给 vm.option.series
                vm.option.series = series;
            }

            // chart.setOption(option, notMerge, lazyUpdate);  需要将notMerge设置成true，即不合并数据
            vm.myChart && vm.myChart.setOption(vm.option, true);

            // 如果是查看历史数据的图表（非实时刷新），才去获取图片URL
            !cfg.isRealTime && vm.getDataURL();
        },
        // 获取图片的base64
        getDataURL() {
            let imgSrc = this.myChart.getDataURL({
                backgroundColor: '#fff',
            });
            this.$emit('update:chartImg', imgSrc);
        },

        /**
         * hex16进制颜色转rgb(rgba)
         * @param hex {String}      例如: '#AD5CC4'
         * @param opacity {Number}  例如: 0.5
         * @returns {String}        例如: 'rgba(173,92,196,0.5)'
         */
        hexToRgba(hex, opacity = 1) {
            if (!hex) return '#fff';
            let sli = (start, end) => parseInt(hex.slice(start, end), 16);
            return 'rgba(' + sli(1, 3) + ',' + sli(3, 5) + ',' + sli(5, 7) + ',' + opacity + ')';
        },
    },
    beforeDestroy: function () {
        // 释放该图例资源，较少页面卡顿情况
        if (this.myChart) this.myChart.dispose();
        // 移除窗口resize事件
        window.removeEventListener('resize', this.handleChartResize);
    },
};
</script>

<style scoped>

</style>
