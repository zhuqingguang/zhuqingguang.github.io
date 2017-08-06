---

layout: post

title: "深刻理解Vue的组件01"

date: 2017-08-06

categories: [Web]


---

* content
{:toc}

今天看了下Vue上关于组件的教程，感觉内容还挺多，现在把组件中基本的知识梳理一下。
<!-- more -->
{% raw %}
## 组件的基本使用
### 注册组件
注册组件就是利用``Vue.component()``方法，先传入一个自定义组件的名字，然后传入这个组件的配置。
```js
 Vue.component('mycomponent',{
    template: `<div>这是一个自定义组件</div>`,
    data () {
      return {
        message: 'hello world'
      }
    }
  })
```
如上方式，就已经创建了一个自定义组件，然后就可以在Vue实例挂在的DOM元素中使用它。
```js
 <div id="app">
    <mycomponent></mycomponent> 
    <my-component></my-component>
</div>
<script>
  var app = new Vue({
    el: '#app',
    data: {
    },
    components: {
      'my-component': {
        template: `<div>这是一个局部的自定义组件，只能在当前Vue实例中使用</div>`,
      }
    }
  })
</script>
```

直接使用``Vue.component()``创建的组件，所有的Vue实例都可以使用。还可以在某个Vue实例中注册只有自己能使用的组件。
```js
var app = new Vue({
    el: '#app',
    data: {
    },
    components: {
      'my-component': {
        template: `<div>这是一个局部的自定义组件，只能在当前Vue实例中使用</div>`,
      }
    }
  })
```
### 模板的要求
**注意**：组件的模板只能有一个根元素。下面的情况是不允许的。
```
template: `<div>这是一个局部的自定义组件，只能在当前Vue实例中使用</div>
			<button>hello</button>`,
```
### 组件中的data必须是函数
可以看出，注册组件时传入的配置和创建Vue实例差不多，但也有不同，其中一个就是``data``属性必须是一个函数。
这是因为如果像Vue实例那样，传入一个对象，由于JS中对象类型的变量实际上保存的是对象的``引用``，所以当存在多个这样的组件时，会共享数据，导致一个组件中数据的改变会引起其他组件数据的改变。

而使用一个返回对象的函数，每次使用组件都会创建一个新的对象，这样就不会出现**共享数据**的问题来了。

### 关于DOM模板的解析
当使用 DOM 作为模版时 (例如，将 el 选项挂载到一个已存在的元素上), 你会受到 HTML 的一些限制，因为 Vue 只有在浏览器解析和标准化 HTML 后才能获取模板内容。尤其像这些元素 ``<ul>``，``<ol>``，``<table>``，``<select>`` 限制了能被它包裹的元素，而一些像 ``<option> ``这样的元素只能出现在某些其它元素内部。

在自定义组件中使用这些受限制的元素时会导致一些问题，例如：
```html
<table>
  <my-row>...</my-row>
</table>
```
自定义组件 ``<my-row>`` 被认为是无效的内容，因此在渲染的时候会导致错误。这时应使用特殊的 ``is`` 属性：
```html
<table>
  <tr is="my-row"></tr>
</table>
```

也就是说，标准HTML中，一些元素中只能放置特定的子元素，另一些元素只能存在于特定的父元素中。比如``table``中不能放置``div``，``tr``的父元素不能``div``等。所以，当使用自定义标签时，标签名还是那些标签的名字，但是可以在标签的``is``属性中填写自定义组件的名字。

**应当注意，如果您使用来自以下来源之一的字符串模板，这些限制将不适用：**
- ``<script type="text/x-template">``
- JavaScript 内联模版字符串
- ``.vue`` 组件
其中，前两个模板都不是Vue官方推荐的，所以一般情况下，只有单文件组件``.vue``可以忽略这种情况。

## 组件的属性和事件
在html中使用元素，会有一些属性，如``class``,``id``，还可以绑定事件，自定义组件也是可以的。当在一个组件中，使用了其他自定义组件时，就会利用子组件的**属性**和**事件**来和父组件进行数据交流。
<img src="/assets/images/props-events.png"/>

如上如所示，父子组件之间的通信就是** props down, events up**，父组件通过 属性**props** 向下传递数据给子组件，子组件通过 事件**events** 给父组件发送消息。

## 属性Props
Vue组件通过``props``属性来声明一个自己的属性，然后父组件就可以往里面传递数据。
```js
Vue.component('mycomponent',{
    template: '<div>这是一个自定义组件,父组件传给我的内容是：{{myMessage}}</div>',
    props: ['myMessage'],
    data () {
      return {
        message: 'hello world'
      }
    }
  })
```
然后调用该组件
```html
<div id="app">
    <mycomponent my-message="hello"></mycomponent>
</div>
```
**注意**，由于HTML特性是不区分大小写的，所以传递属性值时，``myMessage``应该转换成 kebab-case (短横线隔开式)``my-message="hello"``。

### v-bind绑定属性值
这里说一下``v-bind``绑定属性值的一个特性：一般情况下，使用``v-bind``给元素特性(attribute)传递值时，Vue会将``""``中的内容当做一个表达式。
比如：
```html
<div attr="message">hello</div>
```
上面这样，``div``元素的``attr``特性值就是``message``。

而这样
```js
<div v-bind:attr="message">hello</div>
```
这里的``message``应该是Vue实例的data的一个属性，这样``div``元素的``attr``特性值就是``message``这个属性的值。

### 动态绑定特性值
根据上面，所以想要把父组件的属性绑定到子组件，应该使用``v-bind``，这样，父组件中数据改变时能反映到子组件。
注意，这样会把

{% endraw %}
