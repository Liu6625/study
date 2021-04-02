<!--仪表盘组件-->
<template>
    <div :id="chartId" style="height:100%;width:100%;"></div>
</template>

<script>
import echarts from 'echarts';

let chartIdSeed = 1;
export default {
    name: 'gauge-chart',
    props: {
        // 图表数据
        // 格式举例：[{value: 55, name: "威胁性"}]
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
            /** 分段颜色设置格式 color:[[0.2, '#91c7ae'], [0.8, '#63869e'], [1, '#c23531']],
             *  渐变颜色设置格式 color:  [[0.91, new echarts.graphic.LinearGradient(0, 0, 1, 0, [{offset: 0,color: '#FE5628'},{offset: 0.5,color: '#E4D91F'},{offset: 1,color: '#30FC87'} ])],[1, '#fff']],
             *  注意：仪表盘的刻度线会默认放在圆形轴线中，若想单独设置刻度线与轴线的间隔距离，需要单独分开在seriesExpand中设置。
             *  **/
            defaultConfig: {
                tooltipShow: true,      // 是否显示 tooltip
                animation: true,        // 是否开启动画
                detailUnit: '',     // 数据单位

                // 以下属性配置是为了设置series[0]的属性值，建议渐变色的轴线样式最好放在series[0]中设置
                clockwise: true,        // 是否是顺时针增长
                axisLineShow: true,     // 是否显示仪表盘轴线
                splitLineShow: true,    // 是否显示分割线
                axisTickShow: true,     // 是否显示刻度
                axisLabelShow: true,    // 是否显示刻度标签
                pointerShow: true,      // 是否显示指针
                seriesTitleShow: true, // 是否显示仪表盘标题
                seriesTitleOffset: [0, '-40%'], // 仪表盘标题偏移位置
                seriesTitleColor: '#000',   // 仪表盘标题颜色
                seriesTitleSize: 15,   // 仪表盘标题大小
                detailShow: true,     // 是否显示数据
                detailSize: 30,     // 数据显示大小
                detailOffset: [0, '40%'],     // 数据显示偏移位置
                baseCenter: ['50%', '50%'],   // 仪表盘中心位置
                baseRadius: '90%',   // 仪表盘半径
                axisLineWidth: 30,   // 轴线大小
                colors: [[0.2, '#91c7ae'], [0.8, '#63869e'], [1, '#c23531']],    // 颜色数组，单颜色只需要设置一个数组值，如：colors: [[1, '#91c7ae']]
                isGradient: false, // 是否开启轴线渐变
                gradientDirect: [0, 0, 1, 0], // 渐变时候的方向
                endColor: '', // 开启渐变时，用于设置后部分的固定颜色；为空且isGradient为true时，代表渐变范围为0-1

                // 当以上配置还无法满足你的样式改动，则可传递下面两个参数series，seriesExpand
                // 注意：下面设置的属性值可能会覆盖上面对应的配置
                series: {},     // series[0]的base相关配置，参考echarts
                seriesExpand: [], // series的拓展配置，会放置在series[0]之后。
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
        vm.chartId = 'gauge-chart_' + chartIdSeed++;
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
                animation: cfg.animation,
                tooltip: {
                    show: cfg.tooltipShow,
                    formatter: '{b} : {c}' + cfg.detailUnit,
                },
                series: [
                    Object.assign({}, {
                        type: 'gauge',
                        name: 'base',   // 系列名称，用于tooltip的显示、legend 的图例筛选，在 setOption 更新数据和配置项时用于指定对应的系列。
                        center: cfg.baseCenter,    // 默认全局居中
                        radius: cfg.baseRadius,         // 仪表盘半径
                        startAngle: 225,
                        endAngle: -45,
                        clockwise: cfg.clockwise,    // 是否是顺时针增长
                        // 仪表盘轴线
                        axisLine: {     // 仪表盘轴线
                            show: cfg.axisLineShow,
                            lineStyle: {
                                width: cfg.axisLineWidth,
                                color: cfg.colors,
                                opacity: cfg.axisLineShow, // 设置true或者false，为了防止show：false不生效时，隐藏轴线
                            }
                        },
                        // 分隔线样式
                        splitLine: {
                            show: cfg.splitLineShow,
                        },
                        // 刻度样式
                        axisTick: {     // 刻度样式
                            show: cfg.axisTickShow,
                        },
                        // 刻度标签
                        axisLabel: {
                            show: cfg.axisLabelShow,
                        },
                        // 指针
                        pointer: {
                            show: cfg.pointerShow,
                        },
                        // 仪表盘标题
                        title: {
                            show: cfg.seriesTitleShow,
                            offsetCenter: cfg.seriesTitleOffset,   // 偏移位置
                            color: cfg.seriesTitleColor,
                            fontSize: cfg.seriesTitleSize,
                        },
                        detail: {
                            show: cfg.detailShow,     // 是否显示value值
                            fontSize: cfg.detailSize,
                            offsetCenter: cfg.detailOffset,
                            formatter: '{value}' + cfg.detailUnit,  // value值格式
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
            vm.myChart.on('click', function (param) {
                vm.$emit('chartClick', param);
            });

            vm.updateChartData();
        },
        // 更新图表数据
        updateChartData() {
            let vm = this;
            let cfg = vm.finallyConfig;


            // 设置轴线的渐变色
            if (cfg.isGradient) {
                // 设置渐变结束位置
                let value = 1;
                if (vm.chartData.length) {
                    value = vm.chartData[0].value / 100;
                }
                // 渐变色的数值颜色配置
                let linear = cfg.colors.map(item => ({
                    offset: item[0],
                    color: item[1]
                }));
                // 渐变色
                let colors = [[value, new echarts.graphic.LinearGradient(...cfg.gradientDirect, linear)]];

                // 设置固定部分的颜色
                if (cfg.endColor) {
                    colors.push([1, cfg.endColor]);
                }
                vm.option.series[0].axisLine.lineStyle.color = colors;
            }

            // 拓展设置，用于设置各种特殊仪表样式
            if (cfg.seriesExpand) {
                cfg.seriesExpand.forEach(item => {
                    vm.option.series.push(item);
                });
            }

            // 得到基础数据
            vm.option.series[0].data = vm.chartData ? vm.chartData : [];

            // 考虑扩展样式内的data值设置，页面配置中只需设置 data: [];  此处检验到data存在，则会将数据传入data
            // 指针的显示前提是设置data值。
            vm.option.series.forEach(item => {
                if (item.data) {
                    item.data = vm.chartData ? vm.chartData : [];
                }
            });



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
