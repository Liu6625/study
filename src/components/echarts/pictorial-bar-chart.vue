<!--象形柱状图组件-->
<template>
    <div :id="chartId" style="height:100%;width:100%;"></div>
</template>

<script>
import echarts from 'echarts';

let chartIdSeed = 1;
export default {
    name: 'pictorial-bar-chart',
    props: {
        // 图表数据
        // 格式举例：[{name: 'Mon', value: 120},{name: 'Tue', value: 200},{name: 'Wed', value: 150},]
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
        }
    },
    data() {
        return {
            // 默认配置项。以下配置项可以在父组件 :chartConfig 进行配置，会覆盖这里的默认配置
            defaultConfig: {
                tooltipShow: true, // 是否显示 toolTip
                tooltipPosition: '', // 设置为 'left':悬浮提示在鼠标左侧；'right':悬浮提示在鼠标右侧。常用于悬浮提示超出浏览器范围的情况
                ellipsis: true, // 是否开启图例内容超出显示省略号
                labelMaxLength: 6, // 图例文字的最大显示长度，默认6
                fontColor: '#333', // 文本颜色
                colors: ['#0082e6', '#15dbc6', '#37d066', '#cbc758', '#c48517'], // 柱状颜色数组。按数组中颜色的顺序依次循环设置颜色，颜色不足取数组第一项
                isGradient: false, // 是否开启渐变。如果开启，colors 需设置为包含两个颜色的数组
                animation: true, // 是否开启动画。注意：开启动画的情况下，导出的chartImg有问题，涉及到导出的图表需要设置成false
                yAxis: {}, // y轴的相关配置。参考echarts
                xAxis: {}, // x轴的相关配置。参考echarts
            },
            color: '#e54035',
            finallyConfig: {}, // 最后配置项
            option: {}, // 图表配置项
            myChart: '',
            chartId: 1,
            chartResizeTimer: null, // 定时器，用于resize事件函数节流
        };
    },
    watch: {
        chartData: function () {
            this.$nextTick(() => {
                this.updateChartData();
            });
        }
    },
    mounted: function () {
        let vm = this;
        // 图表id自增
        vm.chartId = 'pictorial-bar-chart_' + chartIdSeed++;
        vm.finallyConfig = Object.assign({}, vm.defaultConfig, vm.chartConfig);
        vm.initOption();

        vm.$nextTick(() => {
            vm.ready();
        });
    },
    methods: {
        // 初始化配置項
        initOption() {
            let vm = this;
            let cfg = vm.finallyConfig;
            vm.option = {
                animation: cfg.animation,
                tooltip: {
                    show: cfg.tooltipShow,
                    trigger: 'axis',
                    axisPointer: {
                        type: 'none'
                    },
                    // 设置tooltip悬浮位置
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
                    formatter: function (params) {
                        return params[0].name + ': ' + params[0].value;
                    },
                },
                grid: {
                    left: 0,
                    top: cfg.yAxis.name ? 35 : 15,
                    // right: '3%',
                    bottom: 10,
                    containLabel: true,
                },
                xAxis: Object.assign({}, {
                    data: [],
                    axisTick: { show: false },
                    axisLine: { show: false },
                    axisLabel: {
                        color: cfg.fontColor,
                        fontSize: 12,
                        formatter: function(val) {
                            if (cfg.ellipsis && val != null && val.length > cfg.labelMaxLength) {
                                // 开启了尾部显示省略号
                                val = val.substr(0, cfg.labelMaxLength) + '...';
                            }
                            return val;
                        },
                    }
                }, cfg.xAxis),
                yAxis: Object.assign({}, {
                    splitLine: { show: false },
                    axisTick: { show: false },
                    axisLine: { show: false },
                    axisLabel: { show: false },
                }, cfg.yAxis),
                series: [
                    {
                        type: 'pictorialBar',
                        barCategoryGap: '-130%',
                        // symbol: 'path://M0,10 L10,10 L5,0 L0,10 z', // 三角形
                        symbol: 'path://M0,10 L10,10 C5.5,10 5.5,5 5,0 C4.5,5 4.5,10 0,10 z',
                        cursor: cfg.tooltipShow ? 'pointer' : 'default', // 鼠标悬浮时在图形元素上时鼠标样式
                        barMinHeight: 10,
                        itemStyle: {
                            normal: {
                                opacity: 0.5,
                                color: function(params) {
                                    if (cfg.isGradient) {
                                        // 颜色渐变函数 前四个参数分别表示四个位置依次为左、下、右、上
                                        return new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
                                            offset: 0,
                                            color: cfg.colors[0]
                                        }, {
                                            offset: 1,
                                            color: cfg.colors[1]
                                        }]);
                                    }
                                    let i = params.dataIndex;
                                    return cfg.colors[i] || cfg.colors[0] || vm.color;
                                }
                            },
                            emphasis: {
                                opacity: 1
                            }
                        },
                        data: [],
                        z: 10,
                    },
                    {
                        type: 'pictorialBar',
                        barGap: '-100%',
                        symbolPosition: 'end',
                        symbolSize: 0, // 不显示标记
                        symbolOffset: [0, '-120%'],
                        label: {
                            normal: {
                                show: true,
                                position: 'top',
                                distance: 10,
                                color: cfg.fontColor,
                                fontSize: 14,
                                fontWeight: 700,
                            }
                        },
                        data: [],
                    }
                ],
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
        // 更新图表数据
        updateChartData() {
            let vm = this;
            // 得到x轴数据
            vm.option.xAxis.data = vm.chartData.map(item => item.name);
            // 得到系列数据
            vm.option.series[0].data = vm.chartData.map(item => item.value);
            vm.option.series[1].data = vm.chartData.map(item => item.value);

            vm.myChart && vm.myChart.setOption(vm.option);

            vm.getDataURL();
        },
        // 处理窗口resize事件
        handleChartResize() {
            let vm = this;
            clearTimeout(vm.chartResizeTimer);
            vm.chartResizeTimer = setTimeout(function() {
                vm.myChart && vm.myChart.resize();
            }, 200);
        },
        // 获取图片的base64
        getDataURL() {
            let imgSrc = this.myChart.getDataURL({
                backgroundColor: '#fff',
            });
            this.$emit('update:chartImg', imgSrc);
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
