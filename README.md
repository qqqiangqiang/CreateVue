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

## 创建一个vue实例

> 主要实现的是创建一个vue实例，当vue实例中的data值变化时能根据改变后的data更新dom节点。

我们知道一个标准的vue实例代码是这样的：(摘自vue官网)

```javascript
var app = new Vue({
  el: '#app',
  data: {
    message: 'Hello Vue!'
  }
})
```
那我们的目标自然也是实现一个类似的实例，只不过我们暂时在数据变化时手动去更新dom结构。下一章节我们将实现vue核心的发布/订阅模式。

最终实现的代码如下：
```javascript
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
    app.message = 'Hello Dongzhiqiang'
    app.update(app.render());
  }, 2000)
```


<strong>1、首先我们先创建一个的vue原型类，我们在初始化vue实例时做的事情：始化data、首次将dom结构渲染在页面上。</strong>

- 初始化data
主要是利用```Object.defineProperty```实现```this.message```的变化能同步到```this.data.message```

```javascript
function initData(vm) {
  var data = vm.$data = vm.$options.data;
  var keys = Object.keys(data);
  var i = keys.length;
  while(i--) {
    proxy(vm, keys[i])
  }
}

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
```
- 首次将dom结构渲染在页面上(这个函数将稍后进行讲解)

```javascript
    vm.mount(document.querySelector(options.el));
```

这一部分的整体代码如下：

```javascript
function Vue(options) {
    var vm = this;
    vm.$options = options;
    initData(vm);
    vm.mount(document.querySelector(options.el));
  }
```

<strong>2、根据dom的变化，重新渲染相应的dom结构。</strong>

上一部分我们已经实现了虚拟dom到真实dom的操作，无非就是根据vhost对象，进行一系列dom操作云云， 在vue中将所有的更新节点操作放在update函数中，本质是就根据改变数据后的vhost对象重新生成新的dom节点。

-  生成vhost对象
```javascript
// 生成虚拟dom对象的函数，将挂载到vue的原型链上
Vue.prototype.render = function() {
    var vm = this;
    return vm.$options.render.call(vm);
  }
```
```javascript
// createElementVnode
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
```
- 根据生成的vhost对象&对比vhost的变化，重新渲染dom
```javascript
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
      // var elm = oldVnode.elm;
      // var parent = elm.parentNode;
      createElm(vnode);
      // // parent.appendChild(elm);
      // parent.insertBefore(Vnode.elm, elm);
      oldVnode.elm.appendChild(vnode.elm);

      return vnode.elm;
    }
  }
```

-------------------

## 数据变化自动渲染dom

> vue中的数据变化，也是应用了观察者模式，其主要数据流向如下图所示

<img src="https://files.jb51.net/file_images/article/201801/2018129144258424.png?2018029144311">


从整体上来说，data中的每一个key值都会对应相应的dep对象，这个dep对象里面收集者相应的watcher，存储在对象中的subs数组属性中，当有数据变化时，就会触发所有订阅者的watcher.

最终每个dep的数据结构如下图所示。

![Alt text](./1521024563710.png)

我们按照代码的执行顺序来进行分析。

- Observe data(主要实现数据劫持，收集依赖、发布消息进行通知等，实现发布、订阅的主要逻辑都在此函数)
```javascript
function Oberseve(obj) {
  for (var key in data) {
    defineReactive(obj, key, obj[key])
  }
}

function defineReactive(obj, key, val) {
  var dep = new Dep();
  Object.defineProperty(obj, key) {
    get: function() {
      if (Dep.target) {
        // 实际上是调用watcher的addDep方法，将watcher对象添加到作用域链     上的subs数组，Dep.target指向当前实际正在收集的订阅者
        Dep.target.addDep(dep);
      }
      return val;
    }
    set: function(nval) {
      if (nval !== val) {
        val = nval;
        dep.notify();
      }
    }
  }
}
```
- Dep，可以理解为发布者的角色，将会收集订阅者，并进行消息的发布。
```javascript
// 全局唯一的id,防止重复收集
var uid$1 = 0;
function Dep() {
  this.id = uid$1 ++ ;
  this.subs = [];
}
Dep.target = null;
Dep.prototype.addSub = function(sub) {
  this.subs.push(sub);
}
Dep.prototype.notify = function() {
  for (var i = 0 ; i < this.subs.length; i ++) {
    this.subs[i].update();
  }
}
```
- Watcher，负责做的事情就是订阅 Dep ，当Dep 发出消息传递（notify）的时候，所有订阅着 Dep 的 Watchers 会进行自己的 update 操作
```javascript
  function Watcher (vm, exOrFn, cb) {
    this.vm = vm;
    this.getter = exOrFn;
    this.cb = cb;
    // 存储所有发布者的唯一id，防止重复收集
    this.depIds = [];
    this.value = this.get();
  }

  Watcher.prototype.get = function() {
    Dep.target = this;
    var value = this.getter.call(this.vm);
    Dep.target = null;
    return value;
  }

  Watcher.prototype.update = function() {
    var value = this.get();
    if (this.value !== value) {
      var oldValue = value;
      this.value = value;
      this.cb.call(this.vm, value, oldValue);
    }
  }

  Watcher.prototype.addDep = function(dep) {
    var id = dep.id;
    if (this.depIds.indexOf(id) === -1) {
      this.depIds.push(id);
      dep.addSub(this);
    }
  }
```

-------------------

## 选项/生命周期钩子

> 初始化vue实例的时候，我们可以增加各种生命周期的处理函数，如下所示：
<br/> init
created
beforeCompile
compiled
ready
attached
detached
beforeDestroy
destroyed

其实针对于这些生命周期的回调函数来说，无非就是在相应的位置处理调用相应的回调函数

- _callHook
```javascript
Vue.prototype._callHook = function(hook) {
    var handler = this.$options[hook];
    handler.call(this);
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
```

-------------------


## computed计算属性

>computed计算属性同样依赖于Object.definePropertyOf，针对于每一个计算属性将生成一个唯一的watcher(订阅者)，同时针对于每一个计算属性进行数据劫持，当尝试获取该值的时候，将会把该watcher订阅依赖的data，同时为这一组订阅再加上组件render的订阅

- 在初始完data之后，开始初始化computed
```javascript```
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
```
- 获取computed参数里面的key值，然后进行数据劫持，同时为每一个key值都初始化唯一的watcher.

```javascript```
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
```
- 根据computed值进行dom的渲染，同时在其依赖值变化的时候重新computed并进行dom的重新渲染。
```javascript
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
```


-------------------

