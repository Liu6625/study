<!--堆叠竖向柱状图组件，多用于风险日历等-->
<template>
    <div :id="chartId" style="height:100%;width:100%;"></div>
</template>

<script>
import echarts from 'echarts';

let chartIdSeed = 1;
export default {
    name: 'stack-bar-chart',
    props: {
        // 图表数据
        // 格式举例：[{ xValue: '1', high: 100, middle: 150, low: 200 }, { xValue: '2', high: 80, middle: 120, low: 50 }]
        chartData: {
            type: Array,
            default: () => []
        },
        // 图表系列名称，格式举例：['高风险', '中风险', '低风险']
        seriesName: {
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
                colors: [], // 柱状颜色数组。按数组中颜色的顺序依次循环设置颜色，颜色不足取数组第一项
                isGradient: false, // 是否开启渐变。如果开启，colors 需设置为包含两个颜色的数组
                tooltipPosition: '', // 设置为 'left':悬浮提示在鼠标左侧；'right':悬浮提示在鼠标右侧。常用于悬浮提示超出浏览器范围的情况
                animation: true, // 是否开启动画。注意：开启动画的情况下，导出的chartImg有问题，涉及到导出的图表需要设置成false
                legend: {}, // 图例的相关配置。参考echarts
                grid: {}, // 网格区域的相关配置。参考echarts
                tooltip: { show: true }, // tooltip的相关配置。参考echarts
                yAxis: {}, // y轴的相关配置。参考echarts
                xAxis: {}, // x轴的相关配置。参考echarts
            },
            color: '#0082e6',
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
        vm.chartId = 'stack-bar-chart_' + chartIdSeed++;
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
                legend: Object.assign({}, {
                    show: true,
                    tooltip: {
                        show: true
                    },
                    itemGap: 26,
                    icon: 'rect', // 图例标记的图标类型
                    itemWidth: 30, // 图例标记的图标类型宽度
                    itemHeight: 6, // 图例标记的图标类型高度
                    bottom: 0,
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
                grid: Object.assign({}, {
                    left: '3%',
                    top: cfg.title || cfg.yAxis.name ? 35 : 15,
                    right: '3%',
                    bottom: 40,
                    containLabel: true
                }, cfg.grid),
                tooltip: Object.assign({}, {
                    trigger: 'axis',
                    axisPointer: {
                        type: 'shadow'
                    },
                    show: true,
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
                xAxis: Object.assign({}, {
                    type: 'category',
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
                            color: '#D0D9DF'
                        },
                    },
                    data: [],
                }, cfg.xAxis),
                yAxis: Object.assign({}, {
                    type: 'value',
                    axisTick: {
                        show: false, // 不显示y轴刻度
                    },
                    // name: '', // y轴单位
                    nameTextStyle: {
                        color: '#333'
                    },
                    axisLabel: {
                        color: '#333',
                    },
                    axisLine: {
                        lineStyle: {
                            color: '#D0D9DF'
                        },
                    },
                    splitLine: {
                        lineStyle: {
                            color: '#D0D9DF'
                        }
                    },
                }, cfg.yAxis),
                color: [vm.color],
                series: []
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
            let cfg = vm.finallyConfig;
            // 得到x轴数据
            vm.option.xAxis.data = vm.chartData.map(item => item.xValue);

            let seriesKeys = Object.keys(vm.chartData[0]).filter(key => key !== 'xValue');
            let series = [
                // For shadow
                // {
                //     type: 'bar',
                //     itemStyle: {
                //         normal: { color: '#ddd' }
                //     },
                //     barGap: '-100%',
                //     barMaxWidth: 24,
                //     data: [650,650,650],
                //     // data: [],
                //     animation: false
                // },
            ];
            for (let i = 0; i < seriesKeys.length; i++) {
                let obj = {
                    name: vm.seriesName[i] || seriesKeys[i],
                    type: 'bar',
                    stack: 'myStack',
                    barCategoryGap: '25%',
                    barMinHeight: 5,
                    barMaxWidth: 24,
                    cursor: cfg.tooltip.show ? 'pointer' : 'default', // 鼠标悬浮时在图形元素上时鼠标样式
                    itemStyle: {
                        normal: {
                            color: cfg.colors[i] || cfg.colors[0] || vm.color,
                        }
                    },
                    data: vm.chartData.map(item => item[seriesKeys[i]]),
                };
                series.push(obj);
            }
            // 得到系列数据
            vm.option.series = series;

            // 得到图例数据
            vm.option.legend.data = vm.seriesName.length > 0 ? vm.seriesName : seriesKeys;

            // vm.option.yAxis.max = 650;

            vm.myChart && vm.myChart.setOption(vm.option);

            vm.getDataURL();
        },
        // 处理窗口resize事件
        handleChartResize() {
            let vm = this;
            clearTimeout(vm.chartResizeTimer);
            vm.chartResizeTimer = setTimeout(function() {
                // echart图表本身是提供了一个resize的函数的,用于当div发生resize事件的时候，让其触发echart的resize事件，重绘canvas
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
