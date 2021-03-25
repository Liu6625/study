<template>
    <div :id='chartId' style="width:100%; height:100%"></div>
</template>
<script>
let chartseed = 1;
const echarts = require('echarts');
export default {
    data(){
        return{
            chartId:1,
            option:{}
        }
    },
    mounted(){
        this.chartId = 'charts' + chartseed++
        this.$nextTick(()=>{
            this.initOption()
        })
    },
    methods:{
        initOption(){
            let myChart = echarts.init(document.getElementById(this.chartId));
            this.option = {
                title: {
                    text: '风险IP排行（最近30天）'
                },
                grid: {
                    left: '5%',
                    right: '4%',
                    bottom: '3%',
                    containLabel: true
                },
                xAxis: {
                    show: false,
                },
                yAxis: [{
                    type: 'category',
                    inverse: true,
                    axisLine: {
                        show: false,
                    },
                    axisTick: {
                        show: false,
                    },
                    data: ['172.18.58', '192.168.1', '暂无数据', '暂无数据', '暂无数据'],
                },{
                    type: 'category',
                    inverse: true,
                    axisLine: {
                        show: false,
                    },
                    axisTick: {
                        show: false,
                    },
                    data: ['1400', '700', '-', '-', '-'],
                }],
                series: [{
                    type: 'bar',
                    itemStyle: {
                        color: {
                            type: 'linear',
                            x: 0,
                            y: 0,
                            x2: 1,
                            y2: 0,
                            colorStops: [{
                                offset: 0, color: 'rgb(255, 215, 0)' // 0% 处的颜色
                            }, {
                                offset: 1, color: 'rgb(255, 165, 0)' // 100% 处的颜色
                            }]
                        }
                    },
                    data: [1040,700,0,0,0], 
                    showBackground: true,            // 展示背景色
                    backgroundStyle: {               // 设置背景
                        color: 'rgba(180, 180, 180, 0.3)'
                    },
                    barWidth: '20px',           //柱子宽度
                }],

            };
            myChart.setOption(this.option)

        }
    }
}
</script>