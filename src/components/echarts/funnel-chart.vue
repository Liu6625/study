<template>
    <div :id="chartId" style="height: 100%; width: 100%;"></div>
</template>

<script>
import echarts from 'echarts';

let chartIdSeed = 1;
export default {
    name: 'funnel-chart',
    props: {
        // 图表的数据，必传项
        // 格式举例 [{value: 0, name: 'a'},{value: 0, name: 'a'},{value: 0, name: 'a'}]
        chartData: {
            type: Array,
            default: () => []
        }
    },
    data() {
        return {
            chartId: 1,
            option: {}, // 图表配置项
            myChart: '', // 图表实例
            // 默认配置项。以下配置项可以在父组件 :chartConfig 进行配置，会覆盖这里的默认配置
            defaultConfig: {
                color: ['#2595F3', '#298FC0', '#43AAA2', '#EEB93F', '#E1823D'], // 图表的颜色，值的顺序与 chartData 对应
                labelShow: true, // 标签是否显示
                labelFormat: '{b}：{c}', // 标签显示格式
                labelLineShow: false, // 标签引线是否显示
                tooltipShow: true, // 鼠标悬浮提示显示
                tooltipFormatter: '{b}：{c} ({d}%)', // 鼠标悬浮提示显示格式，可选字符串模板或回调函数
            },
            finallyConfig: {}, // 最后配置项
            chartResizeTimer: null, // 定时器，用于resize事件函数节流
        };
    },
    mounted() {
        let vm = this;
        // 图表id自增
        vm.chartId = 'funnel-chart_' + chartIdSeed++;
        vm.finallyConfig = Object.assign({}, vm.defaultConfig, vm.$attrs.chartConfig);
        vm.initOption();
        vm.$nextTick(() => {
            vm.ready();
        });
    },
    watch: {
        chartData() {
            this.$nextTick(() => {
                this.updateChartData();
            });
        }
    },
    methods: {
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

        // 初始化图表配置
        initOption() {
            let vm = this;
            vm.option = {
                tooltip: {
                    show: vm.finallyConfig.tooltipShow,
                    trigger: 'item',
                    formatter: vm.finallyConfig.tooltipFormatter
                },
                color: vm.finallyConfig.color,
                series: [
                    {
                        type: 'funnel',
                        left: '10%',
                        top: 30,
                        bottom: 30,
                        width: '70%',
                        minSize: '0%',
                        maxSize: '100%',
                        sort: 'descending',
                        gap: 5,
                        label: {
                            normal: {
                                show: vm.finallyConfig.labelShow,
                                position: 'right',
                                formatter: vm.finallyConfig.labelFormat,
                            }
                        },
                        labelLine: {
                            normal: {
                                show: vm.finallyConfig.labelLineShow
                            }
                        },
                        itemStyle: {
                            normal: {
                                borderWidth: 0,
                                shadowBlur: 30,
                                shadowOffsetX: 0,
                                shadowOffsetY: 10,
                                shadowColor: 'rgba(0, 0, 0, 0.5)'
                            }
                        },
                        data: vm.chartData
                    }
                ]
            };
        },

        // 更新图表数据
        updateChartData() {
            let vm = this;

            // 得到图例数据
            vm.option.series[0].data = vm.chartData;

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
