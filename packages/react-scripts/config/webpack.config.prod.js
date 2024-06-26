// @remove-on-eject-begin
/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
// @remove-on-eject-end
'use strict';

const autoprefixer = require('autoprefixer');
const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const InlineChunkHtmlPlugin = require('react-dev-utils/InlineChunkHtmlPlugin');
const ManifestPlugin = require('webpack-manifest-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const safePostCssParser = require('postcss-safe-parser');
const InterpolateHtmlPlugin = require('react-dev-utils/InterpolateHtmlPlugin');
const SWPrecacheWebpackPlugin = require('sw-precache-webpack-plugin');
const eslintFormatter = require('react-dev-utils/eslintFormatter');
const ModuleScopePlugin = require('react-dev-utils/ModuleScopePlugin');
const nodeSass = require('node-sass');
const paths = require('./paths');
const getClientEnvironment = require('./env');
const libs = require('./libs');
const alias = require('./alias');

// should we enable split chunking or not
const shouldUseSplitChunks = process.env.ENABLE_SPLIT_CHUNKS !== 'false';

// should we enable runtime chunking
const shouldUseRuntimeChunk = process.env.GENERATE_RUNTIME_CHUNK !== 'false';

// should we inline the runtime chunking process
const shouldInlineRuntimeChunk = process.env.INLINE_RUNTIME_CHUNK !== 'false';

// Determine if the target page is LCC <lightning:container src=''/> page and not Visualforce page
const isTargetLightningPage = process.env.IS_TARGETPAGE_LIGHTNING === 'true';

// Webpack uses `publicPath` to determine where the app is being served from.
// It requires a trailing slash, or the file assets will get an incorrect path.
let publicPath = paths.servedPath;

// Some apps do not use client-side routing with pushState.
// For these, "homepage" can be set to "." to enable relative asset paths.
const shouldUseRelativeAssetPaths = publicPath === './';

// Source maps are resource heavy and can cause out of memory issue for large source files.
const shouldUseSourceMap = process.env.GENERATE_SOURCEMAP !== 'false';

// Source mapping url to hold private source maps.
const sourceMappingURL = process.env.SOURCEMAP_URL || '';

// `publicUrl` is just like `publicPath`, but we will provide it to our app
// as %PUBLIC_URL% in `index.html` and `process.env.PUBLIC_URL` in JavaScript.
// Omit trailing slash as %PUBLIC_URL%/xyz looks better than %PUBLIC_URL%xyz.
const publicUrl = publicPath.slice(0, -1);

// style files regexes
const cssRegex = /\.css$/;
//const cssModuleRegex = /\.module\.css$/;
const sassRegex = /\.(scss|sass)$/;
//const sassModuleRegex = /\.module\.(scss|sass)$/;

// Get environment variables to inject into our app.
const env = getClientEnvironment(publicUrl);

// Get possible module paths
const appNodeModules = paths.appNodeModules;
const uiLightningPath = path.resolve(appNodeModules, '@svmx/ui-components-lightning');
const uiPredixPath = path.resolve(appNodeModules, process.env.REACT_APP_UI_COMPONENTS_PREDIX_PATH || '@svmx/ui-components-predix');
const uiLibBowerPath = path.resolve(uiPredixPath, 'bower_components');
const uiLibBuiltBowerPath = path.resolve(uiPredixPath, 'build/polymer');

// Boolean flags detecting existance of ancillary libraries
const containsUIPredixLibrary = fs.existsSync( uiPredixPath);
const containsUILightningLibrary = fs.existsSync(uiLightningPath);
const containsUIComponents = (containsUIPredixLibrary || containsUILightningLibrary);
const containsUIScheduler = env.stringified['process.env'].REACT_APP_INCLUDE_SCHEDULER;

let resolveModules = ['node_modules', 'src', appNodeModules];
let sassIncludePaths = ['node_modules', 'src'];

// Assert this just to be safe.
// Development builds of React are slow and not intended for production.
if (env.stringified['process.env'].NODE_ENV !== '"production"') {
  throw new Error('Production builds must have NODE_ENV=production.');
}

// Note: defined here because it will be used more than once.
let cssFilename = 'static/css/[name].[contenthash:8].css';
let jsFilename = 'static/js/[name].[chunkhash:8].js';
if (containsUILightningLibrary) {
  cssFilename = 'static/css/[name].css';
  jsFilename = 'static/js/[name].js';
}

// Use this option to disable split chunks
const disableSplitChunks = {
  cacheGroups: {
    default: false,
  },
};

// Use this as default option for split chunks
const defaultSplitChunks = {
  chunks: 'all',
  name: false,
};

const plugins = [
  // Inlines the webpack runtime script. This script is too small to warrant
  // a network request.
  shouldInlineRuntimeChunk &&
    new InlineChunkHtmlPlugin(HtmlWebpackPlugin, [/runtime~.+[.]js/]),
  // Makes some environment variables available in index.html.
  // The public URL is available as %PUBLIC_URL% in index.html, e.g.:
  // <link rel="shortcut icon" href="%PUBLIC_URL%/favicon.ico">
  // In production, it will be an empty string unless you specify "homepage"
  // in `package.json`, in which case it will be the pathname of that URL.
  new InterpolateHtmlPlugin(HtmlWebpackPlugin, env.raw),
  // Generates an `index.html` file with the <script> injected.
  new HtmlWebpackPlugin({
    template: paths.appHtml,
    inject: !containsUIComponents,
    containsUIComponents: containsUIComponents,
    containsUIPredix: containsUIPredixLibrary,
    containsUILightning: containsUILightningLibrary,
    containsUIScheduler: containsUIScheduler,
    isTargetLightningPage: isTargetLightningPage,
    isProduction: true,
    minify: {
      removeComments: true,
      collapseWhitespace: true,
      removeRedundantAttributes: true,
      useShortDoctype: true,
      removeEmptyAttributes: true,
      removeStyleLinkTypeAttributes: true,
      keepClosingSlash: true,
      minifyJS: true,
      minifyCSS: true,
      minifyURLs: true,
    },
  }),
  // Makes some environment variables available to the JS code, for example:
  // if (process.env.NODE_ENV === 'production') { ... }. See `./env.js`.
  // It is absolutely essential that NODE_ENV was set to production here.
  // Otherwise React will be compiled in the very slow development mode.
  new webpack.DefinePlugin(env.stringified),
  new MiniCssExtractPlugin({
    // Options similar to the same options in webpackOptions.output
    // both options are optional
    filename: cssFilename,
    chunkFilename: 'static/css/[name].[contenthash:8].chunk.css',
  }),
  // Generate a manifest file which contains a mapping of all asset filenames
  // to their corresponding output file so that tools can pick it up without
  // having to parse `index.html`.
  new ManifestPlugin({
    fileName: 'asset-manifest.json',
  }),
  // Generate a service worker script that will precache, and keep up to date,
  // the HTML & assets that are part of the Webpack build.
  new SWPrecacheWebpackPlugin({
    // By default, a cache-busting query parameter is appended to requests
    // used to populate the caches, to ensure the responses are fresh.
    // If a URL is already hashed by Webpack, then there is no concern
    // about it being stale, and the cache-busting can be skipped.
    dontCacheBustUrlsMatching: /\.\w{8}\./,
    filename: 'service-worker.js',
    logger(message) {
      if (message.indexOf('Total precache size is') === 0) {
        // This message occurs for every build and is a bit too noisy.
        return;
      }
      if (message.indexOf('Skipping static resource') === 0) {
        // This message obscures real errors so we ignore it.
        // https://github.com/facebookincubator/create-react-app/issues/2612
        return;
      }
      console.log(message);
    },
    minify: true,
    // For unknown URLs, fallback to the index page
    navigateFallback: publicUrl + '/index.html',
    // Ignores URLs starting from /__ (useful for Firebase):
    // https://github.com/facebookincubator/create-react-app/issues/2237#issuecomment-302693219
    navigateFallbackWhitelist: [/^(?!\/__).*/],
    // Don't precache sourcemaps (they're large) and build asset manifest:
    staticFileGlobsIgnorePatterns: [/\.map$/, /asset-manifest\.json$/],
  }),
  // Moment.js is an extremely popular library that bundles large locale files
  // by default due to how Webpack interprets its code. This is a practical
  // solution that requires the user to opt into importing specific locales.
  // https://github.com/jmblog/how-to-optimize-momentjs-with-webpack
  // You can remove this if you don't use Moment.js:
  new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/)
];

