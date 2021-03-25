<template>
    <div :id='chartId' style="width:100%; height:100%"></div>
</template>
<script>
console.log(1)
let linkseed = 1;
const echarts = require('echarts');
export default {
    data(){
        return{
            chartId:1,
            option:{}
        }
    },
    mounted(){
        this.chartId = 'chart' + linkseed++
        this.$nextTick(()=>{
            this.initOption()
        })
    },
    methods:{
        initOption(){
            let myChart = echarts.init(document.getElementById(this.chartId));
            this.option = {
                title: {
                    text: '| 安全模型影响的资产分布'
                },
                legend: {
                    right: '20',
                    bottom: '0',
                    show: true,
                    icon: 'circle',
                    data: [{
                        name: '安全模型'
                    }, {
                        name: '资产名',
                    }],
                },
                // grid:{
                //     top:'10%',
                //     left:'3%',
                //     right:'3%',
                //     bottom:'3%'
                // },
                series: [
                    {
                        type: 'graph',
                        layout: 'circular',
                        symbolSize: 30,             // 节点标记的大小
                        roam: true,                 // 是否开启鼠标缩放和平移漫游。
                        circular: {
                            rotateLabel: true, //是否旋转标签
                        },
                        label: {
                            normal: {
                                show: true,
                                position: 'right',
                                formatter: '{b}'
                            }
                        },
                        // edgeSymbol: ['circle', 'arrow'],  // 边两端的标记类型
                        // edgeSymbolSize: [4, 10],             // 边两端的标记大小，可以是一个数组分别指定两端，也可以是单个统一指定
                        animationDurationUpdate: 1500, //数据更新动画的时长。
                        animationEasingUpdate: 'quintcInOut', //数据更新动画的缓动效果
                        edgeLabel: {
                            fontSize: 24
                        },
                        emphasis: {
                            focus: 'adjacency',  // 聚焦关系图中的邻接点和边的图形
                            blurScope: 'series'  // 淡出范围为系列
                        },
                        data: [{
                            name: '节点1',
                            category: 0
                        }, {
                            name: '节点2',
                            category: 0
                        }, {
                            name: '节点3',
                            category: 0
                        }, {
                            name: '节点4',
                            category: 0
                        }, {
                            name: '节点5',
                            category: 1

                        }],
                        // 关系
                        links: [{
                            source: '节点1',
                            target: '节点5',
                            
                        }, {
                            source: '节点2',
                            target: '节点5',
                        },{
                            source: '节点3',
                            target: '节点5',
                        }, {
                            source: '节点4',
                            target: '节点5',
                        }
                        ],
                        categories: [{
                            name: '安全模型'
                        }, {
                            name: '资产名'
                        }],
                        lineStyle: {
                            opacity: 0.9,
                            width: 2,
                            curveness: 0.2
                        }
                    }
                ]
            };
            myChart.setOption(this.option)

        }
    }
}
</script>