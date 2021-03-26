<template>
    <div id="treeChart" style="width: 100%; height: 100%;"></div>
</template>

<script>
import echarts from 'echarts';

export default {
    name: 'tree-chart',
    props: {
        // 图表数据
        legendData: {
            type: Object,
            default: () => {}
        },
        // 树形图的高度
        height: {
            type: Number,
            default: 80
        },
        // 树形图展开的层次，0 为根节点
        treeDepth: {
            type: Number,
            default: 1
        },
    },
    data() {
        return {
            myChart: '',
            option: {},
            chartResizeTimer: null, // 定时器，用于resize事件函数节流
        };
    },
    mounted() {
        let vm = this;
        vm.initOption();

        this.$nextTick(() => {
            this.ready();
        });
    },
    watch: {
        legendData(val) {
            if (val && val !== {}) {
                this.$nextTick(() => {
                    this.ready();
                });
            }
        },
        treeDepth() {
            this.$nextTick(() => {
                this.ready();
            });
        }
    },
    computed: {
        treeHeight: {
            get: function () {
                return this.height;
            },
            set: function (value) {
                this.$emit('update:height', value);
            }
        },
    },
    methods: {
        // 更新图表数据
        ready() {
            let vm = this;
            let dom = document.getElementById('treeChart');
            vm.myChart = echarts.init(dom);

            // 添加窗口resize事件
            window.addEventListener('resize', vm.handleChartResize);

            vm.myChart.on('click', function(param) {
                vm.resizeTree();
            });

            vm.option.series[0].data = vm.legendData ? [vm.legendData] : [];
            vm.option.series[0].initialTreeDepth = vm.treeDepth;

            vm.myChart && vm.myChart.setOption(vm.option);
            vm.legendData && vm.resizeTree();
        },
        // 初始化图表配置
        initOption() {
            let vm = this;
            vm.option = {
                tooltip: {
                    formatter(val) {
                        return val.data.label + val.name;
                    },
                    trigger: 'item',
                    triggerOn: 'mousemove'
                },
                series: [
                    {
                        type: 'tree',
                        top: '1%',
                        left: '12%',
                        bottom: '1%',
                        right: '20%',
                        symbolSize: 16,
                        itemStyle: {
                            normal: {
                                color: '#2A83E1',
                                borderColor: '#2A83E1',
                                borderWidth: 5,
                            }
                        },
                        lineStyle: {
                            normal: {
                                color: '#2A83E1'
                            }
                        },
                        label: {
                            normal: {
                                position: 'left',
                                verticalAlign: 'middle',
                                align: 'right',
                                fontSize: 16,
                                formatter: function ({ name }) {
                                    // 图例文本超长时，显示省略号
                                    if (name && name.length > 16) {
                                        name = name.substr(0, 16) + '...';
                                    }
                                    return name;
                                },
                            }
                        },
                        leaves: {
                            label: {
                                normal: {
                                    position: 'right',
                                    verticalAlign: 'middle',
                                    align: 'left'
                                }
                            }
                        },
                        expandAndCollapse: true,
                        animationDuration: 550,
                        animationDurationUpdate: 750
                    }
                ]
            };
        },
        // 处理窗口 resize 事件
        handleChartResize() {
            let vm = this;
            clearTimeout(vm.chartResizeTimer);
            vm.chartResizeTimer = setTimeout(function() {
                vm.myChart && vm.myChart.resize();
            }, 200);
        },
        // 点击树形图节点的回调函数，使用该方法自适应高度
        resizeTree() {
            let vm = this;

            let allNode = 0;
            let nodes = vm.myChart._chartsViews[0]._data._graphicEls; // 取得树形图内所有的节点数

            // 计算展开的节点数
            for (let i = 0; i < nodes.length; i++) {
                if (!nodes[i]) continue;
                allNode++;
            }
            // 计算宽度，展开的节点数 * 一个大于节点显示高度的数 可以确保让节点之间有间距
            vm.treeHeight = 35 * allNode;

            // 重绘图表
            vm.handleChartResize();
        },
    },
    beforeDestroy() {
        // 释放该图例资源，较少页面卡顿情况
        if (this.myChart) this.myChart.clear();
        // 移除窗口resize事件
        window.removeEventListener('resize', this.handleChartResize);
    }
};
</script>

<style scoped>

</style>
