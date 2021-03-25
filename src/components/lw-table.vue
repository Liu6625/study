/**
* @Name: ak-table.vue
* @Author: cqfeng
* @Description: 表格组件
* @MainFunction: 基于 el-table 二次封装，详细参数参考 element-ui 官方文档
**/

<template> 
    <el-table class="el-table-wrapper" v-bind="finalAttrs" v-on="$listeners" :data="data" :row-key="rowKey"
              :row-class-name="tableRowClassName" :header-cell-style="headerCellStyle">
        <!--自定义勾选列-->
        <el-table-column v-if="cmSelect " :render-header="renderHeader" width="50">
            <template slot-scope="scope">
                <div>
                    <input type="checkbox" hidden :id="tableId + scope.$index" :value='getKey(scope.row,selectKey)'
                           v-model='checkedArr' :disabled="!!(forbidSelectKey && scope.row[forbidSelectKey])">
                    <label class="checkbox-inner"
                           :class="{
                                'checked': checkedArr.includes(scope.row[selectKey]) && !(forbidSelectKey && scope.row[forbidSelectKey]),
                                'disabled': !!(forbidSelectKey && scope.row[forbidSelectKey])
                            }"
                           :for="tableId + scope.$index" @click="handleSelectionChange(scope.row,selectKey)">
                    </label>
                </div>
            </template>
        </el-table-column>

        <slot></slot>
    </el-table>
</template>

<script>
import utils from '@/assets/js/common/utils';

