<template>
    <div :id='chartId' style="width: 100%;height: 100%;"></div>
</template>
<script>
const echarts = require('echarts')
let seed = 1
export default {
    data(){
        return{
            chartId: 1,
            option: {},
        }
    },
    mounted(){
        this.chartId = 'echart' + seed++;
        this.$nextTick(() => {
            this.initOption();
        })
        
        // this.ready()

    },
    methods:{
        initOption(){
            let myChart = echarts.init(document.getElementById(this.chartId));
            this.option = {
                backgroundColor: '#0E1E59',
				tooltip: {
					formatter: "{a} <br/>{b} : {c}%"
				},
				series: [
				{
					type: 'gauge',
					radius: '70%',
					pointer: {
						show: false
					},
					detail: {
						formatter: function(value) {
							var num = Math.round(value);
							return '{bule|' + num + '}{white|分}' + '{size|' + '}\n{radius|综合健康评分}';
						},
						rich: {
                            white: {
                                fontSize: 25,
                                color: '#fff',
                                fontWeight: '500',
                                padding: [-150, 0, 0, 0]
                            },
                            bule: {
                                fontSize: 60,
                                fontFamily: 'DINBold',
                                color: '#fff',
                                fontWeight: '700',
                                padding: [-130, 0, 0, 0],
                            },
                            radius: {
                                width: 200,
                                height: 60,
                                lineHeight:80,
                                borderWidth: 1,
                                borderColor: '#0092F2',
                                fontSize: 25,
                                color: '#fff',
                                backgroundColor: '#1B215B',
                                borderRadius: 15,
                                textAlign: 'center',
                            },
                            size: {
                                height: 320,
                                padding: [100, 0, 0, 0]
                            }
                        },
						offsetCenter: ['0%', "60%"],
					},
					data: [{
                        value: 91,
                        name: '综合健康评分'
                    }],
					title: {
						show: false,
					},
					axisLine: {
						show: true,
						lineStyle: {
							color: [
                                [0.91, 
                                // 获取渐变色
                                new echarts.graphic.LinearGradient(0, 0, 1, 0, [{
                                        offset: 0,
                                        color: '#FE5628' // 0% 处的颜色
                                    },
                                    {
                                        offset: 0.5,
                                        color: '#E4D91F' // 100% 处的颜色
                                    },
                                    {
                                        offset: 1,
                                        color: '#30FC87' // 100% 处的颜色
                                    }
                                ])],
                                [1, '#162D6B']
                            ],
							width: 25,
							shadowOffsetX: 0,
							shadowOffsetY: 0,
							opacity: 1
						}
					},
					axisTick: {
						show: false
					},
					splitLine: {
						show: false,
					},
					axisLabel: {
						show: false
					},
				},{
					type: 'gauge',
					name: '外层线',
					radius: '74%',
					pointer: {
						show: false
					},
					detail: {
						show: false,
					},
					axisLine: {
						show: true,
						lineStyle: {
							color: [
								[1, '#098BA2']
							],
							width: 2,
						}
					},
					axisTick: {
						show: false
					},
					splitLine: {
						show: false,
					},
					axisLabel: {
						show: false
					}
				},
				{
					name: '轴线刻度', //轴线刻度
					type: 'gauge',
					radius: '58%',
					axisLine: { // 轴线
						lineStyle: {
							color: [
								[1, '#018DFF']
							],
							width: 2,
						}
					},
					splitLine: {//刻度节点线
						length: 8,
						lineStyle: {
							width: 2,
							color: 'rgba(1,244,255, 0.9)'
						},
						distance: 0 //刻线距离
					},
					axisLabel: {
						show: false
					},
					pointer: {
						show: false
					},
					axisTick: {
						show: false
					},
					detail: {
						show: 0
					}
				},
				{ //内圆
					type: 'pie',
					radius: '60%',
					center: ['50%', '50%'],
					z: 1,
					itemStyle: {
						normal: {
							color: new echarts.graphic.RadialGradient(.5, .5, .8, [{
									offset: 0,
									color: '#0738D3'
								},
								{
									offset: .5,
									color: '#0F266C'
								},
								{
									offset: 1,
									color: '#0E1C4B'
								}
							], false),
							label: {
								show: false
							},
							labelLine: {
								show: false
							}
						},
					},
					hoverAnimation: false,
					label: {
						show: false,
					},
					tooltip: {
						show: false
					},
					data: [100],
				},]
            };
            
            myChart.setOption(this.option);
        }
    }
}
</script>