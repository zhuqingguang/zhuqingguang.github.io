module.exports = {
    title: '知识客栈',
    description: '记录我学过的知识与技能',
    head: [
        ['link', { rel: 'icon', href: '/favicon.ico' }],
    ],
    base: '/docs/',
    markdown: {
        lineNumbers: true
    },
    themeConfig: {
        sidebarDepth: 2,
        lastUpdated: '最新更新',
        nav: [
            // { text: '前端算法', link: '/algorithm/' },
            // { text: '博客', link: 'http://obkoro1.com/' },
            // 下拉列表
            //     {
            //       text: 'GitHub',
            //       items: [
            //         { text: 'GitHub地址', link: 'https://github.com/OBKoro1' },
            //         {
            //           text: '算法仓库',
            //           link: 'https://github.com/OBKoro1/Brush_algorithm'
            //         }
            //       ]
            //     }        
        ],
        sidebar: [
            {
                title: 'TypeScript',
                path: '/ts/',
                collapsable: true,
                sidebarDepth: 2,
                children: [
                    {
                        title: '基本类型',
                        path: '/ts/basic-types'
                    }
                ]
            }
        ]
    },
    smoothScroll: true
};