let idSeed = 1; // 默认 id 为1，多次加载组件时，id 会自增，避免重复 id
export default {
    inheritAttrs: false, // 禁用 Attribute 继承
    name: 'ak-table',
    props: {
        // 表格的数据（对应el-table的data）
        data: {
            required: true,
            type: Array,
            default: () => []
        },
        // 是否启用行多选(自定义勾选列)
        cmSelect: {
            required: false,
            type: Boolean,
            default: () => false,
        },
        // 配合 cmSelect 使用，启用行多选时，该值是唯一标识的属性名，通过属性名取到的值，会放入 checkedIds 数组中
        selectKey: {
            required: false,
            type: String,
            default: () => 'id',
        },
        // 配合 cmSelect 使用，启用行多选时，该值是禁止行勾选标识的属性名。
        // 通过该属性名取到的属性值为真（例：true,'1',1。注意：取值为 '0' 时也为真，因为是字符串），代表要禁用。
        forbidSelectKey: {
            required: false,
            type: String,
            default: () => ''
        },
        // 配合 selectKey 使用，保存已勾选行的唯一标识值的集合
        checkedIds: {
            required: false,
            default: () => []
        },
        // 配合 selectKey 使用，保存已勾选行的数据
        checkedData: {
            required: false,
            default: () => []
        },
        // 行数据的 Key，用来优化 Table 的渲染；当设置了这个属性，表格数据更新时已展开行不会折叠（具体参考 element-ui 官方文档）
        rowKey: {
            required: false,
            type: String,
            default: () => ''
        },
    },
    data() {
        return {
            tableId: '1', // 默认 id 为1
            finalAttrs: {}, // 组件最终配置项，合并了默认配置项和父组件传进来的配置项
            // 组件默认配置项
            defaultConfig: {
                border: true,
                stripe: true
            },
            isAllSelect: false, // 表格是否全选
            isPartSelect: false, // 表格是否部分选
            allSelectIds: [], // 表格所有可选行的唯一标识值的集合
            flag: true, // 一个标识，当清空了 checkedArr 数组，并且 flag 是 true，则触发 checkedArr 的set函数
        };
    },
    computed: {
        // 已勾选行的唯一标识值的集合，更新该值时更新表格全选和部分选的状态
        checkedArr: {
            get: function () {
                return JSON.parse(JSON.stringify(this.checkedIds));
            },
            set: function (value) {
                this.$emit('update:checkedIds', JSON.parse(JSON.stringify(value)));
                this.flag = value.length !== 0; // 将flag状态恢复,为了第二次删除的时候能够正常使用

                // 全选状态
                if (this.data) {
                    this.isAllSelect = utils.isContained(value, this.allSelectIds) && value.length > 0;
                } else {
                    this.isAllSelect = false;
                }
                // 部分选择
                if (value.length > 0) {
                    // 暂时注释，翻页选择表头样式。
                    /*   let vm = this;
                            this.isPartSelect = value.some(item => {
                                return vm.allSelectIds.includes(item);
                            }) && vm.isAllSelect === false; */
                    this.isPartSelect = !this.isAllSelect;
                } else {
                    this.isAllSelect = false;
                    this.isPartSelect = false;
                }
            }
        },
        // 保存已勾选行的数据
        checkedAllData: {
            get: function () {
                return JSON.parse(JSON.stringify(this.checkedData));
            },
            set: function (value) {
                this.$emit('update:checkedData', JSON.parse(JSON.stringify(value)));
            }
        },
    },
    watch: {
        // $attrs 是父组件传到子组件的参数
        '$attrs': function (value) {
            let vm = this;
            // 合并默认参数与父组件传进来的参数
            vm.finalAttrs = Object.assign({}, vm.defaultConfig, value);
        },
        // 表格数据更新之后，更新可勾选行数据以及勾选状态
        'data': function (value) {
            let vm = this;
            if (value) {
                vm.allSelectIds = [];
                value.forEach(function (item) {
                    // 判断是否是可勾选行：当不开启 forbidSelectKey 属性 或 开启 forbidSelectKey 属性后通过 forbidSelectKey 取到的值不为真
                    if (!vm.forbidSelectKey || !item[vm.forbidSelectKey]) {
                        // 保存可勾选行的数据
                        vm.allSelectIds.push(vm.getKey(item, vm.selectKey));
                    }
                });

                /** 去除翻页选择
                 * 如果目前的页面的id包含选择的id,则为当前页面，比如改变页面的size
                 * 否则为翻页，$emit清空父组件的checkedIds
                 */
                if (utils.isContained(vm.allSelectIds, vm.checkedArr)) {
                    vm.isAllSelect = (utils.isArrEqual(vm.checkedArr, vm.allSelectIds) && vm.checkedArr.length > 0) ? true : false;
                    //  vm.isAllSelect = true;
                } else {
                    // 去除翻页选择
                    this.$emit('update:checkedIds', JSON.parse(JSON.stringify([])));
                    this.$emit('update:checkedData', JSON.parse(JSON.stringify([])));
                    vm.isAllSelect = false;
                    vm.isPartSelect = false;
                }
                // 部分选择
                if (value.length > 0) {
                    // 暂时注释，翻页选择表头样式。
                    /*  let vm = this;
                    this.isPartSelect = value.some(item => {
                        return vm.allSelectIds.includes(item);
                    }) && vm.isAllSelect === false; */
                    // 部分选择 --当不是全部选择并且没有选择，部分全选为true
                    this.isPartSelect = (!this.isAllSelect && this.checkedArr.length > 0) ? true : false;
                } else {
                    this.isAllSelect = false;
                    this.isPartSelect = false;
                }
            } else {
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
    created() {
        // id 自增
        this.tableId = String(idSeed++);
    },
    mounted: function () {
        let vm = this;
        vm.$nextTick(() => {
            // 判断全选状态
            vm.allSelectIds = [];
            vm.data.forEach(item => {
                // 判断是否是可勾选行：当不开启 forbidSelectKey 属性 或 开启 forbidSelectKey 属性后通过 forbidSelectKey 取到的值不为真
                if (!vm.forbidSelectKey || !item[vm.forbidSelectKey]) {
                    // 保存可勾选行的数据
                    vm.allSelectIds.push(vm.getKey(item, vm.selectKey));
                }
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
        // 为取到更深层级的key
        // vm.data[i][aa][xx][id]
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
                    if (utils.isObjEqual(list, rowData)) {
                        this.checkedAllData.splice(index, 1);
                    }
                });
            }

            // 直接给vm.checkedAllData赋值为一个对象才能被computed检测到。（$set和$delete不行）
            this.checkedAllData = JSON.parse(JSON.stringify(this.checkedAllData));
        },
        // 生成自定义勾选列的表头
        renderHeader(createElement, { column, _self }) {
            let vm = this;
            return createElement(
                'div',
                {
                    'class': 'header-center header-frist-child',
                },
                [
                    createElement(
                        'input',
                        {
                            'class': 'header-center',
                            style: {
                                display: 'none'
                            },
                            attrs: {
                                type: 'checkbox',
                                id: vm.tableId + '-select-all',
                            },
                            domProps: {
                                checked: vm.isAllSelect
                            },
                            on: {
                                change: function (event) {
                                    vm.isAllSelect = event.target.checked;
                                    if (event.target.checked) {
                                        vm.allSelectIds.forEach(function (value) {
                                            if (vm.checkedArr.indexOf(value) === -1) {
                                                vm.checkedArr.push(value);
                                            }
                                        });
                                        vm.checkedAllData = JSON.parse(JSON.stringify(vm.data)); // 全选，把当前的全部数据选择进数组
                                    } else {
                                        vm.allSelectIds.forEach(function (value) {
                                            if (vm.checkedArr.indexOf(value) !== -1) {
                                                vm.checkedArr.splice(vm.checkedArr.indexOf(value), 1);
                                            }
                                        });
                                        vm.checkedAllData = []; // 取消全部选择，清空全部数据
                                    }
                                    // 直接给vm.checkedArr赋值为一个对象才能被computed检测到。（$set和$delete不行）
                                    vm.checkedArr = JSON.parse(JSON.stringify(vm.checkedArr));
                                }
                            }
                        }, []),
                    createElement(
                        'label',
                        {
                            'class': {
                                'header-center': true,
                                'checkbox-inner': true,
                                'partChecked': vm.isPartSelect,
                                // 判断每页data第一项是否是默认属性,看情况增加checked和disabled样式
                                'checked': vm.data.length && vm.isAllSelect && !vm.data[0][this.forbidSelectKey],
                                'disabled': !vm.data.length || vm.data[0][this.forbidSelectKey],
                            },
                            attrs: {
                                for: vm.tableId + '-select-all',
                            }
                        }, [''])
                ]
            );
        },

        // 返回表格行类名
        tableRowClassName({ row, rowIndex }) {
            /* 选中当前颜色 */
            let rowClass = '';
            if (this.checkedArr.indexOf(row[this.selectKey]) > -1) {
                rowClass = 'row-checked';
            }
            this.$emit('rowClassName', { row, rowIndex }, (res) => {
                if (rowIndex === res) {
                    rowClass = 'row-click-open';
                }
            });
            return rowClass;
        },

        // 表头单元格的 style 的回调方法
        headerCellStyle({ row, column, rowIndex, columnIndex }) {
            // 如果单元格有值，并且是表头的单元格，并且不是勾选列的表头单元单元格，则设置单元格样式
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
            padding: 9px 0;
        }

        /*表格的多选框*/
        th div {
            padding: 0;
            height: 22px;
            line-height: 22px;
        }
    }

    /*主体*/
    .el-table__body-wrapper,
    .el-table__fixed-body-wrapper {
        .el-table__row td {
            padding: 9px 0;
            border: 0;
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

    .checkbox-inner.disabled {
        background: #ebeef5;
        cursor: not-allowed;
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

.el-table.el-table-maxHeight {
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
    border-color: #b9becb;
    background-color: #fff;

    .el-table__header th {
        background-color: #E3E6EC;
    }

    .el-table__row {
        background-color: #fff;
    }

    .el-table__row--striped {
        background-color: #EEF2F8;
    }

    tr {
        color: #3a3a3a;
    }

    .el-table__row:hover > td {
        background-color: #ECF4FF !important;
    }

    .row-checked {
        background-color: #DEECFF !important;
    }

    .el-table__expanded-cell[class*=cell] {
        border-top: 1px solid #ebeef5;
        border-bottom: 1px solid #ebeef5;
    }
}

.el-table td,
.el-table th.is-leaf,
.el-table--border td,
.el-table--border th,
.el-table__body-wrapper .el-table--border.is-scrolling-left ~ .el-table__fixed {
    border-color: #fff;
}

.el-table.el-table--striped .el-table__body tr.el-table__row--striped td {
    background-color: transparent;
}

/*---表格组件颜色----end*/
</style>
