<!--气泡组件-->
<template>
    <div :id="chartId" style="height:100%;width:100%;"></div>
</template>

<script>
import echarts from 'echarts';

let chartIdSeed = 1;
export default {
    name: 'graph-bubble-chart',
    props: {
        // 图表数据
        // 格式举例：[{value: 55, name: "高危"},{value: 55, name: "中危"}]
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
            // isGradient: true,时，设置气泡背景色渐变色：colorStops[[{ offset: 0, color: 'rgba(208,83,40,0)' },{ offset: 0.8, color: 'rgba(208,83,40,0.1)' },{ offset: 1, color: 'rgba(208,83,40,0.4)', }]],
            // isGradient: false,时，设置气泡背景色纯色 ：colorStops: ['#D05328', '#F3BB23', '#A040CD', '#3BA697', '#0087EF', '#79C943'],
            defaultConfig: {
                tooltipShow: true,      // 是否显示 tooltip
                detailUnit: '',     // 数据单位
                symbol: 'circle',         // 标记的图形
                repulsion: 300,     // 节点之间的斥力因子
                edgeLength: 10,     // 边的两个节点之间的距离
                gravity: 0.1,       // 节点受到的向中心的引力因子
                colors: ['#D05328', '#F3BB23', '#A040CD', '#3BA697', '#0087EF', '#79C943'],     // 文本颜色数组
                labelNameSize: [24], // 标题的大小
                labelValueSize: [24], // 数值的大小
                labelUnitSize: [16], // 单位的大小
                symbolSize: [100], // 气泡的大小
                isGradient: true, // 是否开启背景色渐变
                // 气泡背景色
                colorStops: [
                    [
                        { offset: 0, color: 'rgba(208,83,40,0)' },
                        { offset: 0.8, color: 'rgba(208,83,40,0.1)' },
                        { offset: 1, color: 'rgba(208,83,40,0.4)', }
                    ]
                ],
                itemShadowBlur: [10],   // 气泡阴影大小   若只设置1个值，则默认为所有气泡的公共值
                itemShadowColor: ['rgba(255,255,255,0.2)'],    // 气泡阴影颜色
                tooltip: {}, // tooltip的相关配置。参考echarts官网
            },
            finallyConfig: {}, // 最后配置项
            option: {},     // 图表配置项
            myChart: '',    // 图表对象
            chartId: 1, // 图表id
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
    mounted: function() {
        let vm = this;
        // 图表id自增，这样可以保证在同一页面中引用同一个组件，生成多个图表时，id不会冲突
        vm.chartId = 'graph-bubble-chart_' + chartIdSeed++;
        vm.finallyConfig = Object.assign({}, vm.defaultConfig, vm.chartConfig);
        vm.initOption();     // 初始化配置项
        vm.$nextTick(() => {
            vm.ready();
        });
    },
    methods: {
        // 初始化配置项
        initOption() {
            let vm = this;
            let cfg = vm.finallyConfig;
            vm.option = {
                tooltip: Object.assign({}, {
                    show: cfg.tooltipShow,
                    formatter: '{b} : {c}' + cfg.detailUnit,
                }, cfg.tooltip),
                // 初始动画的时长
                animationDurationUpdate: function(idx) {
                    return idx * 100;
                },
                color: cfg.colors,
                animationEasingUpdate: 'bounceIn',
                series: [
                    {
                        type: 'graph',
                        layout: 'force',    // 图的布局
                        force: {    // 力引导布局相关的配置项
                            repulsion: cfg.repulsion, // 节点之间的斥力因子
                            edgeLength: cfg.edgeLength, // 边的两个节点之间的距离
                            gravity: cfg.gravity,  // 节点受到的向中心的引力因子
                        },
                        roam: true,  // 是否开启鼠标缩放和平移漫游
                        label: {    // 图形上的文本标签
                            normal: {
                                fontSize: 20,
                                color: '#000',
                                show: true,
                                align: 'center',
                            },
                        },
                        data: [],  // 数据展示
                    }
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
            // 得到基础数据设置
            let config = vm.finallyConfig;
            let seriesArr = vm.chartData.map((item, index) => ({
                name: item.name,
                value: item.value,
                symbol: config.symbol,
                symbolSize: config.symbolSize[index] || config.symbolSize[0],
                draggable: true,
                itemStyle: {    // 气泡样式
                    normal: {
                        color: config.isGradient ? {
                            type: 'radial',
                            colorStops: config.colorStops[index] || config.colorStops[0],
                            global: false,
                        } : config.colorStops[index],
                        shadowBlur: config.itemShadowBlur[index] || config.itemShadowBlur[0],
                        shadowColor: config.itemShadowColor[index] || config.itemShadowColor[0],
                    },
                },
                label: {     // 文本样式
                    normal: {
                        formatter: function(value) {
                            return '{a|' + value.name + '}\n{b|' + value.value + '}{c|' + config.detailUnit + '}';
                        },
                        rich: {
                            a: {
                                color: config.colors[index] || config.colors[0],
                                fontSize: config.labelNameSize[index] || config.labelNameSize[0],
                                align: 'center',
                                padding: [6, 0, 6, 0],
                            },
                            b: {
                                color: config.colors[index] || config.colors[0],
                                fontSize: config.labelValueSize[index] || config.labelValueSize[0],
                                fontWeight: 700,
                                align: 'center',
                                padding: [0, 1, 0, 0],
                            },
                            c: {
                                color: config.colors[index] || config.colors[0],
                                fontSize: config.labelUnitSize[index] || config.labelUnitSize[0],
                                align: 'center',
                                padding: [0, 0, 0, 1],
                            },
                        },
                    },
                },
            }));
            vm.option.series[0].data = seriesArr;

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
