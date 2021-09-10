const path = require('path');
 
const config = {
 entry: './src/index.js',
 devtool: (process.env.NODE_ENV === 'production') ? false : 'inline-source-map',
 mode: (process.env.NODE_ENV === 'production') ? 'production' : 'development',
 output: {
   path: path.resolve(__dirname, 'dist'),
   filename: 'app.bundle.js'
 },
 module: {
   rules: [
     {
       test: /\.js$/,
       exclude: /(node_modules)/,
       use: {
         loader: 'babel-loader'
       }
     },
     loader: 'css-loader', options: {
        url: false,
        importLoaders: 2,
            modules: {
              mode: 'local',
              localIdentName: isProduction ? '[hash:base64:5]' : '[local]_[hash:base64:5]'
            },
     },
     {
                test: /\.svg$/,
                use: [
                    {
                        loader: 'svg-url-loader',
                        options: {
                            // Inline files smaller than 10 kB
                            limit: 10 * 1024,
                            noquotes: true,
                        },
                    },
                ],
    },
    ],
  },
   ]
 },
};
 
module.exports = config;