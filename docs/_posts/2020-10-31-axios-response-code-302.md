---
layout: post
title: Axios 响应不能拦截 302 状态码？
date: 2020-10-31
categories: [ other ]
tags: [ Http ]

---

* content
{:toc}

本文源自于工作中遇到的一个小 case：使用 axios 不能拦截到状态码为 302 的服务器响应。
<!-- more -->

## 一般场景描述
很多网站都会有登录校验，其流程如下：
1. 访问网站网址；
2. 服务器发现请求的 Cookie 中没有带有登录信息(一般是一个 Token)，就返回一个状态码为 302 的重定向响应，并在响应头的 Location 中写入重定向的地址，这个网址就是我们进行登录的网址；
3. 浏览器接收到响应后，发现是302，就会用 `get` 方法重新请求 Location 中指定的登录网址；
4. 在登录网址输入账号密码登录后，服务端会在响应的 `Set-Cookie` 中写入我们的登录信息，同时浏览器的代码会重新跳转到我们一开始访问的页面。

以上就是最一般的网站登录流程。其中，302 状态码的响应十分关键，它指引我们去正确的网页登录。

这种情况一般是用户在直接在浏览器中输入地址发生的。最近我遇到的情况是：与后端约定，使用 axios 通过Ajax 的方式请求后端接口，如果发现没有登录，后端会返回一个 302 的重定向响应，然后我拿到响应中 Location 地址后，跳转到该地址去登录。

这看上去很简单，只需要三步：
1. 发送请求；
2. 在 axios 的响应中判断状态码，如果是 302 的话，就获取响应头中的 Location 地址；
3. 使用 js 代码控制浏览器跳转。

## 实际实施
首先要拿到 axios 的响应。axios 判断正常响应的状态码的逻辑如下：
```js
validateStatus: function (status) {
    return status >= 200 && status < 300; // default
}
```

所以要改一下校验逻辑，使 302 状态码也能认为是正常的响应：
```js
validateStatus(status) {
    return status >= 200 && status < 300 || status === 302;
}
```

然后在 axios 响应中做处理：
```js
axios({
    url: '/api',
}).then(res => {
    const { status, headers: { Location } } = res;
    if (status === 302) {
        window.location.href=  Location;
    }
})
```
Nice！ 非常简单~

但是实践中却发现代码根本没有运行到 axios 的响应处理这一步，而是直接使用 `get` 方法请求了重定向的地址。猜想这可能是 axios 默认的行为，但是查询官方文档，却没有发现相关的配置禁用掉这个功能。只有一个 `maxRedirects` 选项，是应用到 Nodejs 的。

在网上搜寻相关资料，发现也有人提过[这个问题](https://stackoverflow.com/questions/54500755/response-undefined-for-302-status-axios)，原因是：
**Ajax 不能处理 302 状态码的响应，这个行为是浏览器的默认行为**。
通过查阅[标准](https://xhr.spec.whatwg.org/#states),标准关于 Ajax 的 `readyState = 2` 时表示所有的重定向行为（如果有的话）均已经完成并且所有的响应头都已经接收到：
> All redirects (if any) have been followed and all headers of a response have been received.

也就是说 Ajax 的请求方式，当接收到响应时所有的重定向已经完成了。

## 默认重定向的状态码
经过试验，所有的重定向状态码：
- 301: Moved Permanently
- 302: Found
- 303: See Other
- 307: Temporary Redirect
- 308: Permanent Redirect

有关代码可以在[github](https://github.com/zhuqingguang/playground/tree/master/ajax-process-302)可以查看。

有任何问题，欢迎讨论~
