<!--横向柱状图组件，带阴影-->
<template>
    <div :id="chartId" style="height:100%;width:100%;"></div>
</template>

<script>
import echarts from 'echarts';

let chartIdSeed = 1;
export default {
    name: 'shadow-bar-chart',
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
                tooltipShow: true, // 是否显示 tooltip
                ellipsis: true, // 是否开启图例内容超出显示省略号
                labelMaxLength: 8, // y轴左边名称轴-文字的最大显示长度，默认8
                colors: ['#0082e6'], // 柱状颜色数组。按数组中颜色的顺序依次循环设置颜色，颜色不足取数组第一项
                isGradient: false, // 是否开启渐变。如果开启，colors 需设置为包含两个颜色的数组
                tooltipPosition: '', // 参数为 'left'悬浮提示在鼠标的左侧、'right'悬浮提示在鼠标的右侧，默认自动调整
                animation: true, // 是否开启动画。注意：开启动画的情况下，导出的chartImg有问题，涉及到导出的图表需要设置成false

                barWidth: 12, // 柱条的宽度，默认12px。阴影柱条和系列柱条保持一致
                barBorderRadius: 0, // 圆角半径，单位px，支持传入数组分别指定 4 个圆角半径
                shadowColor: '#0d215c', // 阴影柱条的背景颜色
                shadowScale: 1.2, // 阴影比例，默认取数据的 最大值*1.2 组成一个阴影数组，应该要大于1
                shadowValue: 0, // 阴影的值，当需要固定阴影值的时候可以传入，比如：100
                noDataToFill: false, // 是否启用 当数据不足指定长度时使用“暂无数据”填充剩余柱条
                noDataFillLen: 5, // 使用“暂无数据”填充剩余柱条 的限制个数
                noDataText: '暂无数据', // 使用“暂无数据”填充剩余柱条 的文本，默认‘暂无数据’
                yAxisValueUnit: '', // y轴数据值的单位
                yAxisLabelOnTop: false, // 是否将y轴文本标签置于图形上方
                xAxisShow: false, // 是否显示x轴
                xAxis: {},  // x轴的相关配置
                yAxisLineLeft: {},  // y轴线的相关配置(左边轴)
                yAxisLabelLeft: {}, // y轴标签的相关配置(左边名称轴)，参考echarts。修改标签文本颜色、文本位置等配置
                yAxisLabelRight: {}, // y轴标签的相关配置(右边数值轴)，参考echarts。修改标签文本颜色、文本位置等配置
                tooltip: {}, // tooltip的相关配置。参考echarts官网
                grid: {}, // 网格区域的相关配置。参考echarts官网
            },
            finallyConfig: {}, // 最后配置项
            option: {}, // 图标配置项
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
        vm.chartId = 'shadow-bar-chart_' + chartIdSeed++;
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
            let option = {
                animation: cfg.animation,
                legend: {
                    show: false
                },
                tooltip: Object.assign({}, {
                    trigger: 'item',
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
                    },
                    // 设置tool显示格式
                    formatter: function (params) {
                        // 当开启渐变的时候 params.marker 的背景色变成了 [object Object]，需要手动替换
                        let marker = cfg.isGradient
                            ? params.marker.replace('[object Object]', params.color.colorStops[0].color)
                            : params.marker;
                        return marker + params.name + ': ' + params.value + cfg.yAxisValueUnit;
                    },
                }, cfg.tooltip),
                grid: Object.assign({}, {
                    left: '2%',
                    top: 10,
                    right: '2%',
                    bottom: -10,
                    containLabel: true,
                }, cfg.grid),
                xAxis: Object.assign({}, {
                    type: 'value',
                    show: cfg.xAxisShow,
                    axisTick: { show: false },
                    axisLabel: { show: false },
                    splitLine: { show: false },
                    xAxisLine: {
                        lineStyle: {
                            color: '#98A2B2'
                        }
                    },
                }, cfg.xAxis),
                yAxis: [
                    {
                        type: 'category',
                        inverse: true,
                        axisTick: {
                            show: false
                        },
                        axisLine: Object.assign({}, {
                            show: false
                        }, cfg.yAxisLineLeft),
                        axisLabel: Object.assign({}, {
                            show: true,
                            color: '#CBDBF4',
                            fontSize: 12,
                            formatter: function (val) {
                                // 设置yAxis标签内容超出显示省略号
                                if (cfg.ellipsis && val != null && val.length > cfg.labelMaxLength) {
                                    // 开启了尾部显示省略号
                                    val = val.substr(0, cfg.labelMaxLength) + '...';
                                }
                                return val;
                            },
                        }, cfg.yAxisLabelLeft),
                        data: [], // 动态设置
                    },
                    {
                        type: 'category',
                        inverse: true,
                        axisTick: {
                            show: false
                        },
                        axisLine: {
                            show: false
                        },
                        axisLabel: Object.assign({}, {
                            show: true,
                            color: '#CBDBF4',
                            fontSize: 12,
                            formatter: function (val) {
                                val = Number(val);
                                return val || val === 0 ? val + cfg.yAxisValueUnit : '-';
                            }
                        }, cfg.yAxisLabelRight),
                        data: [], // 动态设置
                    }
                ],
                color: cfg.colors,
                series: [
                    // 状图图阴影 shadow
                    {
                        type: 'bar',
                        silent: true, // 图形是否不响应和触发鼠标事件
                        barGap: '-100%',
                        barWidth: cfg.barWidth,
                        itemStyle: {
                            normal: {
                                color: cfg.shadowColor,
                                barBorderRadius: cfg.barBorderRadius,
                            }
                        },
                        data: [], // 动态设置
                        animation: false,
                    },
                    // 数据系列轴
                    {
                        type: 'bar',
                        name: '', // 设置系列名称
                        barMinHeight: 5,
                        barWidth: cfg.barWidth,
                        cursor: cfg.tooltipShow ? 'pointer' : 'default', // 鼠标悬浮时在图形元素上时鼠标样式
                        itemStyle: {
                            normal: {
                                color: function(params) {
                                    if (cfg.isGradient) {
                                        // 颜色渐变函数 前四个参数分别表示四个位置依次为左、下、右、上
                                        return new echarts.graphic.LinearGradient(1, 0, 0, 0, [{
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
                        data: [], // 动态设置
                    },
                ]
            };

            // 是否将y轴文本标签置于图形上方
            if (cfg.yAxisLabelOnTop) {
                option.grid = Object.assign({}, option.grid, {
                    bottom: 0,
                    containLabel: false,
                });

                option.yAxis[0].axisLabel = Object.assign({}, option.yAxis[0].axisLabel, {
                    margin: -10,
                    align: 'left',
                    verticalAlign: 'bottom',
                    padding: [8, 0, 8, 0],
                }, cfg.yAxisLabelLeft);

                option.yAxis[1].axisLabel = Object.assign({}, option.yAxis[1].axisLabel, {
                    margin: -20,
                    align: 'right',
                    verticalAlign: 'bottom',
                    padding: [8, 0, 8, 0],
                }, cfg.yAxisLabelRight);
            }

            vm.option = option;
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
            let data = vm.chartData;

            // 开启了 当数据不足指定长度时使用“暂无数据”填充剩余柱条
            if (cfg.noDataToFill) {
                let len = cfg.noDataFillLen - data.length;
                len = len < 0 ? 0 : len; // 当长度为负数时重置为0
                let itemsToBeFill = new Array(len).fill({
                    name: cfg.noDataText,
                    value: null,
                });
                data = data.concat(itemsToBeFill);
            }

            // y轴标签数据
            vm.option.yAxis[0].data = data.map(item => item.name);
            // y轴数值数据
            let values = data.map(item => item.value);
            vm.option.yAxis[1].data = values;
            // 阴影轴数据
            let maxValue = Math.max(...values);
            let shadowBarValue = data && data.length ? (cfg.shadowValue || maxValue * cfg.shadowScale) : 0;
            vm.option.xAxis.max = shadowBarValue; // 设置x轴-数值轴最大值，固定柱子的长度
            vm.option.series[0].data = new Array(data.length).fill(shadowBarValue);
            // 系列轴数据
            vm.option.series[1].data = data;

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
