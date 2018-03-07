# Vuejs
[TOC]


## 将虚拟DOM树渲染到真实的DOM

> 整体的思路便是首先创建虚拟的dom对象，然后根据虚拟的dom对象创建真实的dom并塞入文档结构

1、每一个dom节点都是一个虚拟的dom对象，他都会包含tag(节点名称)/data(数据)/children(子元素)/text(text节点)四个属性

```javascript
// 生成虚拟dom树
  function Vnode(tag, data, children, text) {
    this.tag = tag;
    this.data = data;
    this.children = children;
    this.text = text;
  }
```
2、创建一个render函数，这个render函数的作用主要是把每一个dom节点都new一个虚拟dom

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
3、有了虚拟的dom对象，我们要做的就是将虚拟dom对象转化为真实的dom对象

```javascript
// 根据虚拟node对象创建真实dom
  function createElm(vnode) {
    var tag = vnode.tag;
    var data = vnode.data;
    var children = vnode.children;

    if (tag !== undefined) {
      // 将真实的dom挂载到虚拟node对象上
      vnode.elm = document.createElement(tag);

      if (data.attrs !== undefined) {
        // 将属性值挂载到真实的dom
        var attrs = data.attrs;
        for (var key in attrs) {
          vnode.elm.setAttribute(key, attrs[key]);
        }
      }

      if (children) {
        createChildren(vnode, children);
      }
    } else {
      // 如果tag为0， 则为创建text节点
      vnode.elm = document.createTextNode(vnode.text);
    }
    return vnode.elm;
  }
// 根据虚拟node中的children插入真实dom
  function createChildren(vnode, children) {
    for (var i = 0; i < children.length; i ++) {
      vnode.elm.append(createElm(children[i]));
    }
  }

  function patch(oldVnode, vnode) {
    createElm(vnode);
    var isRealElement = oldVnode.nodeType !== undefined;
    if (isRealElement) {
      oldVnode.appendChild(vnode.elm);
    }

    return vnode.elm;
  }
```

-------------------