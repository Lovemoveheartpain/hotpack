
import clone from 'clone'
/**
 * 不完全符合amd规范
 * 1. 模块必须有 key，key的格式形如 a/b.js a/b/c.js a.js
 */
class ToAmd {
  constructor({ key, importInfo, exportInfo, content }) {
    this.importInfo = clone(importInfo)
    this.exportInfo = clone(exportInfo)
    this.content = content
    this.key = key

    this.deps = null
  }
  toString() {
    this.deps = []
    let result = null
    let { token, subtoken, deps } = this._importToToken()
    if (this.exportInfo.length > 0) {
      const exportString = this._exportToString()

      //最后加\n，否则最后一行如果有注释，})就无效了
      result = `define("${this.key}",[${deps}],function(${token}){${subtoken}${this.content}\n${exportString}\n});`
    }
    else {
      result = `require([${deps}],function(${token}){${subtoken}${this.content}\n});`
    }
    return result
  }
  getDeps() {
    if (this.deps === null) {
      throw new Error('please run toString function first')
    }
    return this.deps.slice()
  }
  _importToToken() {
    let [token, subtoken, deps] = [[], [], []]
    let index = 0;
    let getToken = function () {
      //TODO,消除fromEs6这种解析类硬编码 _k_
      return '_k_' + index++
    }
    for (let item of this.importInfo) {
      if (item.type === 'css') {
        this.deps.push(item.key)
        continue
      }

      let thisToken = getToken()
      deps.push(item.key)

      this.deps = this.deps.concat(deps)
      token.push(thisToken)

      for (let subItem of item.token) {
        let { from, to } = subItem
        if (from === '*') {
          subtoken.push(`var ${to}=${thisToken};`)
          continue
        }
        //React && React.hasOwnProperty('default') 也可以象这样写
        //a[key] key不一定存在，比如 umd,手动把umd中的key加上，但是返回的没有default key，所以需要判断一下
        if (from === 'default') {
          subtoken.push(`var ${to}=${thisToken}["${from}"]?${thisToken}["${from}"]:${thisToken};`)
        }
        else {
          subtoken.push(`var ${to}=${thisToken}["${from}"];`)
        }
      }
    }
    token = token.join(',')
    deps = deps.map(item => `"${item}"`).join(',')
    subtoken = subtoken.join('')
    return {
      token,
      subtoken,
      deps
    }
  }
  //默认直接返回对象
  //根据 es6模块标准，需要跟踪模块变化，这时传入 isSimple=false，不过大多数情况下，不需要这样。
  _exportToString() {
    let result = null
    //if (this.isSimple) {
    result = this.exportInfo.map(item => `"${item.to}":${item.from}`).join(',')
    return `return {${result}};`
    //}
    /* else {
      const key = '__es6Export__'
      result = `var ${key}={};`
      result += 'var __def=Object.defineProperty;'
      for (const item of this.exportInfo) {
        result += `
        __def(${key},${item.to},{get:function(){return ${item.from}}})
      `
      }
      result += "return __es6Export__;"
    } 
    return result*/
  }
}

export default ToAmd