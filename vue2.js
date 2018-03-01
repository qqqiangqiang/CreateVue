;(function() {

  // 生成虚拟dom树
  function Vnode(tag, data, children, text) {
    this.tag = tag;
    this.data = data;
    this.children = children;
    this.text = text;
  }
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

  // template标签中的内容都会被编译为render函数
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
  // mount函数
  function mount(el) {
    // 转化后的虚拟node对象
    var vnode = render();
    patch(el, vnode)
  }
  // 根据根节点插入数据
  mount(document.querySelector('#app'))

})()