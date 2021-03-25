<template>
    <el-table v-bind="finalAttrs" v-on="$listeners" :data="data" class="el-table-wrapper" :row-key="rowKey"
              :row-class-name="tableRowClassName" :header-cell-style="headerCellStyle">
        <!-- :render-header="renderHeader" 报 Warn，官方更推荐使用 slot="header" -->
        <el-table-column v-if="cmSelect" width="50">
            <template slot="header" slot-scope="scope">
                <div>
                    <input type="checkbox" hidden :id="tableId + '-select-all'" v-model="isAllSelect"
                           @change="changeAllSelect">
                    <label class="checkbox-inner" :class="{'checked': isAllSelect, 'partChecked': isPartSelect}"
                           :for="tableId + '-select-all'"></label>
                </div>
            </template>
            <template slot-scope="scope">
                <div>
                    <input type="checkbox" hidden :id="tableId + scope.$index" :value="getKey(scope.row,selectKey)"
                           v-model="checkedArr" :disabled="!selectable(scope.row, scope.$index)">
                    <label class="checkbox-inner" :for="tableId + scope.$index"
                           :class="{
                                'checked': checkedArr.includes(scope.row[selectKey]),
                                'disabled': !selectable(scope.row, scope.$index),
                           }" @click="handleSelectionChange(scope.row,selectKey)"></label>
                </div>
            </template>
        </el-table-column>
        <slot></slot>
    </el-table>
</template>

