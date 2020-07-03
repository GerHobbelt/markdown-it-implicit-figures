
let md = require('@gerhobbelt/markdown-it')();
let implicitFigures = require('@gerhobbelt/markdown-it-implicit-figures');

md.use(implicitFigures, { dataType: true, figcaption: true });

let src = 'text with ![](img.png)\n\n![Will become caption.](fig.png "Foo bar")\n\nanother paragraph';
let res = md.render(src);

console.log(res);
