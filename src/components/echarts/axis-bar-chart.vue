<!--数据横向分布柱状图组件-->
<template>
    <div :id="chartId" style="height:100%;width:100%;"></div>
</template>

<script>
import echarts from 'echarts';

let chartIdSeed = 1;
export default {
    name: 'axis-bar-chart',
    props: {
        // 图表数据
        // 格式举例：
        /* {
           xAxisData: ['集群1', '集群2', '集群3'],
           data: [
                {name: '高危数',value: [1, 5, 9]},
                {name: '中危数',value: [2, 4, 6]},
                {name: '低危数',value: [3, 6, 2]}
           ]
        }
        * xAxisData : x轴上的文本数组
        * name：图例的数据
        * */
        chartData: {
            type: Object,
            default: () => {}
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
            // 渐变颜色 colors: [['#0E1E59', '#FF5857'],['#0E1E59', '#FF821C'],['#0E1E59', '#0089EF'],],
            defaultConfig: {
                tooltipShow: true, // 是否显示 tooltip
                legendShow: true, // 是否显示图例legend
                ellipsis: true, // 是否开启文本内容超出显示省略号
                labelMaxLength: 10, // 名称轴-文字的最大显示长度，默认8
                colors: ['#FF5857', '#FF821C', '#037CD7'], // 基本颜色数组。按数组中颜色的顺序依次循环设置颜色，颜色不足取数组第一项
                isGradient: false, // 是否开启渐变。如果开启，colors 需设置为包含两个颜色的数组
                tooltipPosition: '', // 参数为 'left'悬浮提示在鼠标的左侧、'right'悬浮提示在鼠标的右侧，默认自动调整
                animation: true, // 是否开启动画。注意：开启动画的情况下，导出的chartImg有问题，涉及到导出的图表需要设置成false
                barWidth: 4, // 柱条的宽度，默认12px。阴影柱条和系列柱条保持一致
                barGap: 5, // 柱条间的距离
                yAxisValueUnit: '', // y轴数据值的单位
                tooltip: {}, // tooltip的相关配置。参考echarts官网
                legend: {}, // 图例的相关配置
                grid: {}, // 网格区域的相关配置。参考echarts官网
                yAxis: {}, // y轴的相关配置。参考echarts官网
                xAxis: {}, // x轴的相关配置。参考echarts官网
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
            let vm = this;
            vm.$nextTick(() => {
                // 数据更新之后，重新更新 finallyConfig 的值（为了让 chartConfig 可以在父组件动态配置|异步回调配置）
                vm.finallyConfig = Object.assign({}, vm.defaultConfig, vm.chartConfig);
                vm.updateChartData();
            });
        }
    },
    mounted: function () {
        let vm = this;
        // 图表id自增，这样可以保证在同一页面中引用同一个组件，生成多个图表时，id不会冲突
        vm.chartId = 'axis-bar-chart_' + chartIdSeed++;
        vm.finallyConfig = Object.assign({}, vm.defaultConfig, vm.chartConfig);
        vm.initOption();     // 初始化配置项
        vm.$nextTick(() => {
            vm.ready();
        });
    },
    methods: {
        // 初始化配置項
        initOption() {
            let vm = this;
            let cfg = vm.finallyConfig;
            let options =  {
                animation: cfg.animation,
                color: cfg.colors,
                legend: Object.assign({}, {
                    show: cfg.legendShow,
                    itemWidth: 8,
                    itemHeight: 8,
                    itemGap: 45,
                    top: 16,
                    textStyle: {
                        color: '#CBDCF4',
                    },
                }, cfg.legend),
                tooltip: Object.assign({}, {
                    trigger: 'axis',
                    show: cfg.tooltipShow,
                    axisPointer: {
                        type: 'shadow'
                    },
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
                    },
                    // 设置tool显示格式
                    formatter: function (params) {
                        let data = params[0].name + '<br/>';
                        params.forEach((item, index) => {
                            // 当开启渐变的时候 params.marker 的背景色变成了 [object Object]，需要手动替换
                            let marker = cfg.isGradient ?
                                item.marker.replace('[object Object]', item.color.colorStops[0].color)
                                : item.marker;
                            data += marker + item.seriesName + ': ' + item.value + cfg.yAxisValueUnit + '<br/>';
                        });
                        return data;
                    },
                }, cfg.tooltip),
                grid: Object.assign({}, {
                    left: 10,
                    top: 50,
                    right: 10,
                    bottom: 40,
                }, cfg.grid),
                xAxis: Object.assign({}, {
                    type: 'category',
                    axisTick: {
                        show: false, // 不显示x轴刻度
                    },
                    axisLabel: {
                        color: '#00FFFF',
                        fontSize: 16,
                        padding: 4,
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
                            color: '#0E7774',
                            type: 'dashed',
                        },
                    },
                    data: [],
                }, cfg.xAxis),
                yAxis: Object.assign({}, {
                    type: 'value',
                    axisTick: {
                        show: false, // 不显示y轴刻度
                    },
                    axisLabel: {
                        show: true,
                        color: '#CBDCF4',
                        fontSize: 14,
                        formatter: function (value, index) {
                            if (value >= 10000 && value < 10000000) {
                                value = value / 10000 + 'w';
                            } else if (value >= 10000000) {
                                value = value / 10000000 + 'kw';
                            }
                            return value;
                        }
                    },
                    axisLine: {
                        show: false,
                    },
                    splitLine: {
                        show: true,
                        lineStyle: {
                            color: '#0E7774',
                            type: 'dashed',
                        },
                    },
                }, cfg.yAxis),
                series: [],
            };
            vm.option = options;
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

            vm.option.xAxis.data = vm.chartData.xAxisData; // x轴数据
            vm.option.legend.data = vm.chartData.data.map(item => item.name); // legend数据

            // series样式与数据设置
            let seriesData = vm.chartData.data.map((item, index) => ({
                type: 'bar',
                name: item.name,
                data: item.value,
                barWidth: cfg.barWidth,
                barGap: cfg.barGap,
                itemStyle: {
                    normal: {
                        color: function(params) {
                            if (cfg.isGradient) {
                                // 颜色渐变函数 前四个参数分别表示四个位置依次为左、下、右、上
                                return new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
                                    offset: 0,
                                    color: cfg.colors[index][0]
                                }, {
                                    offset: 1,
                                    color: cfg.colors[index][1]
                                }]);
                            }
                            return cfg.colors[index] || cfg.colors[0];
                        }
                    }
                },
                label: {
                    normal: {
                        show: true,
                        position: 'top',
                        distance: 0,
                        formatter: function (option) {
                            return '{cri|}';
                        },
                        rich: {
                            cri: {
                                width: 10,
                                height: 10,
                                backgroundColor: cfg.isGradient ? cfg.colors[index][0] : cfg.colors[index],
                                borderRadius: 50,
                                align: 'center',
                            },
                        },
                    },
                },
            }));
            vm.option.series = seriesData;
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
