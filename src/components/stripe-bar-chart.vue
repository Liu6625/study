<template>
    <div class="container">
        <div class="item-container" v-for="(item, index) in data" :key="index">
            <div class="bar-item">
                <p class="bar-text bar-value">{{item.value}}</p>
                <div class="bar-inner" :class="['bar-inner' + (index + 1)]" :style="{'height': innerHeights[index]}"
                    @click="barInnerClick(item)"></div>
            </div>
            <p class="bar-text bar-name" :title="item.name" @click="barNameClick(item)">{{item.name}}</p>
        </div>
    </div>
</template>

<script>
export default {
    name: 'stripe-bar-chart',
    props: {
        // 图表数据
        // 格式举例：[{name: 'Mon', value: 120},{name: 'Tue', value: 200},{name: 'Wed', value: 150}]
        data: {
            type: Array,
            default: () => []
        },
        // 图表配置项
        config: {
            type: Object,
            default: () => {}
        },
    },
    data() {
        return {

        };
    },
    computed: {
        // 动态获取每个柱子的高度，返回一个数组
        innerHeights() {
            let vm = this;
            if (!vm.data || vm.data.length === 0) return [];
            let values = vm.data.map(item => item.value);
            let total = values.reduce((a, c) => a + c, 0);
            return values.map(v => {
                let percent = Math.round((v / total) * 100);
                // 柱子高度最小为 3%
                return (total === 0 || v === 0) ? '0%' : (percent < 3 ? '3%' : percent + '%');
            });
        }
    },
    methods: {
        barInnerClick(params) {
            this.$emit('chartClick', params);
        },
        barNameClick(params) {
            this.$emit('nameClick', params);
        },
    }
};
</script>

<style scoped lang="scss">
    .container {
        display: inline-flex;
        align-items: center;
        justify-content: space-around;
        width: 100%;
        height: 100%;
    }
    // 设置盒子宽度，使下方文字宽度随盒子显示(设置盒子固定20%，限定数据个数五个)
    .item-container{
        display:flex;
        width:20%;
        height:100%;
        flex-direction:column;
        align-items: center;
        justify-content: center;
        .bar-name {
            display: inline-block;
            width: 90%;
            overflow: hidden;
            text-align: center;
            font-size: 14px;
            text-overflow: ellipsis;
            white-space: nowrap;
            padding-top: 10px;
            color: #32BBE0;
            cursor: pointer;
        }
    }
    .bar-item {
        /*overflow: hidden;*/
        position: relative;
        display: inline-block;
        width: 40px;
        height: 70%;
        border-radius: 6px;
        background-image: linear-gradient(
                135deg,
                #e6e6e6 0, #e6e6e6 20%, #ededed 20%, #ededed 50%,
                #e6e6e6 50%, #e6e6e6 70%, #ededed 70%, #ededed
        );
        background-size: 30px 30px;
        .bar-text {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            position: absolute;
            left: 50%;
            transform: translateX(-50%);
            max-width: 84px;
            font-size: 14px;
            text-align: center;
        }
        .bar-value {
            top: -26px;
        }
        .bar-inner {
            position: absolute;
            left: 0;
            right: 0;
            bottom: 0;
            width: 100%;
            border-radius: 0 0 6px 6px;
            background-size: 30px 30px;
            cursor: pointer;
        }
    }

    .empty-data {
        font-size: 14px;
    }

    .bar-inner1 {
        background-image: linear-gradient(135deg,
            #f4404e 0, #f4404e 30%, #ff5764 30%, #ff5764 50%,
            #f4404e 50%, #f4404e 80%, #ff5764 80%, #ff5764);
    }
    .bar-inner2 {
        background-image: linear-gradient(135deg,
            #f15a24 0, #f15a24 30%, #f97850 30%, #f97850 50%,
            #f15a24 50%, #f15a24 80%, #f97850 80%, #f97850
        );
    }
    .bar-inner3 {
        background-image: linear-gradient(135deg,
            #e770f9 0, #e770f9 30%, #e793f9 30%, #e793f9 50%,
            #e770f9 50%, #e770f9 80%, #e793f9 80%, #e793f9
        );
    }
    .bar-inner4 {
        background-image: linear-gradient(135deg,
            #00b7e5 0, #00b7e5 30%, #31c5e8 30%, #31c5e8 50%,
            #00b7e5 50%, #00b7e5 80%, #31c5e8 80%, #31c5e8
        );
    }
    .bar-inner5 {
        background-image: linear-gradient(135deg,
            #1cd1a1 0, #1cd1a1 30%, #8de2c7 30%, #8de2c7 50%,
            #1cd1a1 50%, #1cd1a1 80%, #8de2c7 80%, #8de2c7
        );
    }
</style>