if (containsUILightningLibrary) {
  // reset the publicPath to root, for images within salesforce resources to properly map
  publicPath = process.env.PUBLIC_PATH || '';
  sassIncludePaths.push(
    path.resolve(uiLightningPath, 'node_modules'),
    uiLightningPath
  );
  // TODO: UI-4511: The copied file is still missing `slds-cope`
  // For now it's still going to be manual step downloading specifiv ver & slds-scope'd from
  // https://tools.lightningdesignsystem.com/css-customizer
  // plugins.push(
  //   new CopyWebpackPlugin([
  //     {
  //       context: path.resolve(paths.appNodeModules, '@salesforce-ux/design-system/assets/styles'),
  //       from: '**/*.min.css',
  //       to: `${paths.appBuild}/static/css`,
  //     },
  //   ])
  // );
}

if (containsUIPredixLibrary) {
  resolveModules.push('bower_components', uiLibBowerPath);
  sassIncludePaths.push('bower_components', uiLibBowerPath);
  plugins.push(
    new CopyWebpackPlugin([
      {
        context: path.resolve(paths.appPath, uiLibBuiltBowerPath),
        from: '**/*',
        to: 'polymer',
      },
    ])
  );
}

if (sourceMappingURL) {
  plugins.push(
    new webpack.SourceMapDevToolPlugin({
      // this is the url of our private sourcemap server
      publicPath: sourceMappingURL,
      filename: '[file].map',
    }),
  );
}

