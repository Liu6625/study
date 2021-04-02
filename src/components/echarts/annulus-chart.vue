<!--多层环状图组件，使用饼状图实现-->
<template>
    <div :id="chartId" style="height:100%;width:100%;"></div>
</template>

<script>
import echarts from 'echarts';

let chartIdSeed = 1;
export default {
    name: 'annulus-chart',
    props: {
        // 图表数据，value的范围在0-100之间，表示百分比
        value: {
            type: Number,
            default: 0
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
                color: '#E45820', // 主题色，16进制的颜色
                borderColor: '#0051B2', // 圆环边框颜色
                title: {}, // title的配置项，用于显示百分比。参考echarts官网
            },
            finallyConfig: {}, // 最后配置项
            option: {}, // 图标配置项
            myChart: '',
            chartId: 1,
            chartResizeTimer: null, // 定时器，用于resize事件函数节流
        };
    },
    watch: {
        value: function () {
            this.$nextTick(() => {
                this.updateChartData();
            });
        }
    },
    mounted: function () {
        let vm = this;
        // 图表id自增
        vm.chartId = 'annulus-chart_' + chartIdSeed++;
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
                title: Object.assign({}, {
                    show: false,
                    text: '0%',
                    top: 'middle',
                    left: 'center',
                    textStyle: {
                        // fontWeight: 'bold',
                        fontSize: 20,
                        color: '#fff',
                    }
                }, cfg.title),
                series: [
                    // 主圆环
                    {
                        type: 'pie',
                        radius: ['68%', '95%'],
                        startAngle: 225,
                        silent: true,
                        z: 40,
                        labelLine: {
                            normal: {
                                show: false
                            }
                        },
                        color: [
                            {
                                type: 'linear',
                                x: 0,
                                y: 0,
                                x2: 1,
                                y2: 0,
                                colorStops: [{
                                    offset: 0,
                                    color: vm.hexToRgba(cfg.color, 0.05) // 0% 处的颜色
                                }, {
                                    offset: 1,
                                    color: vm.hexToRgba(cfg.color, 0.75) // 100% 处的颜色
                                }]
                            },
                            vm.hexToRgba(cfg.color, 1),
                            'transparent',
                        ],
                        data: []
                    },
                    // 背景圆环
                    {
                        type: 'pie',
                        radius: ['68%', '95%'],
                        startAngle: 225,
                        silent: true,
                        z: 20,
                        labelLine: {
                            normal: {
                                show: false
                            }
                        },
                        data: [
                            {
                                value: 75,
                                itemStyle: {
                                    normal: {
                                        color: vm.hexToRgba(cfg.color, 0.05),
                                        borderWidth: 2,
                                        borderColor: vm.hexToRgba(cfg.borderColor, 1),
                                    }
                                }
                            },
                            {
                                value: 25,
                                itemStyle: {
                                    normal: {
                                        color: 'transparent'
                                    }
                                }
                            }
                        ]
                    },
                    // 底部两条线
                    {
                        type: 'pie',
                        radius: ['68%', '95%'],
                        startAngle: 225,
                        silent: true,
                        z: 30,
                        labelLine: {
                            normal: {
                                show: false
                            }
                        },
                        color: [vm.hexToRgba(cfg.color, 1), 'transparent', vm.hexToRgba(cfg.color, 1), 'transparent'],
                        data: [0.3, 75, 0.3, 25]
                    },
                    // 中间圈
                    {
                        type: 'pie',
                        radius: ['55%', '55%'],
                        silent: true,
                        z: 5,
                        labelLine: {
                            normal: {
                                show: false
                            }
                        },
                        data: [{
                            value: 1,
                            itemStyle: {
                                normal: {
                                    borderWidth: 3,
                                    borderColor: {
                                        type: 'linear',
                                        x: 0,
                                        y: 0,
                                        x2: 0,
                                        y2: 1,
                                        colorStops: [{
                                            offset: 0,
                                            color: vm.hexToRgba(cfg.borderColor, 1), // 0% 处的颜色
                                        }, {
                                            offset: 1,
                                            color: vm.hexToRgba(cfg.borderColor, 0.1), // 100% 处的颜色
                                        }]
                                    }
                                }
                            }
                        }]
                    },
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
            let value = vm.value || 0;

            // 得到标题数据
            vm.option.title.text = value + '%';
            // 得到系列数据。分为三段数据，1数据区间，2数据末端区间，3透明区间
            vm.option.series[0].data = [
                value === 0 ? 0 : 0.75 * value - 1,
                value === 0 ? 0 : 1,
                100 - 0.75 * value,
            ];

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
        // 重绘图表
        resizeChart() {
            this.myChart && this.myChart.resize();
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

