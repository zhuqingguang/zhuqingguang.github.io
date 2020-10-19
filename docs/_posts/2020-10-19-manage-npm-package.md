---
layout: post
title: "规范管理 npm 包"
date: 2020-10-19
categories: [ npm ]
---

* content
{:toc}

本文讲述使用 npm + git 管理 npm 包的规范流程。

<!-- more -->

## 编写代码并提交
我们使用 git 管理我们的代码版本。完成一个功能之后，需要提交一个 commit，并在提交的信息中写入本次更新的内容提要。如果是一个重大或者重要的版本变更，最好给当前提交打上标签。
> 打标签相当于给某个提交建立一个标签。其 hash 依旧是那个commit 的 hash。
> 打标签可以在任何时候进行，也不会对当前文件进行提交。

```bash
// 创建一个轻量级标签
git tag v0.0.1

// 创建一个 annotated 标签
git tag -a v0.0.2 -m "git tag for version 0.0.2"
```
当然也可以对以前的提交打标签，只需要提供 commit hash 即可：
```bash
git tag -a v0.0.3 4ahhsd837hf9q8u34rf
```
## 变更包的版本号
git 提交后需要保证当前 git 的工作目录是干净的，即**没有变更的文件，也没有暂存的更改**。然后根据需要的变更版本运行 `npm version` 命令。

### npm version 的参数
有以下几种参数用法。

- `npm version <new version>`

可以直接指定一个版本号, 如 `npm version 1.0.2` .

- `npm version major | minor | patch`

`major` 、 `minor` 、`patch` 分别代表主版本号、次版本号、补丁版本号。运行对应命令即会在对应版本号上增加一个版本。如当前 package.json 中的版本号为 `version:1.2.3 ` ，运行 `npm version minor` 后，版本即变为 `version: 1.3.3` 。

- `npm version from-git`

`from-git` 关键字表示从当前仓库的 git 提交中获取变更的版本号。首先，npm 使用 `git describe` 打印出最新的 tag。然后从 npm 的配置中获取 `tag-version-prefix` , 默认是 `v` ，如 `v0.0.5` 。去掉 tag 中的前缀之后对其进行校验，如果是一个合法的 semver 即语义化版本，则以其作为最新的版本号。否则读取失败。如果从 git tag 中获得的版本号与现有版本号重复，也会报错，除非使用`npm version from-git --allow-same-version` 来运行。

> 小知识
> - git describe 命令会把当前最新的tag打印出来。
>    - 如果最新的tag指向了最新的一次commit，则会直接打印出 tag。
>    - 如果最新的 tag 指向了非最新的 commit， 则会打印该 tag 以及最新的 commit hash，并在中间插入一个数字，表示最新的 tag 与 最近一次的提交之间相差的 commit 数量，如 `v0.0.7-1-gcfe7dff` ,表示最新的 tag 指向的 commit 与最新的 commit 相差两个 commit。
> - npm config 中的 tag-version-prefix 表示 git tag 中版本号的前缀，默认是 `v` ，可以通过 `npm config get tag-version-prefix ` 查看。

运行 `npm version` 成功之后，npm 会按照要求变更版本号，并提交所做的更改至 git。


## 发布包
版本号变更完毕，下一步即可进行发布。运行命令:
```bash
npm publish
```
即可发布版本。发布后可以使用 `npm view` 查看包的信息。


## 给包的版本增加tag
npm 包的版本除了用 version 来标记之外，还会使用 tag 对某个版本进行标记。例如，每个包新版本发布后，npm 会把 `latest` 标签指向最新的版本，这样就可以使用标签来下载某个版本：
```bash
npm i package-name@latest
```
如果我们希望发布的新版本的标签不是默认的 `lastest` ，而是其它的，比如 `alpha` 、 `beta` 或 `rc` ，我们在发布时可以指定一个标签：
```bash
# 发布一个 alpha 版本
npm publish --tag=alpha
```

如果我们也可以在发布后对某个版本**增加标签**。
```bash
# 给 1.0.0 版本增加 beta 标签
npm dist-tag add package-name@1.0.0 beta
```

如果想**删除某个标签**，只需要运行：
```bash
npm dist-tag rm package-name beta
```

**查看**所有的标签
```bash
npm dist-tag ls package-name
```

至此，发布一个 npm 包的流程已经结束。


## 取消发布
如果发布包之后想取消包的发布，可以运行 `unpublish` 命令, 一般而言，需要加上 `--force` 选项：
```bash
npm unpublish --force
```

## npm version 运行流程
> 本部分为扩展内容。

在运行 `version` 命令时，npm 会到 package.json 的 `script` 属性中寻找三个命令:

- `preversion`
- `version`
- `postversion`

如果存在对应的命令，在整个 `npm version <version>` 执行过程中会在恰当的时机执行这些命令。
加上我们的自定义脚本命令，整个变更版本号的流程如下：

1. 首先确保当前 git 工作区是干净的，否则会进行错误提示。如果想跳过检查，强制进行版本号变更，需要加上 `--force` 参数。
1. 执行 `preversion` 命令。在此命令中，可以对当前文件做一些更改，注意，**需要把更改后的文件加入到 git 暂存区中**。
1. 根据当前要变更的版本号参数，到 package.json 中变更版本号，如: 把 `1.0.0` 变更为 `1.0.1` 。
1. 然后执行 `version` 命令。在此命令中，也可以对当前文件做一些更改，注意，**需要把更改后的文件加入到 git 暂存区中**。
1. 运行 `git add package.json` 命令，并进行提交。
1. 对当前提交打一个标注标签，标签名为 `npm.config.tagVersionPrefix + version` 


可以注意到，在上述步骤中，我们如果在脚本中更改了本地的文件，需要使用 `git add` 将其加入到暂存区中，这样 npm 在执行 commit 操作时才会把这些文件提交进去。

