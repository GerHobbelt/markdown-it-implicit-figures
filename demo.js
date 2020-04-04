'use strict';
var md = require('@gerhobbelt/markdown-it')();
var implicitFigures = require('@gerhobbelt/markdown-it-implicit-figures');

md.use(implicitFigures, { dataType: true, figcaption: true });

var src = 'text with ![](img.png)\n\n![Will become caption.](fig.png "Foo bar")\n\nanother paragraph';
var res = md.render(src);

console.log(res);
