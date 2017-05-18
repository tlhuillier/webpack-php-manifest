## PHP Manifest from Webpack

This webpack plugin will create a PHP file in your `output.path` directory with a PHP class in it having two static
 attributes: `$jsFiles` and `$cssFiles`. These can be accessed by your PHP application to learn about what to include
 when rendering the frontend of the site.
 
Usage:
```javascript
// ...in your webpack config file

const PhpManifestPlugin = require('webpack-php-manifest');
const phpManifest = new PhpManifestPlugin(options);

module.exports = {
  // ...
  plugins: [
    phpManifest
  ]
}
```

## Available options:

`output` (default: "assets-manifest")

The name of the manifest file to write. Will be written to webpack's
 `output.path` directory and appended with `.php`.
 
---

`phpClassName` (default: "WebpackBuiltFiles") 

The PHP class name to use for the class. You can generally ignore this
 unless you have a conflicting PHP class named `\WebpackBuiltFiles` in your PHP environment.
 
## Support in the wild

#### October CMS

Use the October CMS plugin called [webpackassets-plugin](https://packagist.org/packages/castiron/webpackassets-plugin).