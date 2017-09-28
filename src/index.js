import Component from './component'
import interpolate from './interpolate'
import translate from './translate'
import { shareVueInstance } from './localVue'


let languageVm  // Singleton.

let GetTextPlugin = function (Vue, options = {}) {

  let defaultConfig = {
    availableLanguages: { en_US: 'English' },
    defaultLanguage: 'en_US',
    silent: Vue.config.silent,
    translations: null,
    hot: false,
  }

  Object.keys(options).forEach(key => {
    if (Object.keys(defaultConfig).indexOf(key) === -1) {
      throw new Error(`${key} is an invalid option for the translate plugin.`)
    }
  })

  if (!options.translations) {
    throw new Error('No translations available.')
  }

  options = Object.assign(defaultConfig, options)

  shareVueInstance(Vue)

  Object.defineProperty(Vue.config, 'getTextPluginSilent', {
    enumerable: true,
    writable: true,
    value: options.silent,
  })

  if (options.hot) {
    // In development we want the translate tags to hot reload
    const overrides = {
      data () {
        return {
          msgid: '',
        }
      },
      beforeUpdate () {
        this.msgid = this.getMsgId()
      },
      methods: {
        getMsgId () {
          if (this.$slots.default) {
            if (this.$slots.default[0].hasOwnProperty('text')) {
              return this.$slots.default[0].text.trim()
            }
            return this.$slots.default[0].trim()
          }

          return ''
        },
      },
    }
    Vue.component('translate', Component.extend(overrides))
  } else {
    Vue.component('translate', Component)
  }

  // Exposes global properties.
  Vue.$translations = options.translations
  // Exposes instance methods.
  Vue.prototype.$gettext = translate.gettext.bind(translate)
  Vue.prototype.$pgettext = translate.pgettext.bind(translate)
  Vue.prototype.$ngettext = translate.ngettext.bind(translate)
  Vue.prototype.$npgettext = translate.npgettext.bind(translate)
  Vue.prototype.$gettextInterpolate = interpolate.bind(interpolate)

}

export default GetTextPlugin