<script>
export default {
    inheritAttrs: false,
    name: 'al-table',
    props: {
        // 表格的数据（对应el-table的data）
        data: {
            default: () => []
        },
        // 行多选(一列选择框)
        cmSelect: {
            default: false
        },
        // tableId主要用于input框及label，如果不传，出现多个有行多选功能的表格时，id会冲突
        tableId: {
            default: 'ak-table'
        },
        // id的访问路径。例如："aa.xx.id" 对应 vm.data[i][aa][xx][id]
        selectKey: {
            default: 'id'
        },
        checkedIds: {
            default: () => []
        },
        checkedDatas: { // 选择了的全部数据
            default: () => []
        },
        // 行数据的 Key，用来优化 Table 的渲染；当设置了这个属性，表格数据更新时已展开行不会折叠
        rowKey: {
            default: ''
        },
        // Function 的返回值用来决定这一行的 CheckBox 是否可以勾选。返回 true:可选，false:不可选。默认都可选
        selectable: {
            type: Function,
            default: () => true,
        },
    },
    data() {
        return {
            finalAttrs: {}, // 用于保存设置默认值之后的$attrs
            // el-table的默认配置项
            defaultConfig: {
                border: true,
                stripe: true
            },
            isAllSelect: false,
            isPartSelect: false, // 部分选择
            currIdArr: [],
            flag: true,
        };
    },
    computed: {
        checkedArr: {
            get: function () {
                return JSON.parse(JSON.stringify(this.checkedIds));
            },
            set: function (value) {
                this.$emit('update:checkedIds', JSON.parse(JSON.stringify(value)));
                this.flag = value.length !== 0; // 将flag状态恢复,为了第二次删除的时候能够正常使用

                // 全选状态
                if (this.data) {
                    this.isAllSelect = this.$isArrContain(value, this.currIdArr) && value.length > 0;
                } else {
                    this.isAllSelect = false;
                }
                // 部分选择
                if (value.length > 0) {
                    // 暂时注释，翻页选择表头样式。
                    /*   let vm = this;
                    this.isPartSelect = value.some(item => {
                        return vm.currIdArr.includes(item);
                    }) && vm.isAllSelect === false; */
                    this.isPartSelect = !this.isAllSelect;
                } else {
                    this.isAllSelect = false;
                    this.isPartSelect = false;
                }
            }
        },
        checkedAllData: { // 选择了的全部数据
            get: function () {
                return JSON.parse(JSON.stringify(this.checkedDatas));
            },
            set: function (value) {
                this.$emit('update:checkedDatas', JSON.parse(JSON.stringify(value)));
            }
        },
    },
    watch: {
        '$attrs': function (value) {
            let vm = this;
            // $attrs虽然可以获取父组件传入的、子组件未声明的props，但是还需要配一些默认值
            vm.finalAttrs = Object.assign({}, vm.defaultConfig, value);
        },
        'data': function (value) {
            let vm = this;
            if (value) {
                vm.currIdArr = [];
                value.forEach((item, index) => {
                    vm.selectable(item, index) && vm.currIdArr.push(vm.getKey(item, vm.selectKey));
                });

                /** 去除翻页选择
                 * 如果目前的页面的id包含选择的id,则为当前页面，比如改变页面的size
                 * 否则为翻页，$emit清空父组件的checkedIds
                 */
                if (this.$isArrContain(vm.currIdArr, vm.checkedArr)) {
                    vm.isAllSelect = this.$isArrEqual(vm.checkedArr, vm.currIdArr) && vm.checkedArr.length > 0;
                    //  vm.isAllSelect = true;
                } else {
                    // 去除翻页选择
                    this.$emit('update:checkedIds', []);
                    this.$emit('update:checkedDatas', []);
                    vm.isAllSelect = false;
                    vm.isPartSelect = false;
                }
                // 部分选择
                if (value.length > 0) {
                    // 暂时注释，翻页选择表头样式。
                    /*  let vm = this;
                    this.isPartSelect = value.some(item => {
                        return vm.currIdArr.includes(item);
                    }) && vm.isAllSelect === false; */
                    // 部分选择 --当不是全部选择并且没有选择，部分全选为true
                    this.isPartSelect = !this.isAllSelect && this.checkedArr.length > 0;
                } else {
                    this.isAllSelect = false;
                    this.isPartSelect = false;
                }
            }
            else {
                vm.isAllSelect = false;
                this.isPartSelect = false;
            }
        },
        // 监听外面传进来数组的变化,如果数组为清空,并且当前为可以第一次更新时,触发checkedArr的set函数
        'checkedIds': function () {
            if (this.checkedIds.length === 0 && this.flag) {
                this.checkedArr = this.checkedArr;
                this.checkedAllData = this.checkedAllData;
                this.flag = false; // 调用checkedArr的更新之后,需要将状态更改,防止checkedArr的更新影响到这个函数再次调用时发生死循环
            }
        },
    },
    mounted: function () {
        let vm = this;
        vm.$nextTick(() => {
            // 判断全选状态
            vm.currIdArr = [];
            vm.data.forEach((item, index) => {
                // 如果有传 selectable 参数，需要先判断当前行是否可选，再入栈到 vm.currIdArr
                vm.selectable(item, index) && vm.currIdArr.push(vm.getKey(item, vm.selectKey));
            });
            if (vm.$attrs) {
                vm.finalAttrs = JSON.parse(JSON.stringify(vm.$attrs));
            } else {
                vm.finalAttrs = {};
            }
            // $attrs虽然可以获取父组件传入的、子组件未声明的props，但是还需要配一些默认值
            for (let i in vm.defaultConfig) {
                if (!vm.finalAttrs.hasOwnProperty(i)) {
                    vm.finalAttrs[i] = vm.defaultConfig[i];
                }
            }
        });
    },
    methods: {
        refresh: function () {
            this.reload();
        },
        /*
        为取到更深层级的key
        * vm.data[i][aa][xx][id]
        * */
        getKey: function (item, keyString) {
            let keyArr = keyString.split('.');
            let temArr = [item[keyArr[0]]];
            for (let i = 1; i < keyArr.length; ++i) {
                temArr.push(temArr[i - 1][keyArr[i]]);
            }
            return temArr[temArr.length - 1];
        },
        // 获取选中状态数据
        handleSelectionChange: function (rowData, keyString) {
            let rowKey = this.getKey(rowData, keyString);
            if (!this.checkedArr.includes(rowKey)) {
                this.checkedAllData.push(rowData);
            } else {
                this.checkedAllData.forEach((list, index) => {
                    if (this.$isObjEqual(list, rowData)) {
                        this.checkedAllData.splice(index, 1);
                    }
                });
            }

            // 直接给vm.checkedAllData赋值为一个对象才能被computed检测到。（$set和$delete不行）
            this.checkedAllData = JSON.parse(JSON.stringify(this.checkedAllData));
        },
        // 改变全选状态
        changeAllSelect() {
            let vm = this;
            if (vm.isAllSelect) {
                vm.currIdArr.forEach(function (value) {
                    if (vm.checkedArr.indexOf(value) === -1) {
                        vm.checkedArr.push(value);
                    }
                });
                vm.checkedAllData = JSON.parse(JSON.stringify(vm.data)); // 全选，把当前的全部数据选择进数组
            } else {
                vm.currIdArr.forEach(function (value) {
                    if (vm.checkedArr.indexOf(value) !== -1) {
                        vm.checkedArr.splice(vm.checkedArr.indexOf(value), 1);
                    }
                });
                vm.checkedAllData = []; // 取消全部选择，清空全部数据
            }
            // 直接给vm.checkedArr赋值为一个对象才能被computed检测到。（$set和$delete不行）
            vm.checkedArr = JSON.parse(JSON.stringify(vm.checkedArr));
        },

        tableRowClassName({ row, rowIndex }) {
            /* 选中当前颜色 */
            let rowClass = '';
            if (this.checkedArr.indexOf(row[this.selectKey]) > -1) {
                rowClass = 'row-checked ';
            }
            this.$emit('rowClassName', { row, rowIndex }, (res) => {
                if (rowIndex === res) {
                    rowClass = 'row-click-open ';
                }
            });
            return rowClass;
        },
        headerCellStyle({ row, column, rowIndex, columnIndex }) {
            // 第一行，如果有选择框则从第一列开始，否则从第0列开始
            if (column.label && rowIndex === 0 && ((this.cmSelect && columnIndex > 0) || !this.cmSelect)) {
                let fontSize = 14; // 表头字体大小
                let length = column.label.length;
                column.minWidth = 55 + length * fontSize;
                return column;
            }
        },
    }
};
</script>

