---

layout: post

title: "深刻理解Vue的组件"

date: 2017-08-06

categories: [Web]


---

* content
{:toc}

今天看了下Vue上关于组件的教程，感觉内容还挺多，现在把组件中基本的知识梳理一下。
<!-- more -->

<script src="https://unpkg.com/vue@2.4.2"></script>
## 组件的基本使用
### 注册组件
注册组件就是利用``Vue.component()``方法，先传入一个自定义组件的名字，然后传入这个组件的配置。
```js

 Vue.component('mycomponent',{
    template: '<div>这是一个自定义组件,message的内容是：{{message}}</div>',
    data () {
      return {
        message: 'hello world'
      }
    }
  })
```
如上方式，就已经创建了一个自定义组件，然后就可以在Vue实例挂在的DOM元素中使用它。
<div id="app">
    <mycomponent></mycomponent>
</div>
<script>
      Vue.component('mycomponent',{
        template: '<tr>这是一个自定义组件,message的内容是：{{message}}</tr>',
        data () {
          return {
            message: 'hello world'
          }
        }
      })
      var app = new Vue({
        el: '#app',
        data: {
        },
        components: {
          'my-component': {
            template: `<div>
              这是一个局部的自定义组件，只能在当前Vue实例中使用
            </div>`,
          }
        }
      })
</script>
