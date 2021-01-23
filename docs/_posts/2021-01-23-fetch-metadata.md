---
layout: post
title: "Fetch Metadata 介绍"
date: 2021-01-23
categories: [ "web安全" ]
tags: [ "web安全" ]
---

* content
{:toc}

web 网站的很多资源都可能被第三方网站恶意使用，造成各种 web 攻击和信息泄露。[Fetch Metadata](https://w3c.github.io/webappsec-fetch-metadata) 在请求头(Request Headers)中提供了关于资源请求的信息，从而让服务端做出正确的响应。
<!-- more -->

## Fetch Metadata 是什么？
Fetch Metadata 是一种加强 web 平台安全性的新特性，包含了一组 `Sec-Fetch-*` 格式的请求头。在这组请求头中包含了关于请求的一些背景信息，例如是请求的目标对象（destination）、请求的模式（mode）等。服务端通过这些请求头包含的信息，决定如果对请求作出响应。

### 名词解释
这里对上文的一些名字作出简单的解释。

- **[request destination](https://fetch.spec.whatwg.org/#concept-request-destination)** 是请求所关联的目标对象，例如，如果一个请求是在 `image` 标签的 `src` 属性中发出的， destination 就是 `image`；如果请求是从浏览器的地址栏直接发出的，destination 就是 `document` 。

- **[request mode](https://fetch.spec.whatwg.org/#concept-request-mode)** 表示请求的模式，也可以理解为请求的类型，具体有以下几个取值：
  - `same-origin`: 表示请求是从同源的 URL 发出的。
  - `cors`: 表示该请求是一个 [CORS](https://www.ruanyifeng.com/blog/2016/04/cors.html) 请求。
  - `no-cors`: 表示该请求不是一个 CORS 请求。
  - `navigate`: 请求如果是通过文档之间的导航发起的，则为一个 `navigate` 请求。比如通过点击回退按钮。
  - `websocket`: 表示请求是建立 websocket 连接时发出的请求。

## 请求头介绍
Fetch Metadata 包含有以下请求头：
- `Sec-Fetch-Dest`，请求的目标对象信息。
- `Sec-Fetch-Site`，请求发出的站点的信息。
- `Sec-Fetch-Mode`，请求的类型信息。
- `Sec-Fetch-User`，表示请求是否是由用户的激活行为发出的，即用户主动点击浏览器上的按钮，如回退按钮等。

### Sec-Fetch-Dest
`Sec-Fetch-Dest` 表示请求的目标对象，取值信息包括: `audio`,`video`,  `track`, `frame`, `iframe`, `image`, `style`, `font`, `script`, `audioworklet`, `document`, `embed`, `empty`,  `manifest`, `object`, `paintworklet`, `report`, `serviceworker`, `sharedworker`, `worker`, `xslt` 。

虽然这些取值看上去有很多, 但是基本上都是与某些元素,网页上的资源或 API 有关的：
- 与 dom 元素相关的 `audit`，`video`，`image`, `track`, `frame`, `iframe`。
- 与资源有关的 `style`, `font`, `script`
- web worker 相关的 `worker`, `serviceworker`, `sharedworker`。

还有几个特殊的常见取值，下面分别举例。
- 通过 `fetch()` 方法发出的请求，取值为 `empty`
- 通过浏览器地址栏直接发出的请求，取值为 `document`
- 通过在 iframe 标签中发出的请求，取值为 `iframe`

#### 使用举例
通过 `Sec-Fetch-Dest`，服务端可以判断请求是如何发出的，并作出相应的措施。比如，一个浏览器网站不允许其它网站将自己嵌入到 iframe 中，就可以判断  `Sec-Fetch-Dest` 的取值是不是 `iframe`，如果是的话，就返回一个错误。

### Sec-Fetch-Site
`Sec-Fetch-Dest` 表示请求来源的网站，有如下取值：
- `same-origin`，表示同一个源发出的请求，即本站自己发出的网络请求。
- `same-site`, 表示是同一个站点发出的请求，具体来说就是同一个父域名下的子域名发出的请求，比如从 `sub.example.com` 请求 `example.com` 下的资源，就属于 same-site。
    关于 `same-origin` 与 `same-site` 的区别，可以参考[这篇博客](https://web.dev/same-site-same-origin/)。
- `none`, 如果一个请求时通过用户与浏览器的交互发出的，则取值为 `none`。例如，从书签栏中直接点击某个收藏的网址后，发出的文档请求。
- `cross-origin`, 表示请求是通过另一个不同的站点发出的。

![同源与跨站请求示例](/assets/images/fetch-metadata/cross-same-origin.jpg)

#### 使用举例
通过 `Sec-Fetch-Dest`，服务端就可以判断当前请求的来源站点，并作出对应的措施。

前文提到了禁止 iframe 嵌入当前网站的方法，但是那样一刀切的方式会导致我们自己的其它网站也无法将该网站嵌入到 iframe 中展示。所以此时我们可以利用 `Sec-Fetch-Dest` 请求头来判断当前请求的来源网站。如果有 `Sec-Fetch-Dest: cross-site`, 我们就可以拒绝该请求，其它情况下返回正常的文档信息。

### Sec-Fetch-Mode
如文章开头 “名词解释” 一节所述，`Sec-Fetch-Mode` 表示了当前请求的类型，因此 `Sec-Fetch-Mode` 的取值也是对应以下几种：
- `same-origin`: 表示请求是从[同源](https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy)的 URL 发出的。
- `cors`: 表示该请求是一个 [CORS](https://www.ruanyifeng.com/blog/2016/04/cors.html) 请求。
- `no-cors`: 表示该请求不是一个 CORS 请求, 所以只能使用特定的请求方法(GET, POST, HEAD)和请求头。
- `navigate`: 请求如果是通过文档之间的导航发起的，则为一个 `navigate` 请求。比如通过点击回退按钮。
- `websocket`: 表示请求是建立 websocket 连接时发出的请求。

### Sec-Fetch-User
如果一个请求是用户与浏览器的交互过程中发出的，则 `Sec-Fetch-User` 取值为 `true`，其它情况均为 `false`。

## 浏览器兼容性
Fetch Metadata 是一个新特性，只有较新版本的浏览器才会支持。如果是不支持的浏览器，所有这些请求头的取值都是空的，即不发送这些请求头。因此我们可以提前在服务端部署对应的防御措施，只有在 `Sec-Fetch-*` 请求头不为空时进行校验。 

## Fetch Metadata 实战
对于使用 Fetch Metadata 保护自己网站的资源不被攻击，可以参考这篇文章 [Protect your resources from web attacks with Fetch Metadata](https://web.dev/fetch-metadata/)，原理也很简单😉


以上就是 Fetch Metadata 的全部内容了，感谢各位阅读，如果有任何疑问，欢迎电子邮件留言。

转载请注明来源[Fetch Metadata 介绍](https://zhuqingguang.github.io/2021/01/23/fetch-metadata/)
