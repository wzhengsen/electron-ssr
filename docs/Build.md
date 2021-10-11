## How to Build

### Req
> You will need these to build Electron-SSR
1. node.js
2. yarn
3. network
4. time
5. love
6. passion
7. family
8. friends
9. ...
> Living in CN? \
> [mirrors for electron](https://npm.taobao.org/mirrors/)

### Build
1. `yarn` 
2. `yarn fetch-dep` will fetch 3dparty software like `socks2http`,`windows-kill`
> env variable `http_proxy`, `fetch_proxy` in `socks5`, and `http` will be used as proxy automatically.\
> Or you can try adding argument `-m` which will use a [github-mirror](http://github-mirror.bugkiller.org/) to download files, but it may be insecure.
3. `yarn electron:build` will build available target, make sure edit it as you need in `vue.config.js` if you are in linux

### Extra
N/A