<template>
  <div id="app">
    <!-- <img alt="Vue logo" src="./assets/logo.png"> -->
    <!-- <HelloWorld/> -->
    <!-- <Table style="width: 800px;height: 500px; margin: 100px"/> -->
    <Test style="width: 500px;height: 500px;magrin-right:60px"/>
    <tree-chart 
        :legendData="dbDetailData.sensDataInfo"
        :height.sync="treeHeight"
        :treeDepth="treeDepth">
    </tree-chart>
    <!-- <Test1 style="width: 500px;height: 500px;"/> -->
    <!-- <Test2 style="width: 600px;height: 500px;"/> -->
    

  </div>
</template>

<script>
// import HelloWorld from './components/HelloWorld.vue'

import Test from './components/Test'
import Test1 from './components/Test1'
// import Test2 from './components/Test2'
import Table from './components/table'
import treeChart from './components/tree-echart'

export default {
  name: 'App',
  components: {
    // HelloWorld,
    Test,
    // Test1,
    // Test2,
    // Table,
    treeChart
  },
  data(){
    return{
      // 树形图展开的层次/深度
      treeDepth:3,
      treeHeight: 160, // 树形图的高度
    }
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
