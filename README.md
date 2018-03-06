# Vuejs
[TOC]


## 将虚拟DOM树渲染到真实的DOM

> 整体的思路便是首先创建虚拟的dom对象，然后根据虚拟的dom对象创建真实的dom并塞入文档结构

每一个dom节点都是一个虚拟的dom对象，他都会包含tag(节点名称)/data(数据)/children(子元素)/text(text节点)四个属性

```javascript
// 生成虚拟dom树
  function Vnode(tag, data, children, text) {
    this.tag = tag;
    this.data = data;
    this.children = children;
    this.text = text;
  }
```
创建一个render函数，这个render函数的作用主要是把每一个dom节点都new一个虚拟的dom对象

```javascript
function render() {
    return new Vnode(
      // tag
      'div',
      // data
      {
        attrs: {
          'class': 'wrapper'
        }
      },
      // children
      [
        new Vnode(
          'p',
          {
            attrs: {
              'class': 'inner'
            }
          },
          [new Vnode(undefined, undefined, undefined, 'hello world')]
        )
      ]
    )
  }
```

-------------------