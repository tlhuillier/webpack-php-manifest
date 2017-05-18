var _ = require('lodash')

function PhpManifestPlugin (options) {
  this.options = options || {}
}

const optionOrFallback = (optionValue, fallbackValue) => optionValue !== undefined ? optionValue : fallbackValue;

PhpManifestPlugin.prototype.apply = function apply (compiler) {
  var options = this.options;
  var output = optionOrFallback(options.output, 'assets-manifest') + '.php';

  var phpClassName = optionOrFallback(options.phpClassName, 'WebpackBuiltFiles');

  var getCssFiles = function(filelist) {
    return _.filter(filelist, function (filename) {
      return filename.endsWith('.css');
    });
  };

  var getJsFiles = function(filelist) {
    return _.filter(filelist, function (filename) {
      return filename.endsWith('.js');
    });
  };

  var arrayToPhpStatic = function(list, varname) {
    var out = '  static $' + varname + ' = [\n'
    _.forEach(list, function (item) {
      out += "    '" + item + "',";
    });
    out += '\n  ];\n';
    return out;
  };

  var phpClassComment = function(phpClassName) {
    return '/** \n* Built by webpack-php-manifest \n* Class ' + phpClassName + '\n*/\n';
  }

  var objectToPhpClass = function(phpClassName, obj) {
    // Create a header string for the generated file:
    var out = '<?php\n'
      + phpClassComment(phpClassName)
      + 'class ' + phpClassName + ' {\n';

    _.forEach(obj, function (list, name) {
      out += arrayToPhpStatic(list, name);
    });

    out += '\n}\n';
    return out;
  };

  compiler.plugin('emit', function(compilation, callback) {

    var stats = compilation.getStats().toJson();
    var toInclude = [];

    // Flatten the chunks (lists of files) to one list
    for (var chunkName in stats.assetsByChunkName) {
      toInclude = _.union(toInclude, stats.assetsByChunkName[chunkName]);
    }

    var out = objectToPhpClass(phpClassName, {
      jsFiles: getJsFiles(toInclude),
      cssFiles: getCssFiles(toInclude)
    });

    // Insert this list into the webpack build as a new file asset:
    compilation.assets[output] = {
      source: function() {
        return out;
      },
      size: function() {
        return out.length;
      }
    };

    callback();
  });
};

module.exports = PhpManifestPlugin;