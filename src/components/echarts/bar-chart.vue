<!--竖向柱状图组件-->
<template>
    <div :id="chartId" style="height:100%;width:100%;"></div>
</template>

<script>
import echarts from 'echarts';

let chartIdSeed = 1;
export default {
    name: 'bar-chart',
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
                title: '', // 图表的标题
                tooltipShow: true, // 是否显示 tooltip
                ellipsis: true, // 是否开启图例内容超出显示省略号
                labelMaxLength: 6, // 图例文字的最大显示长度，默认6
                colors: ['#0082e6'], // 柱状颜色数组。按数组中颜色的顺序依次循环设置颜色，颜色不足取数组第一项
                isGradient: false, // 是否开启渐变。如果开启，colors 需设置为包含两个颜色的数组
                tooltipPosition: '', // 设置为 'left':悬浮提示在鼠标左侧；'right':悬浮提示在鼠标右侧。常用于悬浮提示超出浏览器范围的情况
                animation: true, // 是否开启动画。注意：开启动画的情况下，导出的chartImg有问题，涉及到导出的图表需要设置成false
                barBorderRadius: 0, // 柱子的圆角半径，单位px，传入数组分别指定4个圆角半径，数组第一个元素为左上角 [15,15,0,0]
                grid: {}, // 网格区域的相关配置,参考echarts
                yAxis: {}, // y轴的相关配置，参考echarts
                xAxis: {}, // x轴的相关配置，参考echarts
                tooltip: {}, // tooltip的相关配置，参考echarts
                series: {}, // 柱状图的series配置项，参考echarts官网
            },
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
        vm.chartId = 'bar-chart_' + chartIdSeed++;
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
                title: {
                    text: cfg.title,
                    textStyle: {
                        color: '#333',
                        fontSize: 14,
                        fontWeight: 'bold',
                    },
                    left: 'center', // 可以是number/string，也可以是 'left', 'center', 'right'。
                },
                legend: {
                    show: false
                },
                tooltip: Object.assign({}, {
                    trigger: 'axis',
                    axisPointer: {
                        type: 'shadow'
                    },
                    show: cfg.tooltipShow,
                    // 设置tool悬浮位置
                    position: (pos, params, dom, rect, size) => {
                        if (cfg.tooltipPosition === 'right') {
                            // 悬浮提示在鼠标的右侧
                            return { left: pos[0] + 20, top: pos[1] };
                        } else if (cfg.tooltipPosition === 'left') {
                            // 悬浮提示在鼠标的左侧
                            return { right: size.viewSize[0] - pos[0] + 10, top: pos[1] };
                        }
                        return null;
                    }
                }, cfg.tooltip),
                grid: Object.assign({}, {
                    left: '3%',
                    top: cfg.title || cfg.yAxis.name ? 50 : 25,
                    right: '3%',
                    bottom: 0,
                    containLabel: true
                }, cfg.grid),
                xAxis: vm.$deepExtend({
                    type: 'category',
                    name: '', // x轴单位
                    nameGap: 6,
                    nameTextStyle: {
                        color: '#333'
                    },
                    axisTick: {
                        show: false, // 不显示x轴刻度
                    },
                    axisLabel: {
                        color: '#333',
                        formatter: function(val) {
                            if (cfg.ellipsis && val != null && val.length > cfg.labelMaxLength) {
                                // 开启了尾部显示省略号
                                val = val.substr(0, cfg.labelMaxLength) + '...';
                            }
                            return val;
                        },
                    },
                    axisLine: {
                        lineStyle: {
                            color: '#98A2B2'
                        },
                    },
                    data: [],
                }, cfg.xAxis),
                yAxis: Object.assign({}, {
                    type: 'value',
                    name: '', // y轴单位
                    nameTextStyle: {
                        color: '#333'
                    },
                    axisTick: {
                        show: false, // 不显示y轴刻度
                    },
                    axisLabel: {
                        color: '#333',
                    },
                    axisLine: {
                        lineStyle: {
                            color: '#98A2B2'
                        },
                    },
                    splitLine: {
                        lineStyle: {
                            color: '#D0D9DF'
                        }
                    },
                }, cfg.yAxis),
                color: cfg.colors,
                series: [
                    Object.assign({}, {
                        type: 'bar',
                        barMinHeight: 5,
                        barMaxWidth: 30,
                        cursor: cfg.tooltipShow ? 'pointer' : 'default', // 鼠标悬浮时在图形元素上时鼠标样式
                        label: {
                            normal: {
                                show: true,
                                position: 'top',
                                distance: 2,
                                color: '#333',
                                fontSize: 14,
                                fontWeight: 700,
                            },
                        },
                        itemStyle: {
                            normal: {
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
                                    return cfg.colors[i] || cfg.colors[0];
                                },
                                barBorderRadius: cfg.barBorderRadius,
                            }
                        },
                        data: [],
                    }, cfg.series)
                ]
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
