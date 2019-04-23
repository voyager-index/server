let nodePandoc = require('node-pandoc');
 
let src = './views/pages/data_article.md';
 
// Arguments can be either a single String or in an Array
let args = '-f markdown -t html -o ./views/pages/data_article.ejs';
 
// Set your callback function
const callback = (err, result)=> {
 
  if (err) console.error('Oh Nos: ',err)
  //return console.log(result), result
}
 
// Call pandoc
nodePandoc(src, args, callback);
