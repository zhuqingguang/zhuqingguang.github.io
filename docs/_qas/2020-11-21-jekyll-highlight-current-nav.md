---
layout: post
title:  "Jekyll 如何高亮显示当前页面所在的导航菜单"
date:   2020-11-21
categories: other
---

先说原理：
- 全局变量 `site.pages` 变量保存了所有页面的信息，包含了例如以下信息：
  - `path`,如 **index.markdown**
  - `url`, 如 **/**
- 每个页面中定义的变量可以通过 `page` 获取。


以本博客为例，有两个导航菜单：
- “首页” 对应于 `index.markdown` 与 `_posts` 中的文章
- “千金方”对应于 `qas.md` 与 `_qas` 中的文字

那么 `site.pages` 中就包含了两个页面：
```js
[ 
    { url: "/", name: "index.markdown" },
    { url: "/qas/", name: "qas.md" },
]
```


首先在 `index.markdown` 文件及 `_posts` 的所有文件中定义变量:
```yaml
---
nav: "/"
---
```

然后在 `qas.md` 及 `_qas` 的所有文章中定义变量：
```yaml
---
nav: "/qas/"
---
```

我们在通过`site.pages` 输出所有导航菜单时，对比 `page.nav` 与每个导航的 url，以此来确定是否应用一个类名：
```html
{%- for path in page_paths -%}
    {%- assign my_page = site.pages | where: "path", path | first -%}
    {%- assign nav_url = my_page.url  -%}
    {%- if my_page.title -%}
        {% if nav_url == page.nav %}
        <span class="page-link active">{{ my_page.title | escape }}</span>
        {% else %}
        <a class="page-link" href="{{ nav_url }}">{{ my_page.title | escape }}</a>
        {% endif %}
    {%- endif -%}
{%- endfor -%}
```

具体使用可参考[实际代码](https://github.com/zhuqingguang/zhuqingguang.github.io/blob/gh-pages/docs/_includes/header.html)
