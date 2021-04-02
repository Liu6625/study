<!--关系图/和弦图组件-->
<template>
    <div :id="chartId" style="height:100%;width:100%;"></div>
</template>

<script>
import echarts from 'echarts';

let chartIdSeed = 1;
export default {
    name: 'graph-chart',
    props: {
        // 图表数据，格式举例（nodes：节点，包括名称和类别；links：节点关系连线，包括来源和目标）
        /* {
            "nodes": [
                { "name": "sql注入", "category": 0 },
                { "name": "撞库", "category": 0 },
                { "name": "172.19.1.25", "category": 1 },
                { "name": "172.19.1.35", "category": 1 },
                { "name": "172.24.1.117", "category": 1 }
            ],
            "links": [
                { "source": "sql注入", "target": "172.19.1.25" },
                { "source": "sql注入", "target": "172.19.1.35" },
                { "source": "撞库", "target": "172.24.1.117" },
                { "source": "撞库", "target": "172.19.1.35" }
            ]
        } */
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
        },
    },
    data() {
        return {
            // 默认配置项。以下配置项可以在父组件 :chartConfig 进行配置，会覆盖这里的默认配置
            defaultConfig: {
                seriesName: '', // 系列名称
                tooltipShow: true, // 是否显示 tooltip
                tooltipPosition: '', // 参数为 'left'悬浮提示在鼠标的左侧、'right'悬浮提示在鼠标的右侧
                animation: true, // 是否开启动画。注意：开启动画的情况下，导出的chartImg有问题，涉及到导出的图表需要设置成false
                legendShow: true, // 是否显示图例
                // 图例数据，包括图例名称和图例图标
                legendData: [
                    { name: 'source', icon: 'rect' },
                    { name: 'target', icon: 'circle' },
                ],
                legendImg: false,  // 图例图标是否使用图片
                legendName: {},   // 图例图标的两种状态图片
                ellipsis: true, // 是否开启文本内容超出显示省略号
                labelMaxLength: 16, // 文本的最大显示长度，默认16
                colors: ['#3071f2', '#a468ea', '#46b2e8', '#dd8b78', '#e4b600'],
                legend: {},
                series: {},
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
    mounted() {
        let vm = this;
        // 图表id自增
        vm.chartId = 'graph-chart_' + chartIdSeed++;
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
                animation: cfg.animation,
                tooltip: {
                    show: cfg.tooltipShow,
                    // 设置tooltip悬浮位置
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
                },
                legend: Object.assign({}, {
                    show: cfg.legendShow,
                    data: cfg.legendData,
                    bottom: 5,
                    itemGap: 20,
                }, cfg.legend),
                animationDurationUpdate: 1500,
                animationEasingUpdate: 'quinticInOut',
                color: cfg.colors,
                series: [
                    Object.assign({}, {
                        name: cfg.seriesName,
                        type: 'graph',
                        layout: 'circular', // 采用环形布局
                        circular: {
                            rotateLabel: true
                        },
                        top: '20%', // 可取值 'top'/'middle'/'bottom'
                        // left: '20%',
                        // right: '20%',
                        // bottom: '20%',
                        width: '50%',
                        height: '50%',
                        focusNodeAdjacency: true, // 是否在鼠标移到节点上的时候突出显示节点以及节点的边和邻接节点
                        // edgeSymbol: ['circle', 'arrow'], // 边两端的标记类型
                        categories: cfg.legendData || [],
                        roam: true, // 是否开启鼠标缩放和平移
                        symbolSize: 22,
                        label: {
                            normal: {
                                show: true,
                                position: 'right',
                                // formatter: '{b}',
                                formatter: function(params) {
                                    let val = params.name;
                                    if (cfg.ellipsis && val != null && val.length > cfg.labelMaxLength) {
                                        // 开启了尾部显示省略号
                                        val = val.substr(0, cfg.labelMaxLength) + '...';
                                    }
                                    return val;
                                },
                            }
                        },
                        lineStyle: {
                            normal: {
                                color: 'source',
                                curveness: 0.3
                            }
                        },
                        data: [],
                        links: [],
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

            // 触发父组件的 @legendselectchanged 事件
            vm.myChart.on('legendselectchanged', function(param) {
                vm.legendIconChanged(param);
            });

            vm.updateChartData();
        },
        // 更新图表数据
        updateChartData() {
            let vm = this;
            let cfg = vm.finallyConfig;
            let graph = vm.chartData;

            // 根据数据量设置图标大小
            let getSymbolSize = len => {
                if (len < 20) return 22;
                if (len < 25) return 20;
                if (len < 30) return 18;
                if (len < 35) return 16;
                if (len < 40) return 14;
                if (len >= 40) return 13;
            };
            let symbolSize = getSymbolSize(graph.nodes.length);

            graph.nodes.forEach((node) => {
                // node.itemStyle = {
                //     normal: {
                //         color: cfg.colors[Math.floor(Math.random() * cfg.colors.length)], // 随机颜色
                //     }
                // };

                // node.symbolSize = 22;
                // node.symbolSize = node.value * 10 || 8;
                // node.value = node.symbolSize;
                // node.symbolSize /= 1.5;
                // node.label = {
                //     normal: {
                //         show: node.symbolSize > 10, // 图标大小大于10就显示便签文本
                //     }
                // };

                node.symbol = cfg.legendData[node.category].icon; // node.category 为 cfg.legendData数组的下标，从0开始
                // console.log(cfg.legendData[node.category].crossOrigin);
                // console.log(node);
                node.symbolSize = symbolSize;
            });

            // 得到节点数据
            vm.option.series[0].data = graph.nodes;
            // 得到连线数据
            vm.option.series[0].links = graph.links;

            vm.myChart && vm.myChart.setOption(vm.option);

            vm.getDataURL();
        },
        // 图例图标的替换
        legendIconChanged(params) {
            let vm = this;
            let cfg = vm.finallyConfig;
            let legendName = cfg.legendName;
            // console.log(cfg);
            if (cfg.legendImg) {
                let name = params.name;
                let option = vm.myChart.getOption();
                Object.keys(params.selected).forEach((key, index) => {
                    if (name === key) {
                        // 判断当前图例是否被选中
                        if (!params.selected[name]) {
                            option.legend[0].data[index].icon = legendName[name][0];
                        } else {
                            option.legend[0].data[index].icon = legendName[name][1];
                        }
                    }
                });
                vm.myChart && vm.myChart.setOption(option);
            }
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
            // let imgSrc = this.myChart.getDataURL({
            //     backgroundColor: '#fff',
            // });
            // this.$emit('update:chartImg', imgSrc);
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

<style scoped lang="scss">

</style>
