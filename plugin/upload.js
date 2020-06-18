import { extname } from 'path'
export default async function ({ debug }) {
  let { config: { cdn }, version, util: { isImage, image2base64 } } = this
  return async function (files) {

    for (let { key, content } of files) {

      if (this.isPro()) {
        let url
        if (/\/inline\//.test(key) && isImage(key)) {
          url = image2base64(content)
          debug(`\t ${key} => base64`)
        }
        else {
          //临时这样写一下，else 里面的后面会删除。
          if (cdn.isLocal) {
            url = await cdn.upload(content, key)
          }
          else {
            url = await cdn.upload(content, extname(key), { file: key })
          }
          debug(`\t ${key} => ${url}`)
        }
        version.set({
          key,
          url
        })
      }
      else {
        version.set({
          key,
          url: `/${key}`
        })
        debug(`\t ${key} => /${key}`)
      }
    }
  }
}