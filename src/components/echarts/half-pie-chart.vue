<!--半饼状南丁格尔图组件-->
<template>
    <div :id="chartId" style="height:100%;width:100%;"></div>
</template>

<script>
import echarts from 'echarts';

let chartIdSeed = 1;
export default {
    name: 'half-pie-chart',
    props: {
        // 图表数据
        // 格式举例：[{name: 'Mon', value:1},{name: 'Tue', value: 1},{name: 'Wed', value: 1},]
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
            // 渐变颜色设置格式 colors: [['#0E1E59', '#FF5857'],['#0E1E59', '#FF821C'],['#0E1E59', '#0089EF'],],
            defaultConfig: {
                seriesName: '', // 系列名称
                tooltipShow: true, // 是否显示 tooltip
                legendShow: false, // 是否显示图例legend
                ellipsis: true, // 是否开启文本内容超出显示省略号
                labelMaxLength: 8, // 图例文字的最大显示长度，默认8
                colors: ['#E55820', '#FCCF31', '#A3FAE0', '#11B0FA'], // 柱状颜色数组。按数组中颜色的顺序依次循环设置颜色，颜色不足取数组第一项
                isGradient: false, // 是否开启渐变。如果开启，colors 需设置为包含两个颜色的数组
                center: ['50%', '35%'], // 饼图的圆心坐标，数组的第一项是横坐标，第二项是纵坐标。支持 像素值/百分比
                // 饼图的半径。number:直接指定半径值（饼图）；string:百分比（饼图）；array:数组第一项是内半径，第二项是外半径（环形图）
                radius: ['0%', '85%'],
                legendScroll: false, // 图例是否开启翻页
                labelLineShow: true, // 是否显示视觉引导线和对应的值
                lineStyleWidth: 3, // 视觉引导线宽度
                roseType: 'area', // false 是否展示成南丁格尔图。可选择两种模式：'radius'、'area'
                startAngle: 180, // 起始角度
                tooltipPosition: '', // 参数为 'left'悬浮提示在鼠标的左侧、'right'悬浮提示在鼠标的右侧，默认自动调整
                animation: true, // 是否开启动画。注意：开启动画的情况下，导出的chartImg有问题，涉及到导出的图表需要设置成false
                axisValueUnit: '', // 数据值的单位

                legend: {}, // 图例的相关配置
                tooltip: {}, // tooltip的相关配置。参考echarts官网
                grid: {}, // 网格区域的相关配置。参考echarts官网
                series: {}, // 饼图的series配置项，参考echarts官网，会覆盖以上所有配置
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
        vm.chartId = 'half-pie-chart_' + chartIdSeed++;
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
            let options = {
                animation: cfg.animation,
                legend: Object.assign({}, {
                    show: cfg.legendShow,
                    left: 'center',
                    top: 30,
                    icon: 'circle',
                    textStyle: {
                        color: 'rgba(255,255,255,0.7)',
                    },
                    data: [],
                }, cfg.legend),
                tooltip: Object.assign({}, {
                    show: cfg.tooltipShow,
                    trigger: 'item',
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
                    formatter: '{b} : {c} ' + cfg.axisValueUnit,
                }, cfg.tooltip),
                grid: Object.assign({}, {
                    left: 0,
                    top: 0,
                    right: 0,
                    bottom: 0,
                }, cfg.grid),
                color: cfg.colors,
                series: [
                    Object.assign({}, {
                        name: cfg.seriesName,
                        type: 'pie',
                        center: cfg.center,
                        radius: cfg.radius,
                        roseType: cfg.roseType, // 是否展示成南丁格尔图
                        minAngle: 5, // 最小的扇区角度（0 ~ 360），用于防止某个值过小导致扇区太小影响交互
                        hoverOffset: 10, // 高亮扇区的偏移距离
                        startAngle: cfg.startAngle,
                        clockwise: false, // 饼图的扇区是否是顺时针排布
                        cursor: cfg.tooltipShow ? 'pointer' : 'default', // 鼠标悬浮时在图形元素上时鼠标样式
                        // 饼图图形上的文本标签
                        label: {
                            normal: {
                                show: cfg.labelLineShow,
                                color: '#fff',
                                fontSize: 18,
                                formatter: v => v.value + cfg.axisValueUnit
                            },
                        },
                        // 标签的视觉引导线样式
                        labelLine: {
                            normal: {
                                show: cfg.labelLineShow,
                                lineStyle: {
                                    width: 3,
                                }
                            }
                        },
                        data: [],
                    }, cfg.series)
                ],
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
            let data = vm.chartData;

            vm.option.legend.data = data.map(item => item.name); // legend数据
            // series样式与数据设置
            let seriesData = vm.chartData.map((item, index) => ({
                value: item.value,
                name: item.name,
                itemStyle: {
                    normal: {
                        color: cfg.isGradient ? (new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
                            offset: 0,
                            color: cfg.colors[index][0]
                        }, {
                            offset: 1,
                            color: cfg.colors[index][1]
                        }])) : cfg.colors[index],
                    }
                },
            }));

            vm.chartData.forEach((item, index) => {
                seriesData.push({
                    value: 0,
                    name: '',
                    itemStyle: {
                        normal: {
                            color: 'transparent'
                        }
                    },
                    label: {
                        normal: {
                            show: false
                        }
                    },
                    tooltip: {
                        show: false
                    },
                });
            });
            vm.option.series[0].data = seriesData;

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
