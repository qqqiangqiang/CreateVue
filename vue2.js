;(function() {

  // 创建虚拟domTree方法
  function createVnode(tag, data, children, text) {
    return new Vnode(tag, data, children, text);
  }
  // 虚拟domTree对象
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

  // 初始化数据的工作
  function initData (vm) {
    var data = vm.$data = vm.$options.data;
    var keys = Object.keys(data);
    var i = keys.length;

    while(i--) {
      proxy(vm, keys[i])
    }
  }

  // 将传过来的参数中的data加入vue实例，然后将'this.message'的变化映射到'this.data.message'
  function proxy(vm, key) {
    Object.defineProperty(vm, key, {
      configurable: true,
      enumerable: true,
      get: function(){
        return vm.$data[key]
      },
      set: function(val) {
        vm.$data[key] = val
      }
    })
  }

  function Vue(options) {
    var vm = this;
    vm.$options = options;
    initData(vm);
    vm.mount(document.querySelector(options.el))
  }

  Vue.prototype.mount = function(el) {
    var vm = this;
    // 生成渲染树
    patch(el, vm.render());
  }
  // 更新dom节点
  Vue.prototype.update = function() {

  }
  // 创建虚拟dom
  Vue.prototype.render = function() {
    var vm = this;
    return vm.$options.render.call(vm);
  }

  var app = new Vue({
    el: '#app',
    data: {
      message: 'Hello World!'
    },
    render() {
      return createVnode(
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
          createVnode(
            'p',
            {
              attrs: {
                'class': 'inner'
              }
            },
            [createVnode(undefined, undefined, undefined, this.message)]
          )
        ]
      )
    }
  })

  setTimeout(function(){
    app.message = 'Hello Dongzhiqiang'
  }, 2000)



})()