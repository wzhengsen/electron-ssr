# ShadowsocksR cross-platform client

[中文](./README-CN.md)

`ShadowsocksR` is a cross-platform desktop client with support for Windows, MacOS and Linux. It is feature-rich, supports most of the features of the Windows version and has more user-friendly features. It is open source, is based on open source projects and gives back to the open source community.

## Note for Linux user

By default the `libsodium` maybe not get installed on some platform, for example, the `Fedora`, you can install it manually by command `dnf install libsodium`.

On some systems that use `Gnome` desktop, except `Ubuntu 18.04`, may not have the `AppIndicator` installed, you can manually install this [plugin](https://extensions.gnome.org/extension/615/appindicator-support/) to fix it. (or find it in the store's Add-ons-Shell Extensions)


## Features

- Support for manual configuration
- Support for automatic server subscription update. Copy this link to test:

  `https://raw.githubusercontent.com/shadowsocksrr/electron-ssr/master/docs/assets/subscribe.txt`
- Support for QR code scanning (Please make sure there is only one valid QR code on the screen). Scan this QR code to test:

  ![](docs/assets/scan.jpg)
- Support for importing the configuration from the clipboard, configuration file and other methods
- Support for copying QR codes and copying the ssr link (right click on the QR code and select copy in the context menu)
- Support for adding configurations and opening the application by clicking the ss/ssr link (Mac and Windows only). Please use the link above to test.
- Support for switching the system proxy mode: PAC, global proxy, no proxy
- [Built-in http_proxy](docs/HTTP_PROXY.md), can be turned on on or off in the options
- Support for changing the configuration
- Additional features in the menu bar

<!-- ## Telegram group

[![](https://img.shields.io/badge/Telegram-electron--ssr-blue.svg)](https://t.me/joinchat/E7ViZhJAZpKtnIJy9WepDA) -->

## Download

Visit the releases page [Github release](../../releases/latest):

- Windows `electron-ssr-setup-x.x.x.exe`
- Mac `electron-ssr-x.x.x.dmg`
- Linux (recommended) `electron-ssr-x.x.x.AppImage`, double click to run. If you cannot use it or want to download your own system-specific package please use the following options
- Arch or Arch-based distributions `electron-ssr-x.x.x.pacman`
- RedHat derivatives `electron-ssr-x.x.x.rpm`
- Debian derivatives `electron-ssr-x.x.x.deb`
- Other Linux distributions `electron-ssr-x.x.x.tar.gz`

## Configuration file location

- Windows `C:\Users\{your username}\AppData\Roaming\electron-ssr\gui-config.json`
- Mac `~/Library/Application Support/electron-ssr/gui-config.json`
- Linux `~/.config/gui-config.json`

## Shortcuts

The shortcuts were originally added to solve the problem that some Linux distributions cannot display the icon in the top bar. Therefore its content menu cannot be used. Of course on other systems the shortcut can be turned off in the settings.

### Global shortcuts

- `CommandOrControl+Shift+W` show/hide main window
- `not assigned` switch system proxy mode


## Known Bugs

- Some Linux system cannot switch system proxy mode. This application uses `gsetting` to set the system proxy, so some Linux systems cannot use this feature. If you know how to implement it, please feel free to create an issue.
- Switching the global system proxy on Windows fails

## Application screenshots

![](docs/assets/main.jpg)
![](docs/assets/settings.jpg)
![](docs/assets/ssr-settings.jpg)
![](docs/assets/subscribe.jpg)
![](docs/assets/tray.jpg)

## FAQ

[FAQ](./docs/FAQ.md)

## Issues

Before creating an issue please check whether the instructions in the FAQ can solve your problem.
Please first check whether there exists a similar issue. If there is please follow up on that issue.
Additionally if you find a bug please describe your environment in the issue. This includes operating system, software version, steps to reproduce, error logs etc.

## Icon resources

[https://www.figma.com/file/ghtehcxfzu0N2lQPoVEQXeU7/electron-ssr](https://www.figma.com/file/ghtehcxfzu0N2lQPoVEQXeU7/electron-ssr)

Feel free to propose a new revision.


## Build
> You might want to customize the build target in `vue.config.js`
``` bash
# or npm install
yarn

# run in development mode
npm run electron:dev

# build
npm run electron:build

# run the unit tests
npm run mocha

# run the code style check
npm run lint

```

## Changelog

Please check the [release notes](../../releases/latest).

## ShadowsocksR reference documents

- [ssr-libev deleted](https://github.com/breakwa11/shadowsocksr-libev)
- [ssr-libev backup](https://github.com/shadowsocksr-backup/shadowsocksr-libev)
- [SSR QRcode scheme deleted](https://github.com/breakwa11/shadowsocks-rss/wiki/SSR-QRcode-scheme)
- [SSR QRcode scheme backup](https://github.com/shadowsocksr-backup/shadowsocks-rss/wiki/SSR-QRcode-scheme)

---

