<template>
    <div :id="chartId" style="width:100%;height:100%" />
</template>
<script>
const echarts = require('echarts')
// import echarts from 'echarts';
let chartIdSeed = 1
export default {
    name:'chart',
    // 接受传来的参数
    props:{},
    data(){
        return{
            option:{},
            chartId:1
        }
    },
    created(){
        this.chartId = 'chart' + chartIdSeed++
        this.$nextTick(() =>{
            this.initEcharts();
        })
        //  要放在$nextTick中调用，否则此时dom还没渲染完成
    },
    // mounted() {
    //     this.initEcharts();
    // },
    methods:{
        initEcharts(){
            // 获取dom节点，初始化图标
            const myChart = echarts.init(document.getElementById(this.chartId))
            // 设置配置项，绘制图表
            this.option = {
                // 标题组件
                title: {
                    text: '折线图堆叠'
                },
                // 提示框组件
                tooltip: {
                    // 'axis' 坐标轴触发，主要在柱状图，折线图等会使用类目轴的图表中使用
                    // 'item' 数据项图形触发，主要在散点图，饼图等无类目轴的图表中使用
                    trigger: 'axis'
                },
                // 图例组件
                legend: {
                    data: ['邮件营销', '联盟广告', '视频广告', '直接访问', '搜索引擎']
                },
                // 直角坐标系内绘图网格，单个 grid 内最多可以放置上下两个 X 轴，左右两个 Y 轴。可以在网格上绘制折线图，柱状图，散点图（气泡图）
                grid: {
                    left: '3%',
                    right: '4%',
                    bottom: '3%',
                    // grid 区域是否包含坐标轴的刻度标签
                    containLabel: true
                },
                // 工具栏 内置有导出图片，数据视图，动态类型切换，数据区域缩放，重置五个工具。
                toolbox: {
                    feature: {
                        // 保存图片
                        saveAsImage: {}
                    }
                },
                // 直角坐标系 grid 中的 x 轴，一般情况下单个 grid 组件最多只能放上下两个 x 轴，多于两个 x 轴需要通过配置 offset 属性防止同个位置多个 x 轴的重叠
                xAxis: {
                    type: 'category',
                    boundaryGap: false,
                    data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
                },
                // 直角坐标系 grid 中的 y 轴，一般情况下单个 grid 组件最多只能放左右两个 y 轴，多于两个 y 轴需要通过配置 offset 属性防止同个位置多个 Y 轴的重叠。
                yAxis: {
                    type: 'value'
                },
                // 系列列表  每个系列通过 type 决定自己的图表类型 ：line：折线/面积图  bar：柱状图   pie：饼图   scatter：散点（气泡）图
                series: [
                    {
                        name: '邮件营销',
                        type: 'line',
                        // 数据堆叠，同个类目轴上系列配置相同的stack值后，后一个系列的值会在前一个系列的值上相加。
                        stack: '总量',
                        data: [120, 132, 101, 134, 90, 230, 210]
                    },
                    {
                        name: '联盟广告',
                        type: 'line',
                        stack: '总量',
                        data: [220, 182, 191, 234, 290, 330, 310]
                    },
                    {
                        name: '视频广告',
                        type: 'line',
                        stack: '总量',
                        data: [150, 232, 201, 154, 190, 330, 410]
                    },
                    {
                        name: '直接访问',
                        type: 'line',
                        stack: '总量',
                        data: [320, 332, 301, 334, 390, 330, 320]
                    },
                    {
                        name: '搜索引擎',
                        type: 'line',
                        stack: '总量',
                        data: [820, 932, 901, 934, 1290, 1330, 1320]
                    }
                ]
            };
            // 绘制图表
            myChart.setOption(this.option)
        }
    }
}
</script>