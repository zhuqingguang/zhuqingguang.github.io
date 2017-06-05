---
layout: post
title: JS学习基本知识01之引用类型总结
date: 2017-6-05
categories: [JavaScript]
tags: [JavaScript]

---
记录一下各种引用类型及其方法。
## Array类型
### 数组的创建
1. 使用Array构造函数
 ```
 var a = new Array();
 ```
 还可以传入数组中的项
 ```
 var a = new Array("red", "green", "blue");
 ```
 还可以传入一个数值，代表数组的长度
 ```
 var a = new Array(20);
 ```
 **注意**: ``new``是可以省略的

2. 使用数组字面量
 ```var colors = ['red', 'green', 'blue'];```

### 关于数组的长度
实际上数组的长度是可以随时改变的，在通过构造函数或者数组字面量创建数组之后，有两种方法改变数组的长度。
1. 直接设置数组的某个位置的值。
 ```
 var a = new Array(2);  //创建一个长度为2的数组
 a[4] = 'red';			//这样，数组的长度就增加到5
 console.log(a[3]); 	//undefined,     由于没有初始化a[3]，所以将输出undefined
 ```
 由上面的代码看出，数组的长度是随着操作而改变的，但是对于那些没有被初始化的位置的项，会以undefined填充。
 这就跟只声明变量而不进行初始化是一样的。
 但是这样只能增加数组的长度。

2. 直接设置数组的length属性
 数组的length属性不是只读的。所以可以直接设置length值，来使数组具有给定的长度。但是同样，对于未初始化的项，访问它们，会返回undefined。
 ```
 var a = ['red', 'green', 'blud'];
 a.length = 5;
 console.log(a[3]);  // undefined
 ```
 上面的代码就把数组的长度增加到了5，然后以undefined填充了中间的项。

 还可以**缩短**数组的长度。
 ```
 a.length = 1;
 console.log(a[2]); //  undefined, 数组中只剩一项
 console.log(a.length);			// 1
 ```

### 数组中的方法
1. 检测对象是不是数组
 - ``instanceof``操作符
 - ``Array.isArray()``方法
 	```
    var color = new Array("red", "green");
    console.log(Array.isArray(color));   //true
    ```

2. 转换方法
 - toString()
  该方法会输出每一项，并以','连接，实际上该方法会调用数组中每一项的``toString()``方法，然后拼接得到的每一项的字符串。
  ```
   var color = new Array("red", "green");
   console.log(color.toString());   // red,green
   alert(color);			// red,green
   console.log(color);			// ["red","green"]
  ```

 - toLocaleString()
  该方法会输出每一项，并以','连接，实际上该方法会调用数组中每一项的``toLocaleString()``方法，然后拼接得到的每一项的字符串。一般都会返回与``toString()``相同的值
  ```
   var color = new Array("red", "green");
   console.log(color.toLocaleString());   // red,green
  ```

 - valueOf()
  该方法输出整个数组的字符串形式
  ```
  var color = new Array("red", "green");
   console.log(color.valueOf());   // ["red","green"]
  ```

 - join()
  该方法接收一个字符串，然后以该字符串为间隔，将数组中的每一项拼接起来
  ```
  var color = new Array("red", "green");
   console.log(color.join('&&'));   // red&&green
  ```

3. 栈方法和队列方法
 - 栈是一种LIFO("LAST-In-First-Out"后进先出)的数据结构。
  有两个方法，push()和pop().
	- push()接受一个或者多个参数，将它们添加到数组末尾处，返回添加后数组的长度
	- pop()则从数组中移除最后一项，并返回该项的值。
 - 队列是一种FIFO("First-In-First-Out"先进先出)的数据结构。
  有两个方法，unshift()和shift().
  	- unshift()与push()类似，只不过是在数组的最前面添加一项或多项
  	 ```
     var color = new Array("red", "green");
     color.unshift("blue","yellow");
     console.log(color);			// ["blue", "yellow", "red", "green"]
     ```

    - shift()与pop()类似，是返回数组的最前面一项

4. 排序方法
 有两种排序方法，reverse()和sort()。
 - reverse()
  ``reverse()``方法会反转数组项的顺序。
 - sort()
  ``sort()``默认按照升序重新排列数组，而顺序的决定是由每一项转换为字符串后进行比较的。
  ```
  var values = [0, 1, 5, 10, 15];
  values.sort();
  console.log(values)   //   [0, 1, 10, 15, 5], 因为转换为字符串后，10在5前面
  ```

  ``sort()``还可以接受一个函数作为参数，根据函数的返回值进行排序。这个函数接受两个值作为参数，排序原则如下：
  参数1在参数2前面，返回负数，参数1在参数2后面，返回正数，两个参数相等，则返回0.
  ``sort()``内部是根据冒泡法排序的，不断比较两个数的大小。