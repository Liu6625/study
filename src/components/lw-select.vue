/**
* @Name: ak-select.vue
* @Author: 
* @Description: 下拉选择框组件
* @MainFunction: 基于 el-select 二次封装，详细参数参考 element-ui 官方文档
**/

<template>
    <el-select class="select-validation" v-model="modalValue" size="mini" ref="selectInput"
               v-bind="finalAttrs" v-on="$listeners">
        <slot></slot>
    </el-select>
</template>

<script>
export default {
    name: 'lw-select',
    props: {
        // 绑定父组件传入的下拉选择框的值
        model: {
            required: true,
            default: () => '',
        },
        // 下拉选项框最大可输入文字长度
        maxlength: {
            required: false,
            default: () => null,
        },
    },
    data: function () {
        return {
            // 组件默认配置项
            defaultConfig: {
                multiple: false,
                placeholder: '请选择'
            },
        };
    },
    computed: {
        // 下拉选择框的值
        modalValue: {
            get: function () {
                return this.model;
            },
            set: function (value) {
                this.$emit('update:model', value);  //v-model.sync 传递给父组件
            }
/**                 
            <!--v-model写法--> 一般针对于表单事件
            <my-component type="text" v-model="value">
            <!--展开语法糖后的写法-->
            <my-component type="text"
            :value="value"
            @input="value = $event.target.value"
            >
                    <!--
                    默认针对原生组件input事件，但是如果子组件定义了针对事件
                    model: {
                            prop: "value",
                            event: "update"
                    },

            则编译为
            
            <my-component type="text"
            :value="value"
            @update="(val) => value = val"
            >

--------------------------------------------------------------------------------

            <!--语法糖.sync-->
            <my-component :value.sync="value" />
            <!--编译后的写法-->
            <my-component 
                :value="msg" 
                @update:value="(val) => value = val"
            >

--------------------------------------------------------------------------------

            Vue 提供了一个 $listeners 属性，它是一个对象，里面包含了作用在这个组件上的所有监听器。
                            $listeners它是一个对象，里面包含了作用在这个组件上所有的监听器（监听事件），
                            并且可以通过 v-on="$listeners" 将事件监听指向这个组件内的子元素（包括内部的子组件）
                            
                            $attrs包含了所以父组件在子组件上设置的属性（除了prop传递的属性、class 和 style ）

 */                 
            
        },
        // 组件最终配置项，合并了默认配置项和父组件传进来的配置项
        finalAttrs: function () {
            return Object.assign({}, this.defaultConfig, this.$attrs);
        }
    },
    mounted: function () {
        this.$nextTick(() => {
            // 当传入 maxlength 时
            if (this.maxlength) {
                this.addMaxLength();
            }
        });
    },
    methods: {
        // 给下拉选择框中的输入框限制输入文字长度（开启 filterable 属性时可输入）
        addMaxLength: function () {
            // 获取到input的dom节点
            let selectDom;
            // 多选框和单选框的类名不一样
            if (this.finalAttrs.multiple) {
                selectDom = this.$refs.selectInput.$el.getElementsByClassName('el-select__input')[0];
            } else {
                selectDom = this.$refs.selectInput.$el.getElementsByClassName('el-input__inner')[0];
            }
            selectDom.setAttribute('maxlength', this.maxlength);
        }
    }
};
</script>

<style lang="scss">
.el-select {
    min-width: 85px;
    min-height: 30px;
    border-radius: 4px;

    .el-input {
        height: 100%;
    }

    .el-input__inner {
        min-height: 30px;
    }

    .el-input__suffix {
        height: 100%;
        line-height: 1;
    }

    .el-select__caret {
        line-height: 1;
    }
}

//鼠标悬浮当前行，显示部分内容
.hover-show-wrap:hover {
    &.el-select-dropdown__item {
        padding-right: 5px;
    }
}

//下拉框数据配置跳转
.config-option {
    padding-left: 20px;
    border: 1px dotted #a3bae9;
    font-size: 14px;
    color: #3329ff;
    background-color: #c8d8fd;
    cursor: pointer;
}

/*选中的数据在输入框内不换行*/
.el-select[multiple = 'multiple'] {
    height: 30px;

    input {
        height: 100% !important;
    }

    .el-select__tags {
        height: 30px;

        > span {
            display: inline-block;
            overflow: hidden;
            display: inherit;
            align-items: center;
            height: 100%;
            white-space: nowrap;
            line-height: 30px;
        }
    }
}

/* 下拉框 */
.el-select-dropdown {
    border-color: #D9DAE6;
    box-shadow: 0px 4px 16px 0px rgba(178, 184, 208, 0.46);
}

.el-select-dropdown__item.hover {
    background-color: #e8ecfd;
}

.el-select-dropdown__item.selected {
    color: #549cff;
}

.el-select .el-input.is-focus .el-input__inner {
    border-color: #6ca0ff;
}

.el-select .el-input.is-disabled .el-input__inner,
.el-select .el-input.is-disabled .el-input__inner:hover {
    background-color: #EFF2F6;
    border-color: #D2D4DE;
}

/*下拉多选的tag背景色*/
.el-select .el-tag {
    background-color: #e7e8ea;
}

.el-input__inner {
    border: 1px solid #D2D4DE;
    background-color: transparent;
    color: #3a3a3a;
}

.el-popper[x-placement^=bottom] .popper__arrow {
    border-bottom-color: #d1d7ec;
}

.el-select-dropdown__empty {
    padding: 50px 0;
}

.el-select__input:disabled {
    background-color: transparent;
}
</style>
