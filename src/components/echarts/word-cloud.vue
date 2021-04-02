<!--echarts 的词云图组件，用于展示大量文本数据。每个词的重要性以字体大小展现-->
<template>
    <div class="container" :id="chartId"></div>
</template>

<script>
import echarts from 'echarts';
require('echarts-wordcloud');
let chartIdSeed = 1;
export default {
    name: 'word-cloud',
    props: {
        // word-cloud图表数据，必传项，数组类型
        data: {
            type: Array,
            required: true,
            default: () => []
        },
        // 显示文字的字段名
        textName: {
            type: String,
            default: 'name'
        },
        // 显示文字对应值的字段名
        valueName: {
            type: String,
            default: 'value'
        },
        // 文字颜色数组
        colors: {
            type: Array,
            default: () => ['#369EFF', '#25D7C4', '#F0C417', '#8D43F4']
        },
        // 悬浮显示框，针对 value 字段的描述文字
        valueDesc: {
            type: String,
            default: 'value'
        },
        // 图表扩展配置项
        config: {
            type: Object,
            default: () => {}
        }
    },
    data() {
        return {
            chartId: 1, // 图表的id，用来区分一个页面多个 word-cloud
            option: {}, // 图表配置项
            myChart: null, // 图表实例
            chartResizeTimer: null, // 定时器，用于resize事件函数节流
        };
    },
    watch: {
        'data': function () {
            this.$nextTick(() => {
                this.updateData();
            });
        },
    },
    mounted() {
        let vm = this;
        vm.chartId = 'word-cloud_' + chartIdSeed++;
        vm.initOption();
        vm.$nextTick(() => {
            vm.ready();
        });
    },
    methods: {
        // 初始化图表配置项
        initOption() {
            let vm = this;
            vm.option = {
                title: {
                    show: false,
                },
                tooltip: Object.assign({
                    formatter: function (params) {
                        let title = params.seriesName;
                        let content = `${params.data.fullName}: ${params.value}`;
                        return title + '<br/>' + params.marker + content;
                    },
                }, vm.config.tooltip || {}),
                series: [{
                    name: vm.valueDesc, // 悬浮提示的标题
                    type: 'wordCloud',
                    sizeRange: [12, 46], // font-size 大小范围
                    rotationRange: [0, 0], // 文本旋转角度，默认不旋转
                    gridSize: 20, // 网格的大小(以像素为单位)。网格越大，单词之间的间隔就越大
                    width: '90%',
                    height: '85%',
                    // 以下配置暂时不用，留着做备注 2019-7-18
                    // left: 'center',
                    // top: 'center',
                    // right: 10,
                    // bottom: 10,
                    // shape: 'diamond',
                    // size: ['100%', '100%'],
                    // textRotation : [0,0],
                    // textPadding: 10,
                    // autoSize: {
                    //     enable: true,
                    //     minSize: 12
                    // },
                    drawOutOfBound: true, // 是否允许绘制大于画布大小的单词，允许
                    shuffle: true, // 是否随机抽取要绘制的点

                    textStyle: {
                        normal: {
                            color: function() {
                                // 文本颜色取随机颜色
                                return vm.colors[Math.floor(Math.random() * 4)];
                            },
                        },
                        // 鼠标悬浮的样式
                        // emphasis: {
                        //     color: '#f00',
                        //     shadowColor: '#f00',
                        //     shadowBlur: 8,
                        // },
                    },
                    data: [],
                }]
            };
        },
        // 初始化函数，数据刷新执行函数
        ready() {
            let vm = this;
            // 初始化echart图表
            let dom = document.getElementById(vm.chartId);
            if (!dom) return false;
            vm.myChart = echarts.init(dom);

            // 添加窗口resize事件
            window.addEventListener('resize', vm.handleChartResize);

            vm.updateData();
        },
        // 处理并刷新数据
        updateData() {
            let vm = this;
            let data = vm.data;

            data.forEach(item => {
                let name = item[vm.textName];
                item['fullName'] = name;
                item['value'] = item[vm.valueName];
                // 文字超长处理
                if (screen.width <= 1540) {
                    item['name'] = name && name.length > 8 ? name.substr(0, 8) + '...' : name;
                } else {
                    item['name'] = name && name.length > 12 ? name.substr(0, 12) + '...' : name;
                }
            });

            // 网格大小切换。18-23之间的随机整数。目的是为了让 每次渲染的文本位置随机出现
            vm.option.series[0].gridSize = 18 + Math.round(Math.random() * 5);
            vm.option.series[0].data = data;
            vm.myChart.setOption(vm.option);
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

<style lang="scss" scoped>
    .container {
        width: 100%;
        height: 100%;
    }
</style>
