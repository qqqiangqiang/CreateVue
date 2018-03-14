;(function() {

  // 虚拟domTree对象
  function Vnode(tag, data, children, text, elm) {
    this.tag = tag;
    this.data = data;
    this.children = children;
    this.text = text;
    this.elm = elm;
  }
  // 创建一个element虚拟dom对象
  function createElementVnode(tag, data, children, text, elm) {
    return new Vnode(tag, data, children, text, elm);
  }
  // 初始化一个只包含一个节点的虚拟dom对象
  function createEmptyNodeAt(elm) {
    return new Vnode(elm.tagName.toLowerCase(), {}, [], undefined, elm);
  }
  // 判断是不是同一个vnode
  function sameVnode(vnode1, vnode2) {
    return vnode1.tag === vnode2.tag
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

  // 更新children
  function updateChildren(oldCh, Ch) {
    if (sameVnode(oldCh[0], Ch[0])) {
      patchVnode(oldCh[0], Ch[0]);
    } else {
      patch(oldCh[0], Ch[0]);
    }
  }

  // 比较vnode节点，并更新dom
  function patchVnode(oldVnode, vnode) {
    var elm = vnode.elm = oldVnode.elm;
    var oldCh = oldVnode.children;
    var Ch = vnode.children;

    if(!vnode.text) {
      if (oldCh && Ch) {
        updateChildren(oldCh, Ch);
      }
    } else if(oldVnode.text != vnode.text) {
      elm.textContent = vnode.text;
    }
  }

  function patch(oldVnode, vnode) {
    var isRealElement = oldVnode.nodeType !== undefined;
    if (!isRealElement && sameVnode(oldVnode, vnode)) {
       patchVnode(oldVnode, vnode)
    } else  {
      if (isRealElement) {
        oldVnode = createEmptyNodeAt(oldVnode);
      }
      var elm = oldVnode.elm;
      var parent = elm.parentNode;

      createElm(vnode);

      parent.insertBefore(vnode.elm, elm);
      parent.removeChild(elm);

      return vnode.elm;
    }
  }

  // 初始化数据的工作
  function initData (vm) {
    var data = vm.$data = vm.$options.data;
    var keys = Object.keys(data);
    var i = keys.length;

    while(i--) {
      proxy(vm, keys[i]);
    }

    observe(data);
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

  // 数据劫持
  function observe(data) {
    for (var key in data) {
      defineReactive(data, key, data[key])
    }
  }

  function defineReactive(data, key, val) {
    var dep = new Dep();
    Object.defineProperty(data, key, {
      configurable: true,
      enumerable: true,
      get: function() {
        if (Dep.target) {
          Dep.target.addDep(dep);
        }
        return val
      },
      set: function(nVal) {
        if (nVal !== val) {
          val = nVal;
          dep.notify();
        }
      }
    })
  }

  // 收集相关的订阅者watcher
  var $id = 0;

  function Dep() {
    this.id = $id ++;
    this.subs = []
  }
  Dep.target = null;
  // 增加watcher
  Dep.prototype.addSub = function(sub) {
    this.subs.push(sub);
  }
  // 发布消息，并通知所有的订阅者watcher
  Dep.prototype.notify = function() {
    console.log('>>', this.subs);
    for (var i = 0; i < this.subs.length; i ++) {
      this.subs[i].update();
    }
  }

  // 订阅者原型
  function Watcher(vm, cb) {
    this.vm = vm;
    this.depIds = [];
    this.cb = cb;
    Dep.target = this;
    this.value = this.get();
  }

  Watcher.prototype.get = function() {
    var value = this.cb.call(this.vm);
  }

  Watcher.prototype.addDep = function(dep) {
    dep.addSub(this);
  }

  Watcher.prototype.update = function() {
    var value = this.get();
  }

  function Vue(options) {
    var vm = this;
    vm.$options = options;
    initData(vm);
    vm.mount(document.querySelector(options.el));
  }

  Vue.prototype.mount = function(el) {
    var vm = this;
    vm.$el = el;
    // 生成渲染树
    new Watcher(vm, function(){
      vm.update(vm.render());
    })
  }
  // 更新dom节点
  Vue.prototype.update = function(vnode) {
    var vm = this;
    // vm.mount(document.querySelector(vm.$options.el));
    var prevVnode = vm._vnode;
    vm._vnode = vnode;
    if (!prevVnode) {
      vm.$el = vm.patch(vm.$el, vnode);
    } else {
      vm.$el = vm.patch(prevVnode, vnode);
    }
  }
  Vue.prototype.patch = patch;
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
      return createElementVnode(
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
          createElementVnode(
            'p',
            {
              attrs: {
                'class': 'inner'
              }
            },
            [createElementVnode(undefined, undefined, undefined, this.message)]
          )
        ]
      )
    }
  })

  setTimeout(function(){
    // debugger;
    app.message = 'Hello Dongzhiqiang'
    // app.update(app.render());
    console.log(app);
  }, 2000)



})()