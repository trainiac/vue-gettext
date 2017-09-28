import uuid from './uuid'
import { getTranslation } from './translate'

/**
 * Translate content according to the current language.
 */
export default {

  name: 'translate',

  created: function () {

    this.msgid = ''  // Don't crash the app with an empty component, i.e.: <translate></translate>.

    // Store the raw uninterpolated string to translate.
    // This is currently done by looking inside a private attribute `_renderChildren` of the current
    // Vue instance's instantiation options.
    // However spaces introduced by newlines are not exactly the same between the HTML and the
    // content of `_renderChildren`, e.g. 6 spaces becomes 4 etc. See issue #15 for problems which
    // can arise with this.
    // I haven't (yet) found a better way to access the raw content of the component.
    if (this.$options._renderChildren) {
      if (this.$options._renderChildren[0].hasOwnProperty('text')) {
        this.msgid = this.$options._renderChildren[0].text.trim()
      } else {
        this.msgid = this.$options._renderChildren[0].trim()
      }
    }

    this.isPlural = this.translateN !== undefined && this.translatePlural !== undefined
    if (!this.isPlural && (this.translateN || this.translatePlural)) {
      throw new Error(`\`translate-n\` and \`translate-plural\` attributes must be used together: ${this.msgid}.`)
    }

  },

  props: {
    tag: {
      type: String,
      default: 'span',
    },
    // Always use v-bind for dynamically binding the `translateN` prop to data on the parent,
    // i.e.: `:translateN`.
    translateN: {
      type: Number,
      required: false,
    },
    translatePlural: {
      type: String,
      required: false,
    },
    translateContext: {
      type: String,
      required: false,
    },
    translateParams: {
      type: Object,
      required: false,
    },
    // `translateComment` is used exclusively by `easygettext`'s `gettext-extract`.
    translateComment: {
      type: String,
      required: false,
    },
  },

  computed: {
    translation: function () {
      let translation = getTranslation(
        this.msgid,
        this.$root.language,
        this.translateN,
        this.translateContext,
        this.isPlural ? this.translatePlural : null
      )

      let context = this.$parent

      if (this.translateParams) {
        context = Object.assign({}, this.$parent, this.translateParams)
      }

      return this.$gettextInterpolate(translation, context)
    },
  },

  render: function (createElement) {

    // Fix the problem with v-if, see #29.
    // Vue re-uses DOM elements for efficiency if they don't have a key attribute, see:
    // https://vuejs.org/v2/guide/conditional.html#Controlling-Reusable-Elements-with-key
    // https://vuejs.org/v2/api/#key
    if (!this.$vnode.key) {
      this.$vnode.key = uuid()
    }

    // The text must be wraped inside a root HTML element, so we use a <span> (by default).
    // https://github.com/vuejs/vue/blob/a4fcdb/src/compiler/parser/index.js#L209
    return createElement(this.tag, [this.translation])

  },

}
