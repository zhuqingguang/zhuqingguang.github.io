---
layout: post
title: "使用chrome插件更改页面上下文中的变量与函数"
date: 2021-01-01
categories: [ note ]
tags: [ "Chrome extension" ]
---

* content
{:toc}

Chrome 扩展提供了几个特性，让我们可以通过一种变通的方式来获取到页面上下文中的变量与方法。

<!-- more -->

## 相关 API 介绍

### Content scripts

Content scripts 是运行在 web 页面的文件，能够获取到页面的 DOM 元素，并与页面进行交互。可以在 `manifest.json` 中声明插入的 js 文件：
```json
{
    "content_scripts": [
       {
         "matches": ["http://*.nytimes.com/*"],
         "js": ["contentScript.js"]
       }
    ],
}
```
Content scripts 虽然可以获取到 DOM，但是它运行在一个独立的沙盒中，所以无法获取到页面上下文的变量和函数。因此需要向页面中插入 js 文件来获取页面上下文中的变量，即使用 `web_accessible_resource` 。


### web_accessible_resources

在 `manifest.json` 中使用 `web_accessible_resources`  可以声明文件，这些文件可以在页面的上下文所使用，并且这些文件运行在页面上下文中，与我们插入到html文件中的文件是一样的。
```json
{
  "name": "extension name",
	"web_accessible_resources": [
  	"script.js"
  ]
}
```


### 获取扩展中的文件的URL
Content scripts 里面是可以直接调用 `chrome` 的一部分API的，其中一个API就是获取当前扩展中所包含的文件的URL，这个URL可以直接当做普通的URL来使用。比如我们在扩展中有一个 `script.js` 文件，我们就可以获取到该文件的URL：

```javascript
const url = chrome.runtime.getURL('script.js');
// 这个 url 可以直接使用
document.querySelector('#scriptId').src = url;
```

## 【实操】：插入并执行 js 文件
利用以上API，我们就能达到向页面中插入 js 文件的目的。现在我们利用插件向页面中插入一个全局变量 `injectVariable` 。


### 1. 编写 Content script
```javascript
// contentScript.js
var s = document.createElement('script');
s.src = chrome.runtime.getURL('script.js');
s.onload = function() {
    this.remove();
};
(document.head || document.documentElement).appendChild(s);
```

### 2. 编写 script.js
```javascript
// script.js
window.injectVariable = 'haha';
```

### 3. 在 manifest.json 中声明文件
```json
{
	"name": "extension name",
  "content_scripts": [
    {
    	"matches": ["http://*.yoursite.com/*"], // 这里写需要插入的页面的 url，可以使用通配符
     	"js": ["contentScript.js"],
      "run_at": "document_start"
    }
  ],
  "web_accessible_resources": [
  	"script.js"
  ]
}
```

然后在页面中读取全局变量 `injectVariable` ，就能读到我们插入的值了😉
