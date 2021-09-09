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
     {
        test: /\.css$/,
        // the order of `use` is important!
        use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
     },
   ]
 },
};
 
module.exports = config;