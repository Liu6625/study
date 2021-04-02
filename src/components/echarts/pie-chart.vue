<!--饼状图/环状图组件-->
<template>
    <div :id="chartId" style="height:100%;width:100%;"></div>
</template>

<script>
import echarts from 'echarts';

let chartIdSeed = 1;
export default {
    name: 'pie-chart',
    props: {
        // 图表数据
        // 格式举例：[{name: 'Mon', value: 120},{name: 'Tue', value: 200},{name: 'Wed', value: 150},]
        chartData: {
            type: Array,
            default: () => []
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
                unit: '', // 数据值单位
                center: ['35%', '52%'], // 饼图的圆心坐标，数组的第一项是横坐标，第二项是纵坐标。支持 像素值/百分比
                // 饼图的半径。number:直接指定半径值（饼图）；string:百分比（饼图）；array:数组第一项是内半径，第二项是外半径（环形图）
                radius: ['40%', '70%'],
                roseType: false, // 是否展示成南丁格尔图。可选择两种模式：'radius'、'area'
                tooltipShow: true, // 是否显示 toolTip
                legendShow: true, // 是否显示图例，如果不显示图例，可能需要调整center的值
                legendScroll: false, // 图例是否开启翻页
                legendValueShow: false, // 图例的数值是否显示，一般配合 legendRich: true 来使用
                legendValueConver: false, // 图例的数值是否进行单位转换
                legendRich: false, // 是否开启图例富文本样式
                labelLineShow: true, // 是否显示视觉引导线和对应的值
                ellipsis: true, // 是否开启图例内容超出显示省略号
                labelMaxLength: 8, // 图例文字的最大显示长度，默认8
                colors: ['#0082e6', '#15dbc6', '#37d066', '#cbc758', '#c48517', '#c44a07', '#b0222f', '#b63393', '#7a19ac', '#5d12ce', '#5460fa', '#97acfa'],
                tooltipPosition: '', // 参数为 'left'悬浮提示在鼠标的左侧、'right'悬浮提示在鼠标的右侧
                animation: true, // 是否开启动画。注意：开启动画的情况下，导出的chartImg有问题，涉及到导出的图表需要设置成false
                itemBorderWidth: 0, // 饼片之间的边界宽度
                itemBorderColor: '#fff', // 饼片之间的边界颜色，默认白色
                legend: {}, // 饼图的legend配置项，参考echarts官网，会覆盖以上所有配置
                tooltip: {}, // 饼图的tooltip配置项，参考echarts官网，会覆盖以上所有配置
                series: {}, // 饼图的series配置项，参考echarts官网，会覆盖以上所有配置
            },
            finallyConfig: {}, // 最后配置项
            option: {}, // 图标配置项
            myChart: '',
            chartId: 1,
            chartResizeTimer: null, // 定时器，用于resize事件函数节流
        };
    },
    watch: {
        chartData: function (val) {
            this.$nextTick(() => {
                this.updateChartData();
            });
        }
    },
    mounted: function () {
        let vm = this;
        // 图表id自增
        vm.chartId = 'pie-chart_' + chartIdSeed++;
        vm.finallyConfig = Object.assign({}, vm.defaultConfig, vm.$attrs.chartConfig);
        vm.initOption();
        vm.$nextTick(() => {
            vm.ready();
        });

        // 对饼图中心位置进行处理
        // if (vm.finallyConfig.labelLineShow === false && !vm.finallyConfig.center) {
        //     // 如果labelLineShow数据不显示并且父组件没有传入center给子组件，则使用默认的center值
        //     vm.finallyConfig.center = ['50%', '50%'];
        // }
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
                title: {
                    show: false,
                },
                legend: Object.assign({}, {
                    show: cfg.legendShow,
                    orient: 'vertical',
                    y: 'center',
                    right: '5%',
                    itemWidth: 12,
                    itemHeight: 12,
                    icon: 'circle',
                    // 注意：如果父组件传了 legend.textStyle 参数，则会覆盖这里的数据，如果还需要这里的样式则需要父组件配置好rich
                    textStyle: {
                        rich: {
                            // 图例名字的样式
                            a: {
                                color: '#333',
                                fontSize: 12,
                                // padding: [2, 0, 4, 0],
                            },
                            // 图例数据的样式
                            b: {
                                color: '#333',
                                fontSize: 14,
                                fontWeight: 700,
                            },
                        },
                    },
                    formatter: function (name) {
                        let curItem = vm.chartData.find(item => item.name === name) || {};
                        let value = cfg.legendValueShow ? curItem.value : '';
                        if (cfg.legendValueConver) value = vm.$filters.unitConversion(value);
                        if (cfg.ellipsis && name != null && name.length > cfg.labelMaxLength) {
                            // 图例名称超长 尾部显示省略号，只处理名称超长的情况
                            name = name.substr(0, cfg.labelMaxLength) + '...';
                        }

                        name = cfg.legendRich ? `{a|${name}}` : name;
                        value = cfg.legendRich ? ` {b|${value}}` : value;
                        let unit = cfg.legendRich ? `{a|${cfg.unit}}` : cfg.unit;
                        return name + value + unit;
                    },
                    type: cfg.legendScroll ? 'scroll' : 'plain',
                }, cfg.legend),
                tooltip: Object.assign({}, {
                    show: cfg.tooltipShow,
                    trigger: 'item',
                    // 饼图百分比显示计算
                    formatter: function(d) {
                        let num = d.percent;
                        if (d.percent >= 99) { num = '>99' }
                        if (d.percent <= 1) { num = '<1' }
                        return d.seriesName + '<br/>' + d.name + ' : ' + d.value + cfg.unit + ' (' + num + '%)';
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
                }, cfg.tooltip),
                color: cfg.colors,  // 每个区域颜色
                series: [
                    Object.assign({}, {
                        name: cfg.seriesName,
                        type: 'pie',
                        center: cfg.center, // 饼图的圆心坐标
                        radius: cfg.radius, // 饼图的半径
                        roseType: cfg.roseType, // 是否展示成南丁格尔图
                        minAngle: 5, // 最小的扇区角度（0 ~ 360），用于防止某个值过小导致扇区太小影响交互
                        hoverOffset: 10, // 高亮扇区的偏移距离
                        cursor: cfg.tooltipShow ? 'pointer' : 'default', // 鼠标悬浮时在图形元素上时鼠标样式
                        itemStyle: {
                            normal: {
                                borderColor: cfg.itemBorderColor,
                                borderWidth: cfg.itemBorderWidth,
                            },
                        },
                        // 饼图图形上的文本标签
                        label: {
                            normal: {
                                show: cfg.labelLineShow,
                                formatter: v => v.value
                            },
                        },
                        // 标签的视觉引导线样式
                        labelLine: {
                            normal: {
                                show: cfg.labelLineShow,
                            }
                        },
                    }, cfg.series)
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
            vm.option.legend.data = vm.chartData.map(item => item.name);

            // 得到系列数据
            vm.option.series[0].data = vm.chartData.map(item => ({
                value: item.value || null,
                name: item.name || ''
            }));

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
