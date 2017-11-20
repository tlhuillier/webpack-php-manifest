var _ = require('lodash')
var path = require('path')
var url = require('url')
var fs = require('fs')

function PhpManifestPlugin (options) {
  this.options = options || {}
}

const optionOrFallback = (optionValue, fallbackValue) => optionValue !== undefined ? optionValue : fallbackValue;

PhpManifestPlugin.prototype.apply = function apply (compiler) {
  var options = this.options;
  // Get webpack options
  var filepath = options.path ? options.path : '';
  // Public path (like www), used when writing the file
  var prefix = options.pathPrefix ? options.pathPrefix : '';
  // By default, build the file with node fs. Can be included in webpack with an option.
  var webpackBuild = options.webpackBuild ? options.webpackBuild : false;
  var output = optionOrFallback(options.output, 'assets-manifest') + '.php';

  var phpClassName = optionOrFallback(options.phpClassName, 'WebpackBuiltFiles');

  var getCssFiles = function(filelist, filepath) {
    return _.map(_.filter(filelist, function (filename) {
      return filename.endsWith('.css');
    }), function(filename) {
      if (!prefix) return path.join(filepath, filename);

      // Return url prefixed path if url exists
      return url.resolve(prefix, path.join(filepath, filename));
    });
  };

  var getJsFiles = function(filelist, filepath) {
    const files = _.map(_.filter(filelist, function (filename) {
      return filename.endsWith('.js');
    }), function(filename) {
      if (!prefix) return path.join(filepath, filename);

      // Return url prefixed path if url exists
      return url.resolve(prefix, path.join(filepath, filename));
    });

    // Add webpack-dev-server js url
    if (options.devServer) files.push(url.resolve(prefix, 'webpack-dev-server.js'));

    return files;
  };

  var arrayToPhpStatic = function(list, varname) {
    var out = '    static $' + varname + ' = array(\n       '
    _.forEach(list, function (item) {
      out += " '" + item + "',";
    });
    out += '\n    );\n';
    return out;
  };

  var phpClassComment = function(phpClassName) {
    return '/** \n* Built by webpack-php-manifest\n* 2007-2017 PrestaShop.\n*\n* NOTICE OF LICENSE\n*\n* This source file is subject to the Academic Free License (AFL 3.0)\n* that is bundled with this package in the file LICENSE.txt.\n* It is also available through the world-wide-web at this URL:\n* http://opensource.org/licenses/afl-3.0.php\n* If you did not receive a copy of the license and are unable to\n* obtain it through the world-wide-web, please send an email\n* to license@prestashop.com so we can send you a copy immediately.\n*\n* DISCLAIMER\n*\n* Do not edit or add to this file if you wish to upgrade PrestaShop to newer\n* versions in the future. If you wish to customize PrestaShop for your\n* needs please refer to http://www.prestashop.com for more information.\n*\n*  @author    PrestaShop SA <contact@prestashop.com>\n*  @copyright 2007-2017 PrestaShop SA\n*  @license   http://opensource.org/licenses/afl-3.0.php  Academic Free License (AFL 3.0)\n*  International Registered Trademark & Property of PrestaShop SA\n*/\n';
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

  var mkOutputDir = function(dir) {
    // Make webpack output directory if it doesn't already exist
    try {
      fs.mkdirSync(dir);
    } catch (err) {
      // If it does exist, don't worry unless there's another error
      if (err.code !== 'EEXIST') throw err;
    }
  }

  // Get output path from webpack
  var buildPath = compiler.options.output.path;

  compiler.plugin('emit', function(compilation, callback) {

    var stats = compilation.getStats().toJson();
    var toInclude = [];

    // Flatten the chunks (lists of files) to one list
    for (var chunkName in stats.assetsByChunkName) {
      toInclude = _.union(toInclude, stats.assetsByChunkName[chunkName]);
    }

    var out = objectToPhpClass(phpClassName, {
      jsFiles: getJsFiles(toInclude, filepath),
      cssFiles: getCssFiles(toInclude, filepath)
    });

    // Write file using fs
    // Build directory if it doesn't exist
    mkOutputDir(path.resolve(compiler.options.output.path));
    fs.writeFileSync(path.join(compiler.options.output.path, output), out);

    callback();
  });
};

module.exports = PhpManifestPlugin;
