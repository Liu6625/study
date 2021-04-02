<!--嵌套环形图组件-->
<template>
    <div :id="chartId" style="height:100%;width:100%;"></div>
</template>

<script>
import echarts from 'echarts';

let chartIdSeed = 1;
export default {
    name: 'nested-pie-chart',
    props: {
        // 图表数据
        // 格式举例：二维数组，数组第一个元素为内部饼状图数据，数组第二个元素为外部环形图数据
        // [[{name: 'Mon', value: 120},{name: 'Tue', value: 200}],
        //  [{name: 'high', value: 80},{name: 'low', value: 40},{name: 'high', value: 180},{name: 'low', value: 20}]]
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
            defaultConfig: {
                seriesName: '', // 系列名称
                center: ['35%', '52%'], // 饼图的圆心坐标，数组的第一项是横坐标，第二项是纵坐标。支持 像素值/百分比
                // 环形图的半径，数组第一个元素为内部饼状图半径，数组第二个元素为外部环形图半径。每个元素的取值参考echarts官网
                radius: [[0, '45%'], ['55%', '75%']],
                tooltipShow: true, // 是否显示 tooltip
                tooltipPosition: '', // 参数为 'left'悬浮提示在鼠标的左侧、'right'悬浮提示在鼠标的右侧
                legendShow: true, // 是否显示图例，如果不显示图例，可能需要调整center的值
                legendScroll: false, // 图例是否开启翻页
                ellipsis: true, // 是否开启图例内容超出显示省略号
                labelMaxLength: 8, // 图例文字的最大显示长度，默认8
                colors: ['#369eff', '#66b6ed', '#fd6437', '#ffa23a', '#59d76d', '#c44a07', '#b0222f', '#b63393', '#7a19ac', '#5d12ce', '#5460fa', '#97acfa'],
                animation: true, // 是否开启动画。注意：开启动画的情况下，导出的chartImg有问题，涉及到导出的图表需要设置成false
            },
            finallyConfig: {}, // 最后配置项
            option: {}, // 图标配置项
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
    mounted: function () {
        let vm = this;
        // 图表id自增
        vm.chartId = 'nested-pie-chart_' + chartIdSeed++;
        vm.finallyConfig = Object.assign({}, vm.defaultConfig, vm.chartConfig);
        vm.initOption();
        vm.$nextTick(() => {
            vm.ready();
        });
    },
    methods: {
        // 初始化配置項
        initOption() {
            let vm = this;
            let cfg = vm.finallyConfig;
            vm.option = {
                animation: cfg.animation,
                title: {
                    show: false,
                },
                legend: {
                    show: cfg.legendShow,
                    orient: 'vertical',
                    y: 'center',
                    right: '5%',
                    itemWidth: 12,
                    itemHeight: 12,
                    icon: 'circle',
                    // 设置图例内容超出显示省略号
                    formatter: function (val) {
                        if (cfg.ellipsis && val != null && val.length > cfg.labelMaxLength) {
                            // 开启了尾部显示省略号
                            val = val.substr(0, cfg.labelMaxLength) + '...';
                        }
                        return val;
                    },
                    type: cfg.legendScroll ? 'scroll' : 'plain',
                },
                tooltip: {
                    show: cfg.tooltipShow,
                    trigger: 'item',
                    // 饼图百分比显示计算
                    formatter: function(d) {
                        let num = d.percent;
                        if (d.percent >= 99) { num = '>99' }
                        if (d.percent <= 1) { num = '<1' }
                        return d.seriesName + '<br/>' + d.name + ' : ' + d.value + ' (' + num + '%)';
                    },
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
                },
                color: cfg.colors,  // 每个区域颜色
                series: [
                    {
                        name: cfg.seriesName,
                        type: 'pie',
                        center: cfg.center, // 饼图的圆心坐标
                        radius: cfg.radius[0], // 饼图的半径
                        minAngle: 5, // 最小的扇区角度（0 ~ 360），用于防止某个值过小导致扇区太小影响交互
                        cursor: cfg.tooltipShow ? 'pointer' : 'default', // 鼠标悬浮时在图形元素上时鼠标样式
                        label: {
                            normal: {
                                position: 'inner', // 内部的饼状图标签显示在饼图里面
                                formatter: '{b} \n {c}',
                                lineHeight: 18,
                                fontSize: 14,
                            }
                        },
                    },
                    {
                        name: cfg.seriesName,
                        type: 'pie',
                        center: cfg.center, // 饼图的圆心坐标
                        radius: cfg.radius[1], // 饼图的半径
                        minAngle: 5, // 最小的扇区角度（0 ~ 360），用于防止某个值过小导致扇区太小影响交互
                        cursor: cfg.tooltipShow ? 'pointer' : 'default', // 鼠标悬浮时在图形元素上时鼠标样式
                        label: {
                            normal: {
                                formatter: '{b}: {c}',
                                fontSize: 14,
                            },
                        },
                    }
                ],
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
            // 得到图例数据
            // vm.option.legend.data = vm.chartData.map(item => item.name);
            vm.option.legend.data = Array.prototype.concat.apply([], vm.chartData).map(item => item.name); // 数组降维

            // 得到系列数据
            for (let i = 0; i < 2; i++) {
                vm.option.series[i].data = vm.chartData[i].map(item => ({
                    value: item.value || null,
                    name: item.name || ''
                }));
            }

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
