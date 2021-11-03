<img src="https://raw.githubusercontent.com/captainbrosset/1DIV/main/dist/img/icon-512.png" alt="The 1DIV app logo" style="width:100px;margin:0 auto;display:block;">

**1DIV** is a demo web app where you can create CSS designs using just one HTML `div` element. Your designs are saved only locally in the browser's memory. You can create as many as you want. This demo app can be installed locally as a PWA.

The main goal of this demo is to showcase the Window Controls Overlay PWA feature, so to make the most use of it, enable the feature in a Chromium-based browser: `Desktop PWA Window Controls Overlay`.

The demo app also uses [contructable stylesheets](https://developers.google.com/web/updates/2019/02/constructable-stylesheets) which are only support in Chromium-based browsers, and on Firefox if you enable the `layout.css.constructable-stylesheets.enabled` flag first.

To build the app locally: `npm install` and then `npm run build`. Use a web server in the `dist` directory to serve the app.