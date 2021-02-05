---
layout: post
title: "从 Vue 源码学 provide/inject"
date: 2021-02-04
categories: [ "Vue" ]
tags: [ "Vue" ]
---

* content
{:toc}

一直对 Vue 的 `provide/inject` 的实现原理不是很清楚，导致平时工作中用的时候迷迷糊糊、模棱两可的。今天决定看一下源码，搞懂其中的机制，方便在工作中更流畅地使用。

<!-- more -->

## 用法
正如[官网所述](https://cn.vuejs.org/v2/api/index.html#provide-inject), 使用很简单:
- provide：`Object | () => Object`
- inject：`Array<string> | { [key: string]: string | Symbol | Object }`

父组件使用 `provide` 来向子组件提供值, `provide` 可以是对象，也可以是返回对象的方法:
```js
// 父组件
export default {
  provide: {
    name: '张三'
  }
}
```
子组件使用 `inject` 来获取父组件提供的值并注入到组件内， `inject` 可以是字符串的数组，也可以是对象:
```js
// 子组件
export default {
  inject: {
    providedName: { from: 'name' }
  }
}
```
然后就可以使用该属性了:
```js
// 子组件
export default {
  inject: {
    providedName: { from: 'name' }
  },
  // 可以作为属性默认值
  props: {
    propsName: {
      default() { return this.providedName; }
    }
  },
  // 可以作为 data 的默认值
  data() {
    return {
      localName: this.providedName,
    }
  },
  created() {
    console.log(this.providedName);
  }
}
```

用法其实很简单。但是有几点疑问:
- 父组件通过 `provide` 可以提供自身的属性和方法给后代吗？该怎么做呢？
- 父组件通过 `provide` 提供的自身属性具有响应式吗？
- 子组件通过 `inject` 注入的属性是在哪个生命周期阶段注入的？

带着问题可以去阅读源码。

## 源码解析
> 我还没有系统地完整的阅读过 Vue 的源码，所以从工程中查找 `provide/inject` 相关的关键字找到了相关文件。

### 格式化 inject
从 `src/core/instance/index.js` 文件中可以看到, 在调用 `new Vue(options)` 的时候会调用 `this._init(options)`:
```js
function Vue (options) {
  if (process.env.NODE_ENV !== 'production' &&
    !(this instanceof Vue)
  ) {
    warn('Vue is a constructor and should be called with the `new` keyword')
  }
  this._init(options)
}

initMixin(Vue)
```
而这个 `_init` 方法就是在 `initMixin` 添加到 `Vue` 原型上的方法。

在 `src/core/instance/init.js` 中可以看到源码，忽略其它信息可以看到如下代码：
```js
vm.$options = mergeOptions(
  resolveConstructorOptions(vm.constructor), options || {}, vm
)
```

顺藤摸瓜看一下 `mergeOptions` 方法里面的代码, 发现有一个 `normalizeInject` 的方法：
```js
function normalizeInject (options: Object, vm: ?Component) {
  const inject = options.inject
  const normalized = options.inject = {}
  if (Array.isArray(inject)) {
    for (let i = 0; i < inject.length; i++) {
      normalized[inject[i]] = { from: inject[i] }
    }
  } else if (isPlainObject(inject)) {
    for (const key in inject) {
      const val = inject[key]
      normalized[key] = isPlainObject(val)
        ? extend({ from: key }, val)
        : { from: val }
    }
  } else if (process.env.NODE_ENV !== 'production' && inject) {
    warn(
      `Invalid value for option "inject": expected an Array or an Object, ` +
      `but got ${toRawType(inject)}.`,
      vm
    )
  }
}
```

这个方法就是格式化 `inject` 的方法了，逻辑很简单，就是做如下几种转换:
- inject 为 `Array<string>` 类型, 例如: 
    ```js
      {
        inject: [ 'name' ]
      }
    ```
  直接转换为：
    ```js
      {
        inject: {
          name: {
            from: 'name',
          }
        }
      }
    ```
- inject 为 `Object` 类型，且属性值为非普通对象,例如: 
    ```js
      {
        inject: {
          name: 'name',
          name2: { default: '' }
        }
      }
    ```
  转换为:
    ```js
      {
        inject: {
          name: {
            from: 'name'
          },
          name2: {
            from: 'name2',
            default: '',
          }
        }
      }
    ```

综上，inject 最终会被格式化为如下格式，这个格式也是 inject 的标准格式
```js
{
  inject: {
    [injectKey]: {
      from: 'providedKey',
      default: '默认值',
    }
  }
}
```

### 初始化 inject 和 provide
接着看 `src/core/instance/init.js` 中的代码, 会发现初始化的代码：
```js
  initLifecycle(vm)
  initEvents(vm)
  initRender(vm)
  callHook(vm, 'beforeCreate')
  initInjections(vm) // resolve injections before data/props
  initState(vm) // 初始化 data、props、methods、computed、watch等
  initProvide(vm) // resolve provide after data/props
  callHook(vm, 'created')
```

忽略其它信息，可以看到 `provide` 与 `inject` 都是**在 `beforeCreate` 和 `created` 之间初始化的**。所以解答了 `inject 是在哪个阶段注入` 这个问题。所以，如果我们日常开发中可以在 `created` 钩子中获取注入的值，但是不能在 `beforeCreate` 中获取。

再看一下各个类型数据的初始化顺序:
- `initInject`: 首先初始化 inject 的注入内容
- `initState`: 然后初始化 vue 实例的各个资源，data、props、methods、computed、watch等
- `initProvide`: 最后初始化 provide 信息

所以我们可以得到另一个问题的答案: **父组件通过 `provide` 是可以提供自身的属性和方法给后代的**。

### 初始化 inject 的具体逻辑
继续点进 `initInjections` 方法看一下具体逻辑：
```js
export function initInjections (vm: Component) {
  const result = resolveInject(vm.$options.inject, vm)
  toggleObserving(false)
  Object.keys(result).forEach(key => {
    if (process.env.NODE_ENV !== 'production') {
      defineReactive(vm, key, result[key], () => {
        warn(
          `Avoid mutating an injected value directly since the changes will be ` +
          `overwritten whenever the provided component re-renders. ` +
          `injection being mutated: "${key}"`,
          vm
        )
      })
    } else {
      defineReactive(vm, key, result[key])
    }
  })
  toggleObserving(false)
}
```
首先从我们格式化过的 `$options.inject` 中解析出 `inject` 对象，即 `result`，这个没啥问题

然后关闭了 `observe` 的选项。这个是干什么的呢？
通过点进 `toggleObserving` 函数可以看到是重置了 全局的一个变量：`shouldObserve`。 

关闭它干啥呢？可以看一下 `defineReactive` 代码，在代码一开始的时候就会调用 `observe` 方法来观察一个对象:
```js
// src/core/observer/index.js
export function defineReactive (
  obj: Object,
  key: string,
  val: any,
  customSetter?: ?Function,
  shallow?: boolean
) {
  const dep = new Dep()
  // 其它代码
  let childOb = !shallow && observe(val)
}
```

再看下 `observe` 的代码:
```js
// src/core/observer/index.js
export function observe (value: any, asRootData: ?boolean): Observer | void {
  let ob: Observer | void
  if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
    ob = value.__ob__
  } else if (shouldObserve) {
    ob = new Observer(value)
  }
  return ob
}
```

创建 `observer` 的时候回检查 `shouldObserve` 的值，所以这里关闭了 `shouldObserve`, 我们在用 `defineReactive` 给 Vue 实例定义响应式属性的时候，就无法观察一个对象了。

#### 不具有响应式的 provide
根据以上，我们可以得出结论: **通过 inject 注入的一个普通对象是不具备响应式的**。
下面这个示例中,通过 `changeName` 改变 `person.name` 的值，是不会触发视图更新的。 因为对于 `person` 对象，没有使用 `observe` 方法为其创建 `Observer`。
```js
// 父组件
const person = { name: '张三' }
export default {
  name: 'parent',
  provide: {
    person,
  },
  methods: {
    changeName() {
      person.name = '李四'
    }
  }
}
// 子组件
export default {
  name: 'child',
  inject: [ 'person' ]
}
```

#### 具有响应式的 provide
再看下面这个例子：
```js
// 父组件
export default {
  name: 'parent',
  provide() {
    return {
      person: this.person,
    }
  },
  data() {
    return {
      person: { name: '张三' }
    }
  },
  methods: {
    changeName() {
      this.person.name = '李四'
    }
  }
}
// 子组件
export default {
  name: 'child',
  inject: [ 'person' ]
}
```
而父组件提供一个具有响应式的对象给子组件，子组件获取到的值就是响应式的。通过 `changeName` 改变 `person.name` 的值，是会触发视图更新的。

所以这里也回答了另外一个问题: **父组件通过 `provide` 提供的自身的响应式属性传给子组件后具有响应式的，但是提供的普通对象，是不具备响应式的**。


#### 其它API相关的具体逻辑

有兴趣的话，继续看一下 `resolveInject` 中的逻辑：
```js
export function resolveInject (inject: any, vm: Component): ?Object {
  const result = Object.create(null)
  const keys = Object.keys(inject);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    const provideKey = inject[key].from
    let source = vm
    while (source) {
      if (source._provided && provideKey in source._provided) {
        result[key] = source._provided[provideKey]
        break
      }
      source = source.$parent
    }
    if (!source) {
      if ('default' in inject[key]) {
        const provideDefault = inject[key].default
        result[key] = typeof provideDefault === 'function'
          ? provideDefault.call(vm)
          : provideDefault
      } else if (process.env.NODE_ENV !== 'production') {
        warn(`Injection "${key}" not found`, vm)
      }
    }
  }
  return result
}
```
遍历 `inject` 中的所有key，每个 key 值的 `from` 属性表示要从父级组件注入的属性。查找过程是逐级网上的，找到提供了 provide 的父级之后就不再继续寻找，所以始终会注入最近一级的 `provide` 属性。

另外，从这里也可得到两个API用法：
- 如果提供了 `default` ，在没有寻找到 `provide` 值时会使用 `default` 提供的值。
- `default` 可以是函数，在函数中可以通过 `this` 访问组件实例。

但是，需要注意的是在 `default` 函数中通过 `this` 是访问不到 `props`、`data` 中的属性的，原因上面也说了，`inject` 的初始化在 `data`等之前(所以这里的 `this` 貌似没什么用)。

### 初始化 provide 的具体逻辑
代码在 `src/core/instance/inject.js` 中:
```js
export function initProvide (vm: Component) {
  const provide = vm.$options.provide
  if (provide) {
    vm._provided = typeof provide === 'function'
      ? provide.call(vm)
      : provide
  }
}
```
非常简单，就是把我们写的 `provide` 最终都转成对象存储起来，与上文的 `result[key] = source._provided[provideKey]` 相对应。
同时可以看出，如果给 `provide` 提供了一个方法的话，在方法里面是可以通过 `this` 来访问实例中的属性和方法的。这也就解决了 **如果把实例中的数据通过 `provide` 提供给子组件** 这个问题:
```js
export default {
  provide() {
    return {
      name: this.name;
    }
  },
  data() {
    return {
      name: '',
    }
  }
}
```

## 总结

下面整理一下具体的问题。

1. 父组件通过 `provide` 可以提供自身的属性和方法给后代吗？
    可以。给 `provide` 设置一个方法，在方法中就可以通过 `this` 来访问 `props`,`data`,`methods` 等资源。

2. 父组件通过 `provide` 提供的自身属性具有响应式吗？
    父组件提供的具有响应式的属性，注入子组件后是具有响应式的，但是提供的普通对象，不具备响应式功能。
3. 子组件通过 `inject` 注入的属性是在哪个生命周期阶段注入的？
    是在 `beforeCreate` 和 `created` 之间注入的。所有的顺序如下:
    1. 先初始化 `injection` 
    2. 在初始化 `data`,`props`等，因此在 `data`,`props`中可以使用 `injection`
    3. 然后在初始化 `provide`, 所以组件可以将自身的属性和数据提供给后代组件。

以上就是本文的全部内容了，感谢各位阅读，如果有任何疑问，欢迎电子邮件留言。

转载请注明来源[从 Vue 源码学 provide/inject](https://zhuqingguang.github.io/2021/02/04/vue-source-code-provide-injection/)
