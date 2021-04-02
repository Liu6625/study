<!--气泡组件-->
<template>
    <div :id="chartId" style="height:100%;width:100%;"></div>
</template>

<script>
import echarts from 'echarts';

let chartIdSeed = 1;
export default {
    name: 'graph-cloud-chart',
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
            defaultConfig: {
                tooltipShow: true,      // 是否显示 tooltip
                detailUnit: '',     // 数据单位
                symbol: 'circle',         // 标记的图形
                labelMaxLength: 8, // 图例文字的最大显示长度，默认8
                colors: ['#D05328', '#F3BB23', '#A040CD', '#3BA697', '#0087EF', '#79C943'],     // 文本颜色数组
                fontSize: [14], // 文本大小
                symbolSize: [30], // 图形的大小
                symbolHeight: 30, // 图形高度
                isGradient: false, // 是否开启背景色渐变
                colorBgs: ['#D05328', '#F3BB23'], // 背景色
                colorBds: ['rgba(255, 255, 255 ,0)'], // 边框线,默认透明
                tooltip: {}, // tooltip的相关配置。参考echarts官网
                labelNormal: {}, // 文本样式
                itemNormal: {}, // 图形样式
                series: {},
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
        vm.chartId = 'graph-cloud-chart_' + chartIdSeed++;
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
                // 初始动画的时长
                animationDurationUpdate: function(idx) {
                    return idx * 100;
                },
                tooltip: Object.assign({}, {
                    show: cfg.tooltipShow,
                    formatter: '{b}',
                }, cfg.tooltip),
                color: cfg.colors,
                animationEasingUpdate: 'bounceIn',
                series: [
                    Object.assign({}, {
                        type: 'graph',
                        layout: 'force',    // 图的布局
                        force: {    // 力引导布局相关的配置项
                            repulsion: 300, // 节点之间的斥力因子
                            edgeLength: 10, // 边的两个节点之间的距离
                            gravity: 0.1,  // 节点受到的向中心的引力因子
                        },
                        roam: true,  // 是否开启鼠标缩放和平移漫游
                        label: {    // 图形上的文本标签
                            normal: {
                                fontSize: 14,
                                color: '#000',
                                show: true,
                                align: 'center',
                            },
                        },
                        data: [],  // 数据展示
                    }, cfg.series),
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
                symbolSize: vm.setSymbolSize(item),
                draggable: true,
                itemStyle: {    // 图形样式
                    normal: Object.assign({}, {
                        color: config.colorBgs[index % config.colorBgs.length],
                    }, config.itemNormal),
                },
                label: {     // 文本样式
                    normal: Object.assign({}, {
                        formatter: function(value) {
                            let label = value.name;
                            if (value.name != null && value.name.length > config.labelMaxLength) {
                                // 开启了尾部显示省略号
                                label = value.name.substr(0, config.labelMaxLength) + '...';
                            }
                            return '{a|' + label + '}';
                        },
                        fontSize: 20,
                        rich: {
                            a: {
                                color: config.colors[index % config.colors.length],
                                fontSize: 14,
                                backgroundColor: config.colorBgs[index % config.colorBgs.length],
                                borderColor: config.colorBds[index % config.colorBds.length],
                                borderWidth: 1,
                                align: 'center',
                                borderRadius: 6,
                                padding: [8, 20, 10, 20],
                            },
                        },
                    }, config.labelNormal),
                },
            }));
            vm.option.series[0].data = seriesArr;

            vm.myChart && vm.myChart.setOption(vm.option);
            vm.getDataURL();
        },

        // 设置图形大小：拖拽draggable与提示文本tooltip的鼠标接触区域 与 symbolSize大小有关
        setSymbolSize(item) {
            let vm = this;
            let config = vm.finallyConfig;
            let width = 0;
            let height = config.symbolHeight;
            let len;
            // 设置多出省略时的宽度
            if (item.name != null && item.name.length > config.labelMaxLength) {
                len = config.labelMaxLength;
            } else {
                len = item.name.length;
            }
            width = len * 16 + 20;
            return [width, height];
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
