<template>
    <div :id="chartId" style="height: 100%; width: 100%;"></div>
</template>

<script>
import echarts from 'echarts';

let chartIdSeed = 1;
export default {
    name: 'radar-chart',
    props: {
        // 指示器数据，必传项
        // 格式举例 [{ name: 'a', max: 1},{ name: 'a', max: 1},{ name: 'a', max: 1}]
        indicator: {
            type: Array,
            default: () => []
        },
        // 图例数据，必填项。
        // 格式举例 [{ value: [5000, 14000, 28000], name: 'name' }，{ value: [5000, 14000, 28000], name: 'name' }]
        legendData: {
            type: Array,
            default: () => []
        },
    },
    data() {
        return {
            chartId: 1,
            option: {}, // 图表配置项
            myChart: '', // 图表实例
            // 默认配置项。以下配置项可以在父组件 :chartConfig 进行配置，会覆盖这里的默认配置
            defaultConfig: {
                labelFormat: '{value}', // 指示器名字显示格式，可传入回调函数
                splitNumber: 5, // 指示器轴的分割段数
                indicatorLineShow: true, // 坐标轴线和指示器轴的分割线显示
                // 坐标轴线和指示器轴的分割线颜色
                // 坐标轴线为数组中的最后一项颜色
                // 分隔线会按数组中颜色的顺序依次循环设置颜色。
                indicatorLineColor: ['#E4B667'],
                // splitAreaShow: true, // 指示器轴的分割层显示,
                splitAreaColor: ['#fff', '#FFEEBC'], // 分隔区域颜色。分隔区域会按数组中颜色的顺序依次循环设置颜色
                legendColor: '#DD7611', // 图例的颜色，包含折线拐点标志、线条和区域填充颜色
                legendWidth: 2.75,  // 数据区域的边线宽度
                tooltipShow: true, // 悬浮框显示
                tooltipFormat: '', // 悬浮框显示格式
                // 是否开启图例渐变色，如果开启，配置项中的 legendColor 属性需要传入两种颜色
                legendGradient: false,
                isUseMax: false, // 是否可配置指示器数据最大值限制
                maxScale: 1.2, // 指示器数据最大值的放大比例
            },
            finallyConfig: {}, // 最后配置项
            chartResizeTimer: null, // 定时器，用于resize事件函数节流
        };
    },
    mounted() {
        let vm = this;
        vm.chartId = 'radar-chart_' + chartIdSeed++;
        vm.finallyConfig = Object.assign({}, vm.defaultConfig, vm.$attrs.chartConfig);
        vm.initOption();
        vm.$nextTick(() => {
            vm.ready();
        });
    },
    watch: {
        legendData() {
            this.$nextTick(() => {
                this.updateChartData();
            });
        }
    },
    methods: {
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

        // 初始化图表配置
        initOption() {
            let vm = this;
            let option = {
                tooltip: {
                    show: vm.finallyConfig.tooltipShow,
                    formatter: vm.finallyConfig.tooltipFormat
                },
                radar: {
                    // 分隔区数量
                    splitNumber: vm.finallyConfig.splitNumber,
                    // 分隔区样式
                    splitArea: {
                        // show: vm.finallyConfig.splitAreaShow,
                        areaStyle: {
                            color: vm.finallyConfig.splitAreaColor
                        },
                    },
                    // 分隔线样式
                    splitLine: {
                        show: vm.finallyConfig.indicatorLineShow,
                        lineStyle: {
                            color: vm.finallyConfig.indicatorLineColor
                        },
                    },
                    // 轴线
                    axisLine: {
                        show: vm.finallyConfig.indicatorLineShow,
                        lineStyle: {
                            color: vm.finallyConfig.indicatorLineColor
                        },
                    },
                    // 标签名
                    name: {
                        formatter: vm.finallyConfig.labelFormat,
                        textStyle: {
                            color: 'black',
                            fontSize: '16',
                            fontWeight: 'bold'
                        }
                    },
                    nameGap: 6, // 指示器名称和指示器轴的距离。默认值15过大，改成 6px
                },
                series: [{
                    itemStyle: {
                        normal: {
                            color: vm.finallyConfig.legendColor,
                            borderWidth: 2,
                        }
                    },
                    lineStyle: {
                        normal: {
                            color: vm.finallyConfig.legendColor,
                            width: vm.finallyConfig.legendWidth
                        }
                    },
                    areaStyle: {
                        normal: {
                            color: vm.finallyConfig.legendColor,
                            opacity: 0.4,
                        }
                    },
                    type: 'radar',
                }]
            };

            // 是否开启图例渐变色，需要设置 4 个属性来生效
            if (vm.finallyConfig.legendGradient
                && vm.finallyConfig.legendColor instanceof Array
                && vm.finallyConfig.legendColor.length > 1) {
                option.series[0].areaStyle.normal.color = {
                    type: 'linear',
                    x: 0,
                    y: 0,
                    x2: 0,
                    y2: 1,
                    colorStops: [{
                        offset: 0, color: vm.finallyConfig.legendColor[0] // 0% 处的颜色
                    }, {
                        offset: 1, color: vm.finallyConfig.legendColor[1] // 100% 处的颜色
                    }],
                    global: false // 缺省为 false
                };
                option.series[0].areaStyle.normal.opacity = 1;
                option.series[0].itemStyle.normal.opacity = 0;
                option.series[0].lineStyle.normal.opacity = 0;
            }

            vm.option = option;
        },

        // 更新图表数据
        updateChartData() {
            let vm = this;
            // 得到指示器数据：如果未开启指示器数据最大值可配置，则直接返回父组件传入的值；
            // 否则最大值的取值根据legendData项筛选出一个最大值放大相应的倍数
            let config = vm.finallyConfig;
            if (!config.isUseMax) {
                vm.option.radar.indicator = vm.indicator;
            } else {
                let valArr = vm.legendData.reduce((item, current) => item.concat(current.value), []);
                let maxValue = Math.max(...valArr) * config.maxScale;
                vm.option.radar.indicator = vm.indicator.map(item => {
                    return {
                        name: item.name,
                        max: maxValue > 0 ? maxValue : 100
                    };
                });
            }
            // 得到图例数据
            vm.option.series[0].data = vm.legendData;

            vm.myChart && vm.myChart.setOption(vm.option);
        },

        // 处理窗口resize事件
        handleChartResize() {
            let vm = this;
            clearTimeout(vm.chartResizeTimer);
            vm.chartResizeTimer = setTimeout(function() {
                vm.myChart && vm.myChart.resize();
            }, 200);
        },
    },
    beforeDestroy() {
        // 释放该图例资源，较少页面卡顿情况
        if (this.myChart) this.myChart.dispose();
        // 移除窗口resize事件
        window.removeEventListener('resize', this.handleChartResize);
    }
};
</script>

<style scoped>

</style>