const jsIncludePaths = libs.reduce(
  (result, lib) => {
    const jsIncludePathsForLib = lib.jsIncludePaths || [];
    const libName = lib.name;
    jsIncludePathsForLib.forEach(jsIncludePath => {
      const jsPath = path.resolve(appNodeModules, libName, jsIncludePath);
      if (fs.existsSync(jsPath)) {
        result.push(jsPath);
      }
    });
    return result;
  },
  [paths.appSrc]
);

// This is the production configuration.
// It compiles slowly and is focused on producing a fast and minimal bundle.
// The development configuration is different and lives in a separate file.
module.exports = {
  // Webpack 4 requires the mode flag to be set
  mode: 'production',
  // Don't attempt to continue if there are any errors.
  bail: true,
  // We generate sourcemaps in production. This is slow but gives good results.
  // You can exclude the *.map files from the build during deployment.
  devtool: (shouldUseSourceMap && !sourceMappingURL) ? 'source-map' : false,
  // In production, we only want to load the polyfills and the app code.
  entry: [require.resolve('./polyfills'), paths.appIndexJs],
  output: {
    // The build folder.
    path: paths.appBuild,
    // Generated JS file names (with nested folders).
    // There will be one main bundle, and one file per asynchronous chunk.
    // We don't currently advertise code splitting but Webpack supports it.
    filename: jsFilename,
    chunkFilename: 'static/js/[name].[chunkhash:8].chunk.js',
    // We inferred the "public path" (such as / or /my-project) from homepage.
    publicPath: publicPath,
    // Point sourcemap entries to original disk location (format as URL on Windows)
    devtoolModuleFilenameTemplate: info =>
      path
        .relative(paths.appSrc, info.absoluteResourcePath)
        .replace(/\\/g, '/'),
  },
  optimization: {
    minimize: true,
    minimizer: [
      // This is only used in production mode
      new TerserPlugin({
        terserOptions: {
          parse: {
            // we want terser to parse ecma 8 code. However, we don't want it
            // to apply any minfication steps that turns valid ecma 5 code
            // into invalid ecma 5 code. This is why the 'compress' and 'output'
            // sections only apply transformations that are ecma 5 safe
            // https://github.com/facebook/create-react-app/pull/4234
            ecma: 8,
          },
          compress: {
            ecma: 5,
            warnings: false,
            // Disabled because of an issue with Uglify breaking seemingly valid code:
            // https://github.com/facebook/create-react-app/issues/2376
            // Pending further investigation:
            // https://github.com/mishoo/UglifyJS2/issues/2011
            comparisons: false,
            // Disabled because of an issue with Terser breaking valid code:
            // https://github.com/facebook/create-react-app/issues/5250
            // Pending futher investigation:
            // https://github.com/terser-js/terser/issues/120
            inline: 2,
          },
          mangle: {
            safari10: true,
          },
          output: {
            ecma: 5,
            comments: false,
            // Turned on because emoji and regex is not minified properly using default
            // https://github.com/facebook/create-react-app/issues/2488
            ascii_only: true,
          },
        },
        // Use multi-process parallel running to improve the build speed
        // Default number of concurrent runs: os.cpus().length - 1
        parallel: true,
        // Enable file caching
        cache: true,
        sourceMap: shouldUseSourceMap,
      }),
      // This is only used in production mode
      new OptimizeCSSAssetsPlugin({
        cssProcessorOptions: {
          parser: safePostCssParser,
          map: shouldUseSourceMap
            ? {
                // `inline: false` forces the sourcemap to be output into a
                // separate file
                inline: false,
                // `annotation: true` appends the sourceMappingURL to the end of
                // the css file, helping the browser find the sourcemap
                annotation: true,
              }
            : false,
        },
      }),
    ],
    // Automatically split vendor and commons
    // https://twitter.com/wSokra/status/969633336732905474
    // https://medium.com/webpack/webpack-4-code-splitting-chunk-graph-and-the-splitchunks-optimization-be739a861366
    splitChunks: shouldUseSplitChunks ? defaultSplitChunks : disableSplitChunks,
    // Keep the runtime chunk seperated to enable long term caching
    // https://twitter.com/wSokra/status/969679223278505985
    runtimeChunk: shouldUseRuntimeChunk,
  },
  resolve: {
    symlinks: false,
    // This allows you to set a fallback for where Webpack should look for modules.
    // We placed these paths second because we want `node_modules` to "win"
    // if there are any conflicts. This matches Node resolution mechanism.
    // https://github.com/facebookincubator/create-react-app/issues/253
    modules: resolveModules.concat(
        // It is guaranteed to exist because we tweak it in `env.js`
        process.env.NODE_PATH.split(path.delimiter).filter(Boolean)
      ),
    // These are the reasonable defaults supported by the Node ecosystem.
    // We also include JSX as a common component filename extension to support
    // some tools, although we do not recommend using it, see:
    // https://github.com/facebookincubator/create-react-app/issues/290
    // `web` extension prefixes have been added for better support
    // for React Native Web.
    extensions: ['.web.js', '.mjs', '.js', '.json', '.web.jsx', '.jsx', '.ts', '.tsx'],
    alias: Object.assign({
      // @remove-on-eject-begin
      // Resolve Babel runtime relative to react-scripts.
      // It usually still works on npm 3 without this but it would be
      // unfortunate to rely on, as react-scripts could be symlinked,
      // and thus babel-runtime might not be resolvable from the source.
      'babel-runtime': path.dirname(
        require.resolve('babel-runtime/package.json')
      ),
      // @remove-on-eject-end
      // Support React Native Web
      // https://www.smashingmagazine.com/2016/08/a-glimpse-into-the-future-with-react-native-for-web/
      'react-native': 'react-native-web',
    }, alias),
    plugins: [
      // Prevents users from importing files from outside of src/ (or node_modules/).
      // This often causes confusion because we only process files within src/ with babel.
      // To fix this, we prevent you from importing files out of src/ -- if you'd like to,
      // please link the files into your node_modules/ and let module-resolution kick in.
      // Make sure your source files are compiled, as they will not be processed in any way.
      new ModuleScopePlugin(paths.appSrc, [paths.appPackageJson]),
    ],
  },
  module: {
    strictExportPresence: true,
    rules: [
      // TODO: Disable require.ensure as it's not a standard language feature.
      // We are waiting for https://github.com/facebookincubator/create-react-app/issues/2176.
      // { parser: { requireEnsure: false } },

      // First, run the linter.
      // It's important to do this before Babel processes the JS.
      {
        test: /\.(js|jsx|mjs)$/,
        enforce: 'pre',
        use: [
          {
            options: {
              formatter: eslintFormatter,
              eslintPath: require.resolve('eslint'),
              // @remove-on-eject-begin
              // TODO: consider separate config for production,
              // e.g. to enable no-console and no-debugger only in production.
              baseConfig: {
                extends: [require.resolve('eslint-config-react-app')],
              },
              ignore: false,
              useEslintrc: false,
              // @remove-on-eject-end
            },
            loader: require.resolve('eslint-loader'),
          },
        ],
        include: jsIncludePaths,
      },
      {
        // "oneOf" will traverse all following loaders until one will
        // match the requirements. When no loader matches it will fall
        // back to the "file" loader at the end of the loader list.
        oneOf: [
          // Add the raw loader for custom ServiceMax SVG assets loaded through React
          {
            test: [/\.svg$/],
            issuer: {
              test: /\.jsx?$/,
            },
            loader: require.resolve('raw-loader'),
          },
          // "url" loader works just like "file" loader but it also embeds
          // assets smaller than specified size as data URLs to avoid requests.
          {
            test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/, /\.svg$/],
            loader: require.resolve('url-loader'),
            options: {
              limit: 10000,
              name: 'static/media/[name].[hash:8].[ext]',
            },
          },
          // Process JS with Babel.
          {
            test: /\.(js|jsx|mjs|ts|tsx)$/,
            include: jsIncludePaths,
            loader: require.resolve('babel-loader'),
            options: {
              // @remove-on-eject-begin
              babelrc: false,
              presets: [require.resolve('babel-preset-react-app')],
              plugins: [
                ['module-resolver', {
                  root: ['./src'],
                }],
              ],
              // @remove-on-eject-end
              compact: true,
            },
          },
          // The notation here is somewhat confusing.
          // "postcss" loader applies autoprefixer to our CSS.
          // "css" loader resolves paths in CSS and adds assets as dependencies.
          // "style" loader normally turns CSS into JS modules injecting <style>,
          // but unlike in development configuration, we do something different.
          // `ExtractTextPlugin` first applies the "postcss" and "css" loaders
          // (second argument), then grabs the result CSS and puts it into a
          // separate file in our build process. This way we actually ship
          // a single CSS file in production instead of JS code injecting <style>
          // tags. If you use code splitting, however, any async bundles will still
          // use the "style" loader inside the async code so CSS from them won't be
          // in the main CSS file.
          {
            test: [cssRegex, sassRegex],
            loaders: [
              {
                loader: MiniCssExtractPlugin.loader,
                options: Object.assign(
                  {},
                  shouldUseRelativeAssetPaths ? { publicPath: '../../' } : undefined
                ),
              },
              {
                loader: require.resolve('css-loader'),
                options: {
                  importLoaders: 1,
                  minimize: true,
                  sourceMap: shouldUseSourceMap,
                },
              },
              {
                // Options for PostCSS as we reference these options twice
                // Adds vendor prefixing based on your specified browser support in
                // package.json
                loader: require.resolve('postcss-loader'),
                options: {
                  // Necessary for external CSS imports to work
                  // https://github.com/facebook/create-react-app/issues/2677
                  ident: 'postcss',
                  plugins: () => [
                    require('postcss-flexbugs-fixes'),
                    require('postcss-preset-env')({
                      autoprefixer: {
                        flexbox: 'no-2009',
                      },
                      stage: 3,
                    }),
                  ],
                  sourceMap: shouldUseSourceMap,
                },
              },
              {
                loader: require.resolve('sass-loader'),
                options: {
                  sourceMap: shouldUseSourceMap,
                  includePaths: sassIncludePaths,
                  functions: {
                    "env($variable)": variable => {
                        const value = variable.getValue();
                        const envValue = process.env[value];
                        const sassValue = new nodeSass.types.String(envValue);
                        return sassValue;
                    }
                  }
                },
              },
            ].filter(Boolean)
          },
          // "file" loader makes sure assets end up in the `build` folder.
          // When you `import` an asset, you get its filename.
          // This loader doesn't use a "test" so it will catch all modules
          // that fall through the other loaders.
          {
            loader: require.resolve('file-loader'),
            // Exclude `js` files to keep "css" loader working as it injects
            // it's runtime that would otherwise processed through "file" loader.
            // Also exclude `html` and `json` extensions so they get processed
            // by webpacks internal loaders.
            exclude: [/\.(js|jsx|mjs|ts|tsx)$/, /\.html$/, /\.json$/],
            options: {
              name: 'static/media/[name].[hash:8].[ext]',
            },
          },
          // ** STOP ** Are you adding a new loader?
          // Make sure to add the new loader(s) before the "file" loader.
        ],
      },
    ],
  },
  plugins: plugins,
  // Some libraries import Node modules but don't use them in the browser.
  // Tell Webpack to provide empty mocks for them so importing them works.
  node: {
    dgram: 'empty',
    fs: 'empty',
    net: 'empty',
    tls: 'empty',
    child_process: 'empty',
  },
};
