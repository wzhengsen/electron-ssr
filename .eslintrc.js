module.exports = {
  root: true,
  // https://github.com/babel/babel-eslint/issues/530#issuecomment-385774262
  // parserOptions: {
  //   "parser": "babel-eslint"
  // },
  env: {
    browser: true,
    node: true
  },
  extends: [
    "plugin:vue/essential",
    "@vue/standard"
  ],
  globals: {
    __static: true
  },
  // plugins: [
  //   'html'
  // ],
  rules: {
    // allow debugger during development
    'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 0,
  }
}
