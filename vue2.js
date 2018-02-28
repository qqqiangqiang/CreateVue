;(function() {

  // 生成虚拟dom树
  function vnode(tag, data, children, text, elm) {
    this.tag = tag;
    this.data = data;
    this.children = children;
    this.text = text;
    this.elm = elm;
  }

  // 序列化children
  function normalizeChildren(children) {
    if (typeof children == 'string') {
      return [createTextVNode(children)]
    }
    return children;
  }

  // 创建text节点
  function createTextVNode(val) {
    // 字符串val
    return new vnode(undefined, undefined, undefined, String(val))
  }

  function createElement(tag, data, children) {
    return new vnode(tag, data, normalizeChildren(children), undefined, undefined)
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



  // 比较是不是同一个tag
  function sameVnode(vnode1, vnode2) {
    return vnode1.tag === vnode2.tag;
  }
  function emptyNodeAt(elm) {
    return new vnode(elm.tagName.toLowerCase(), {}, [], undefined, elm)
  }
  function patchVnode(oldVnode, vnode) {
    var elm = vnode.elm = oldVnode.elm;
    var oldCh = oldVnode.children;
    var ch = vnode.children;

    if (!vnode.text) {
      if (oldCh && ch) {
        updateChildren(oldCh, ch)
      }
    } else if(oldVnode.text !== vnode.text) {
      elm.textContent = vnode.text;
    }
  }
  function updateChildren(oldCh, newCh) {
    if (sameVnode(oldCh[0], newCh[0])) {
      patchVnode(oldCh[0], newCh[0])
    } else {
      patch(oldCh[0], newCh[0]);
    }
  }

  function patch(oldVnode, vnode) {
    // 是否是真实dom节点
    var isRealElement = oldVnode.nodeType !== undefined;
    // 如果是虚拟dom节点&&是同一个tag
    if(!isRealElement && sameVnode(oldVnode, vnode)) {
      // patch虚拟dom
      patchVnode(oldVnode, vnode);
    } else {
      if (isRealElement) {
        // 如果是真实dom节点
        // 初始化为老的虚拟dom节点
        oldVnode = emptyNodeAt(oldVnode);
      }
      var elm = oldVnode.elm;
      var parent = elm.parentNode;

      createElm(vnode);

      parent.insertBefore(vnode.elm, elm);
      parent.removeChild(elm);

    }
    return vnode.elm;

  }

  // template标签中的内容都会被编译为render函数
  // function render() {
  //   return new Vnode(
  //     // tag
  //     'div',
  //     // data
  //     {
  //       attrs: {
  //         'class': 'wrapper'
  //       }
  //     },
  //     // children
  //     [
  //       new Vnode(
  //         'p',
  //         {
  //           attrs: {
  //             'class': 'inner'
  //           }
  //         },
  //         [new Vnode(undefined, undefined, undefined, 'hello world')]
  //       )
  //     ]
  //   )
  // }
  // // mount函数
  // function mount(el) {
  //   // 转化后的虚拟node对象
  //   var vnode = render();
  //   patch(el, vnode)
  // }
  // // 根据根节点插入数据
  // mount(document.querySelector('#app'))
  function initData(vm) {
    var data = vm.$data = vm.$options.data;
    var keys = Object.keys(data);
    var i = keys.length;

    while(i--) {
      proxy(vm, keys[i]);
    }

    observe(vm)

  }

  function observe(vm, obj) {
    for (var key in obj) {
      Object.defineProperty(obj, key, {
        set: function(newVal) {
          if (newVal === val) return;
          val = newVal;
          vm.update(vm.render())
        }
      })
    }
  }

  function proxy(vm, key) {
    console.log('>>>', vm, 'key>>>', key)
    Object.defineProperty(vm, key, {
      configurable: true,
      enumerable: true,
      get: function() {
        return vm.$data[key]
      },
      set: function(val) {
        vm.$data[key] = val;
      }
    })
  }


  // Vue原型类
  function Vue(options) {
    // 存储this指针
    var vm = this;
    vm.$options = options;
    // 初始化数据
    initData(vm);
    // 初始化时传入根节点(#app)
    vm.mount(document.querySelector(options.el))
  }
  // 更新dom节点
  Vue.prototype.mount = function (el) {
    var vm = this;
    // 将this.$el设置为根节点(#app)
    vm.$el = el;
    // 根据生成的虚拟dom树，更新dom节点
    vm.update(vm.render())
  }

  Vue.prototype.update = function(vnode) {
    var vm = this;
    var preVnode = vm._vnode;
    vm._vnode = vnode;

    // 如果没有更新过,则$el设置为patch(根节点和虚拟dom)
    if (!preVnode) {
      vm.$el = vm.patch(vm.$el, vnode);
    } else {
      // 否则，则$el设置为patch(上一次虚拟dom和本次虚拟dom)
      vm.$el = vm.patch(preVnode, vnode);
    }
  }

  Vue.prototype.patch = patch;

  Vue.prototype.render = function() {
    var vm = this;
    return vm.$options.render.call(vm);
  }

  var vm = new Vue({
    el: '#app',
    data: {
      message: 'hello world',
      isShow: true
    },
    render() {
      return createElement(
        'div',
        {
          attrs: {
            'class': 'wrapper'
          }
        },
        [
          this.isShow
          ? createElement(
            'p',
            {
              attrs: {
                'class': 'inner'
              }
            },
            this.message
          )
          : createElement(
            'h1',
            {
              attrs: {
                'class': 'inner'
              }
            },
            'hello world'
          )
        ]
      )
    }
  })

  setTimeout(function() {
    vm.message = 'hello';
    // vm.update(vm.render())
  }, 1000)

  setTimeout(function() {
    vm.isShow = false;
    // vm.update(vm.render())
  }, 2000)


})()