---
layout: post
title: Web Clipboard API 深入浅出
date: 2020-11-20
updateDate: 2020-11-20
categories: [ "Web API" ]
---

* content
{:toc}

在工作中会遇到一些需求场景，例如粘贴图片后自动上传，富文本编辑器内粘贴文本与图片，这些都与 Clipboard API 相关，在此讲解一下最新的 Clipboard API 的内容。
<!-- more -->

本文的示例页面: [Clipboard API demo](http://demo.aining.online/web-demo/clipboard)
代码地址: [Github](https://github.com/zhuqingguang/vue3-playground/blob/master/src/modules/web-demo/clipboard/index.vue)
## Clipboard API 的能力

**Clipboard API** 是干什么的呢？

借用 [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API) 的介绍，总结来说就是两点：
- 让我们能够读取和写入剪切板的内容；
- 让我们能够监听复制、剪切和粘贴事件(即 **copy**、**cut**、**paste** )，并做一些额外处理。

## Clipboard API 的组成

**Clipboard API** 由 `Clipboard` 、`ClipboardItem` 和 `Clipboard Event` 几个内容组成。

- `Clipboard` 接口是对剪切板的抽象，提供了读取剪切板、写入剪切板的方法。我们通过 `Clipboard` 的实例，就能操作系统剪切板，比如任意用户剪切板的内容。
- `ClipboardItem` 接口是对剪切板里的内容的抽象，比如我们选中网页上的一段文字，并右击选择复制，这样复制的内容就作为一个 `ClipboardItem` 存在。后面会详细介绍。
- `Clipboard Event` 顾名思义，就是复制粘贴这些事件。通过监听 **copy**、**cut**、**paste** 这几个事件，我们可以在用户进行复制、粘贴时做一些额外的处理操作。比如，你复制我博客的内容时，我可以更改你复制的内容，加上一段版权信息😆。

## 操作剪切板
虽然 Web 提供了 `Clipboard` 接口，但是我们不会去手动创建它，而是通过 `navigator.clipboard` 属性来操作剪切板。
`navigator.clipboard` 有四个方法：
- `readText`: 用来读取剪切板的文本内容
- `read`: 我们可能复制一些非文本内容，如图片，文件等，`read` 方法提供了这个功能
- `writeText`: 向剪切板写入文本
- `write`: 向剪切板写入多种格式的内容，如写入一个图片或者带格式的 HTML 片段

上面四个方法返回的都是 `Promise`, 区别在于读取内容的方法会把读取到的内容在 `Promise` 中返回，一段简单示例如下：
```js
navigator.clipboard.readText().then((text) => { console.log(text) });
```

为什么返回的都是 `Promise` 呢?

因为操作剪切板很容易泄露用户隐私，还会造成一些安全问题，所以调用操作剪切板的方法时会先向用户请求权限，用户同意之后才会往下进行，这个时候 promise 状态会变为 `resolved` ,如果用户拒绝，则该 promise 状态变为 `rejected` 。

下面进行详细的示例讲解，可以点击 [**Demo**](http://demo.aining.online/web-demo/clipboard) 页面实际操作，理解会更加深入。本文的示例代码也可以从 [Github](https://github.com/zhuqingguang/vue3-playground/blob/master/src/modules/web-demo/clipboard/index.vue) 上查看。
> 由于 Clipboard API 还属于比较新的 API， 并非所有浏览器都支持，所以以下示例均在最新版的 Chrome 浏览器中运行。

### 读取文本
读取文本很简单，只需要调用 `readText` 方法即可把剪切板内的文本读取出来：
```js
navigator.clipboard.readText().then((text) => { console.log(text) });
```

### 读取MIME格式的内容
通过 `read()` 方法可以读取文本、图片、文件等内容，目前 `read()` 方法只有最新的 Chrome 实现了读取 `image/png` 格式的功能。通过 `read()` 方法读取到的内容是一个 `ClipboardItems` 数组。比如我们在网页上找一个图片，右键点击复制，然后把读取到的数据打印出来：
![ClipboardItem](/assets/images/clipboard/clipboard-item.png)

`ClipboardItem` 有以下属性和方法：
- `types` 属性: 包含了刚刚复制的内容的格式列表，
- `getType()` 方法： 这个方法传入的参数是表示类型的字符串，如 `text/html`, 返回一个 Promise ，通过该 Promise 我们可以获取该格式对应内容的 Blob 类型。

上述图片中可以看到 `types` 有两个值：`["text/html", "image/png"]`， 因为我们虽然复制的是图片，但是实际上复制了两个格式的内容：
- `text/html`: 这是带有 html 格式的文本，例如我复制了 Vue 的logo，实际内容如下：
  ```html
  <meta charset="utf-8"><img src="https://cn.vuejs.org/images/logo.png" alt="vue logo">
  ```
- `image/png`: 这是我们复制的图片内容。

调用一下 `types` 属性：
```js
navigator.clipboard.read().then(clipboardItems => {
    console.log(clipboardItems[0].types)
})
// ["text/html", "image/png"]
```

通过 `Blob.text()` 方法可以得到 Blob 内容对应的文本格式，查看一下 `text/html` 对应的内容：
```js
navigator.clipboard.read().then(async clipboardItems => {
    const blob = await clipboardItems[0].getType('text/html')
    const text = await blob.text()
    console.log(text)
})
// <meta charset="utf-8"><img src="https://cn.vuejs.org/images/logo.png" alt="vue logo">
```

我们可以把剪切板的所有内容读取并展示出来：
- 对于文本，直接显示其内容
- 对于图片，则读取图片的二进制数据并渲染出来

示例代码如下：
```typescript
navigator.clipboard.read().then(async clipboardItems => {
    const promises = clipboardItems.map(async (item: ClipboardItem) => {
        // 获取所有的 types 并获取对应的内容
        const promises = item.types.map(async type => {
            const typeData = await item.getType(type)
            let data = ''
            if (/text/.test(type)) {
                data = await typeData?.text?.()
            } else if (/image/.test(type)) {
                // 将图片内容读取为 DataUrl
                data = URL.createObjectURL(typeData)
            }
            return { type, data, }
        })
        const typeList = await Promise.all(promises)
        return typeList
    })
    clipboardData.clipboardItemList = await Promise.all(promises)
    console.log(clipboardData.clipboardItemList)
})
```
本段代码的实际效果可以从[这里](http://demo.aining.online/web-demo/clipboard)看到。复制一个图片，点击 "获取剪切板MIME类型的内容" 按钮，下方会展示剪切板上所有类型的内容。

### 向 Clipboard 写入内容
向 Clipboard 中写入文本和读取文本内容一样简单，使用 `writeText()` 即可，不再多说：
```js
navigator.clipboard.writeText('这是往剪切板中写入的文本内容').then(() => {
    alert('写入成功, 可以往文本框里复制内容')
})
```

我们也可以通过 `Clipboard.write()` 方法向剪切板中写入图片等内容。`write()` 方法的参数是一个 `ClipboardItem` 的数组。

上文介绍了 `ClipboardItem` 的属性和方法，下面介绍一下如何创建  `ClipboardItem` 实例。
创建 `ClipboardItem` 实例需要传入一个对象，对象中的 key 代表内容的类型，如 `text/html`，对象的 value 是 Blob 类型的数据，例如，创建一个 HTML 片段：
```js
const clipboardItem = new ClipboardItem({
    'text/html': new Blob([ '<span style="color: #9cdcfe;">这是文案的html格式</span>' ], { type: 'text/html' }),
})
// 然后将其写入剪切板
navigator.clipboard.write([ clipboardItem ]).then(() => {
    alert('写入成功')
})
```
> 注意，目前最新的 Chrome 浏览器虽然支持了 `write()` 方法，但是传入的数组中只能有一个 clipboardItem，不支持一次写入多个。

此时如果获取剪切板的内容或者去支持富文本的输入框(比如微信)中粘贴，就能看到我们写入的内容。

## 响应 Clipboard 事件
Clipboard API 还能让我们响应复制、粘贴等事件。只需要给特定的元素增加 `copy` `cut` 或 `paste` 事件监听函数，即可监听到这些事件。

我们监听这些事件一般会有两种处理：
- 在 `copy` 和 `cut` 事件发生时改变存储到剪切板的内容，例如你在 CSDN 博客上复制一段话，然后粘贴到自己的博客时，会发现粘贴的内容多了一段版权信息，就是利用这些事件做的。
- 在 `paste` 事件发生时读取剪切板的内容，例如富文本编辑器实现粘贴图片后自动上传服务器。

在这些时间处理函数中，我们可以直接通过上述介绍的读取和写入方法操作 `navigator.clipboard` ：
```js
document.querySelector('.input').addEventListener('copy', () => {
    navigator.clipboard.read().then(clipboardItems => {
      console.log(clipboardItems[0].types)
  })
});
```

不过由于目前浏览器对 `navigator.clipboard` 的功能支持不是很完善，所以可以利用旧的 API 来实现对剪切板的读取与写入。
在触发 `copy` `cut` 或 `paste` 事件时，事件对象上的 `clipboardData` 属性可以让我们读取或写入剪切板。

### 拦截 `paste` 事件

`event.clipboardData` 是一个 [`DataTransfer`](https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer) 对象, 提供了两个方法：
- `getData(format)` : 读取剪切板的内容，需要传入要读取的内容类型，如 `getData('text/html')`；
- `setData(format, data)` 方法来设置剪切板的内容，参数分别为表示类型的字符串和该类型对应的数据内容。

例如，我们在一个输入框中拦截粘贴操作，并更改粘贴行为：
```js
const onPaste = e => {
    // 
    const text = e.clipboardData.getData('text/plain')
    e.target.value = '这是代码手动更改后的内容:\n\n' + text
    e.preventDefault()
}
document.querySelector('.input').addEventListener('paste', onPaste)
```

`clipboardData` 有一个 `items` 属性，是 [DataTransferItem](https://developer.mozilla.org/en-US/docs/Web/API/DataTransferItem) 的列表，从中我们可以获取剪切板中的所有内容。利用 `items` 我们将在粘贴时获取剪切板中的图片，并进行如上传等处理：

```js
const onPaste = e => {
    // 类数组对象
    const items = [ ...e.clipboardData.items ]
    let file;
    items.forEach((item, index) => {
        const { type } = item
        if (type === 'image/png') {
            // 利用 DataTransferItem 的 getAsFile 获取文件数据
            file = URL.createObjectURL(item.getAsFile())
            const formData = new FormData()
            formData.append('file', file);
            // 在这里进行上传
        }
    })
    e.preventDefault()
}
document.querySelector('.input').addEventListener('paste', onPaste)
```
### 拦截 `copy`、`cut` 事件
拦截 `copy`、`cut` 事件，我们可以更改用户复制的内容：
```js
const onCopy = e => {
    console.log(e.clipboardData)
    const selection = document.getSelection()
    e.clipboardData.setData('text/plain', `你复制的内容已经被我更改了！${selection}`)
    e.preventDefault()
}
document.querySelector('.input').addEventListener('copy', onCopy)
```

上述示例均可以在[这里](http://demo.aining.online/web-demo/clipboard)查看。

## 总结
Clipboard API 所覆盖的知识不多，总的来说有以下三方面：
- `Clipboard` 接口提供了操作剪切板的一些方法，主要应牢记以下几个方面：
  - 通过 `navigator.clipboard` 来操作剪切板；
  - 有四个方法(目前)可以使用: `read()` 和 `readText()`,`write()` 和 `writeText()`，都返回一个 Promise
  - 使用 `navigator.clipboard` 会向用户请求授权。
- `ClipboardItem` 接口代表剪切板里的一个内容，比如我们右击图片点击复制，此时剪切板里会增加一项 `ClipboardItem`，保存着两种格式的内容：`text/html` 和 `image/png`。
  - 使用 `Clipboard.read()` 方法读取到的数据是 `ClipboardItem` 组成的数组；
  - 每个 `ClipboardItem` 有一个 `types` 属性,包含了其保存的所有内容的类型，如：`['text/html', 'image/png']`
  - 每个 `ClipboardItem` 有一个 `getType` 方法，其返回 Promise, 传入上一条的类型即可获取对应的内容，如：`getType('text/html')`
  - 使用 `Clipboard.write()` 方法向剪切板写入数据时，需要创建 `ClipboardItem` 实例：
    ```js
    const item = new ClipboardItem({
        'text/html': new Blob([ '<span style="color: #9cdcfe;">html</span>' ])
    })
    ```
- Clipboard Event 可以让我们拦截复制、剪切和粘贴事件，并改变默认行为：
  - 监听的事件有: **copy**、**cut**、**paste**
  - 通过 `event.clipboardData.getData(format)` 可以获取剪切板内容；
  - 通过 `event.clipboardData.getData(format, data)` 可以更改 copy 和 cut 时写入剪切板的内容；
  - 通过 `event.clipboardData.items` 能获取到所有剪切板的内容，实现粘贴自动上传等功能
    

以上就是关于 Clipboard API 的全部内容了，希望能帮到大家~

欢迎关注我，后续会继续写更多优质博客与大家分享。同时，有任何问题，欢迎一起讨论~