<style lang="scss">
    .el-table.el-table-wrapper {
        border-radius: 4px;
        border-width: 1px;
        border-style: solid;
        /*表头*/
        .el-table__header-wrapper,
        .el-table__fixed-header-wrapper {
            letter-spacing: 2px;
            /*去除表头第一个label的左边距*/
            .cell {
                font-weight: 700;
            }
            th {
                height: 60px;
                border-bottom-width: 2px;
            }
            /*表格的多选框*/
            th div {
                padding: 0;
                height: 22px;
                line-height: 22px;
            }
            /*表头过滤下拉框的箭头*/
            .el-table__column-filter-trigger {
                margin-left: 5px;
                line-height: 22px;
                i {
                    color: #ADB4CF;
                    font-size: 14px;
                    font-weight: 700;
                }
            }
        }
        /*主体*/
        .el-table__body-wrapper,
        .el-table__fixed-body-wrapper {
            .el-table__row td {
                height: 48px;
                border-right: none;
            }
        }
        .cell {
            line-height: 22px;
            padding-left: 16px !important;
        }
        /*label输入框居中*/
        .checkbox-inner {
            vertical-align: middle;
        }
        .el-table__empty-block {
            min-height: 50px;
            line-height: 50px;
        }
        .el-table__expand-column {
            border-right: none;
        }
        .ak-table-expand {
            font-size: 0;
            .el-form-item {
                display: flex;
                margin-right: 0;
                margin-bottom: 10px;
                width: 100%;
            }
            .el-form-item__label {
                color: #3a3a3a;
                font-weight: 600;
            }
            .el-form-item__content, .el-form-item__label {
                line-height: 22px;
            }
        }
    }

    /*.el-table.el-table-maxHeight {
        .cell {
            max-height: 66px;
        }
    }

    .el-table.el-table-ellipsis {
        .cell {
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
        }
    }*/

    /*表格某一列的内容，超出显示省略号，在列的属性上添加 class-name="overflow-title" */
    .el-table .overflow-title .cell {
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
    }

    /*表格筛选弹框样式*/
    .el-table-filter {
        box-shadow: 4px 0px 16px 0px rgba(178, 184, 208, 0.46);
        border: 1px solid #D9DAE6;
        border-radius: 6px;
        .el-table-filter__checkbox-group {
            padding: 0;
            label.el-checkbox {
                padding: 7px 20px;
                margin: 0;
            }
            label.el-checkbox:hover {
                background-color: #D5DBEE;
            }
        }
        .el-table-filter__bottom {
            display: flex;
            justify-content: space-between;
            padding: 8px 16px;
        }
    }

    /*表格组件颜色*/
    .el-table.el-table-wrapper {
        border-color: #CACEDA;
        background-color: #fff;
        /*表头背景色*/
        .el-table__header th {
            background-color: #EAEFF7;
        }
        .el-table__row {
            background-color: #fff;
        }
        /*斑马纹背景色*/
        /*.el-table__row--striped {
            background-color: #EEF2F8;
        }*/
        tr {
            color: #3a3a3a;
        }
        /*表格行悬浮背景色*/
        .el-table__row:hover > td {
            background-color: #ECF4FF !important;
        }
        /*表格行勾选选中背景色*/
        .el-table__row.row-checked > td {
            background-color: #DEECFF !important;
        }
        /*表格行单击选中背景色*/
        .el-table__body tr.current-row > td {
            background: #C4D4F6 !important;
        }
        /*展开行颜色*/
        .el-table__expanded-cell[class*=cell] {
            border-top: 1px solid #CACEDA;
            border-bottom: 1px solid #CACEDA;
        }
    }

    .el-table td,
    .el-table th.is-leaf,
    .el-table--border td,
    .el-table--border th,
    .el-table__body-wrapper .el-table--border.is-scrolling-left ~ .el-table__fixed {
        border-color: #CACEDA;
    }

    .el-table.el-table--striped .el-table__body tr.el-table__row--striped td {
        background-color: transparent;
    }

    /*---表格组件颜色----end*/
</style>

