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

  function initData(vm) {
    var data = vm.$data = vm.$options.data;
    var keys = Object.keys(data);
    var i = keys.length;

    while(i--) {
      proxy(vm, keys[i]);
    }

    // => 升级observe包装data
    observe(data);

  }

  function initComputed(vm) {
    var attrs = vm.$options.computed;

    for (var key in attrs) {
      var fun = attrs[key];
      Object.defineProperty(vm, key, {
        configurable: true,
        enumerable: true,
        get: makeComputer(vm, fun),
        set: function() {}
      })
    }
  }

  function makeComputer(vm, fn) {
    var watcher = new Watcher(vm, fn, undefined, {
      lazy: true
    });

    return function() {
      if (watcher.dirty) {
        watcher.evalute();
      }
      if (Dep.target) {
        watcher.depend();
      }

      return watcher.value;
    }
  }

  function proxy(vm, key) {
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

  /*
  * observe
  * 主要实现数据劫持，收集依赖、发布消息进行通知等，实现发布、订阅的主要逻辑都在此函数
  */

  function observe(obj) {
    for (var key in obj) {
      defineReactive(obj, key, obj[key])
    }
  }

  function defineReactive(obj, key, val) {
    var dep = new Dep();

    Object.defineProperty(obj, key, {
      enumerable: true,
      configurable: true,
      // 收集依赖，建立一对多的关系，让多个观察者监听当前主题对象
      get: function() {
        if (Dep.target) {
          // Dep.target.addDep(dep);
          // console.log('>>>>', dep);
          dep.depend();
        }
        return val;
      },
      // 劫持到数据变更，并发布消息进行通知
      set: function(newVal) {
        if (newVal === val) return;
        val = newVal;
        dep.notify();
      }
    })
  }


  /*
  * Dep原型类
  * Dep，全名 Dependency，Dep 类是用来做依赖收集的
  */
  // 全局唯一uid$1
  var  uid$1 = 0;
  function Dep() {
    this.subs = [];
    this.id = uid$1 ++;
  }

  Dep.target = null;

  Dep.prototype.addSub = function(sub) {
    this.subs.push(sub);
  }

  Dep.prototype.notify = function() {
    var subs = this.subs;
    for (var i = 0; i < subs.length; i ++) {
      console.log('>>', subs[i]);
      subs[i].update();
    }
  }

  Dep.prototype.depend = function() {
    Dep.target.addDep(this);
  }

  /*
  * watcher原型类
  * Watcher 意为观察者，它负责做的事情就是订阅 Dep ，当Dep 发出消息传递（notify）的时候，所有订阅着 Dep 的 Watchers 会进行自己的 update 操作
  */
  function Watcher (vm, exOrFn, cb, options) {
    // set lazy
    this.lazy = options && options.lazy;
    this.dirty = this.lazy;
    this.vm = vm;
    this.getter = exOrFn;
    this.cb = cb;
    this.depIds = [];
    this.deps = [];
    this.newDeps= [];
    // 如果是computed计算属性，初始化watcher的时候将首先把value置为undefiend
    this.value = this.lazy ? undefined : this.get();
  }

  Watcher.prototype.get = function() {
    Dep.target = this;
    var value = this.getter.call(this.vm);
    this.afterGet();

    return value;
  }

  Watcher.prototype.update = function() {
    var value = this.get();
    // if (this.value !== value) {
    //   var oldValue = value;
    //   this.value = value;
    //   this.cb.call(this.vm, value, oldValue);
    // }
  }

  Watcher.prototype.addDep = function(dep) {
    var id = dep.id;
    if (this.depIds.indexOf(id) === -1) {
      this.depIds.push(id);
      this.newDeps.push(dep);
      dep.addSub(this);
    }
  }

  Watcher.prototype.afterGet = function() {
    Dep.target = null;
    this.deps = this.newDeps;
  }

  Watcher.prototype.evalute = function() {
    var current = Dep.target;
    // 获取computed的value值.
    this.value = this.get();
    // 将target指针指向render的watcher.
    Dep.target = current;

  }

  Watcher.prototype.depend = function() {
    var i = this.deps.length;
    while(i--) {
      this.deps[i].depend();
    }
  }

  /*
  * vue原型类
  */
  function Vue(options) {
    // 存储this指针
    var vm = this;
    vm.$options = options;
    // init回调，在实例开始初始化时同步调用。此时数据观测、事件和 watcher 都尚未初始化。
    this._callHook('init');
    // 初始化数据 => 升级 observe包装data
    initData(vm);
    // 初始化computed
    initComputed(vm);
    // 初始化时传入根节点(#app)
    vm.mount(document.querySelector(options.el))
  }
  // 更新dom节点
  Vue.prototype.mount = function (el) {
    var vm = this;
    // 将this.$el设置为根节点(#app)
    vm.$el = el;
    // 根据生成的虚拟dom树，更新dom节点
    // => 升级 new watcher 对象包装
    new Watcher(vm, function(){
      vm.update(vm.render());
    })
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

  Vue.prototype._callHook = function(hook) {
    var handler = this.$options[hook];
    handler.call(this);
  }

  var vm = new Vue({
    el: '#app',
    data: {
      message: 'hello',
      isShow: true
    },
    init() {
      console.log('>>>init事件钩子');
    },
    computed: {
      msg: function() {
        return this.message + 'dongzhiqiang';
      }
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
            this.msg
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
    vm.message = 'nihao';
  }, 1000)

  setTimeout(function() {
    vm.message = 'nizhenhao';
  }, 2000)

})()