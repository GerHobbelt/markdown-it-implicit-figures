markdown-it-special-paragraphs [![Build Status][travis badge]][travis status] [![npm version][npm badge]][npm version]
==============================

About
-----

**This plugin is work in progress!** Currently, it is mostly a clone of [another plugin][implicit figures], although the documentation may indicate more functionality already.

This plugin to the Javascript Commonmark parser [markdown-it] is based upon [markdown-it-implicit-figures][implicit figures] ([npm][npm implicit figures]) and [markdown-it-html5-media][html5 media]. It made sense to incorporate them in a single plugin for this instead of having users chain them themselves.

Render links and embedded images, videos or audios occurring by itself in a paragraph as figures with caption. Expanded link previews use Twitter Card and Facebook Open Graph meta data if available. HTML5 element types `figure` and `figcaption` Images show are wrapped  `<figure><img ...></figure>`, similar to [pandoc's implicit figures][Pandoc].

To do
-----

We have not decided yet which scraper for link metadata to use (by default):

- [embedza](https://www.npmjs.com/package/embedza)
- [Open Graph scraper](https://www.npmjs.com/package/open-graph-scraper)
- [grabity](https://www.npmjs.com/package/grabity)
- [metascraper](https://www.npmjs.com/package/metascraper)
- [metaphor](https://www.npmjs.com/package/metaphor)
- [unfurled](https://www.npmjs.com/package/unfurled)
- [html-metadata](https://www.npmjs.com/package/html-metadata)

Example
-------

### Example input

~~~~ markdown
text with ![image](img.png), ![video](vid.mp4), ![audio](aud.mp3) and [link](page.html),
[image link](img.png), [video link](vid.mp4), [audio link](aud.mp3). 

![figure](fig.png)

![video](vid.mp4)

![audio](aud.mp3)

[link](page.html)

[![preview](fig.png)](page.html)

[![video](vid.mp4)](page.html)

[![audio](aud.mp3)](page.html)
~~~~

Reference and shortcut links work as well, of course, and generate the same result.

~~~~ markdown
text with ![image], ![video], ![audio] and [link],
[image link][image], [video link][video], [audio link][audio]. 

![figure][image]

![video][]

![audio]

[link]

[![preview][image]][link]

[![video][]][link]

[![audio]][link]

  [image]: img.png
  [video]: vid.mp4
  [audio]: aud.mp3
  [link]: page.html
~~~~

### Example output

~~~~ html
<p>text with <img src="img.png" alt="image">, <img src="vid.mp4" alt="video">, <img src="aud.mp3" alt="audio"> and <a href="page.html">link</a>,
<a href="img.png">image link</a>, <a href="vid.mp4">video link</a>, <a href="aud.mp3">audio link</a>.</p>
<figure><img src="fig.png" alt="figure"></figure>
<figure><video src="vid.mp4">video</video></figure>
<figure><audio src="aud.mp3">audio</audio></figure>
<figure><a href="page.html">...link...</a></figure>
<figure><a href="page.html"><img src="fig.png" alt="preview"></a></figure>
<figure><a href="page.html"><video src="vid.mp4">video</video></a></figure>
<figure><a href="page.html"><audio src="aud.mp3">audio</audio></a></figure>
~~~~

Install
-------

```
$ npm install --save markdown-it-special-paragraphs
```

Usage
-----

~~~~ js
var md = require('markdown-it')();
var implicitFigures = require('markdown-it-special-paragraphs');

md.use(implicitFigures, {
  dataType: false,  // <figure data-type="image">, default: false
  figcaption: false,  // <figcaption>alternative text</figcaption>, default: false -- will change to true
  tabindex: false, // <figure tabindex="1+n">..., default: false -- deprecated
  link: false // <a href="img.png"><img src="img.png"></a>, default: false
});

var src = `text with ![](img.png)

![](fig.png)

another paragraph`;
var res = md.render(src);

console.log(res);
~~~~

[Demo at JS Fiddle](https://jsfiddle.net/arve0/1kk1h6p3/4/)

### Options

- `dataType`: Set `dataType` to `true` to declare the data-type being wrapped,
  e.g.: `<figure data-type="image">`. This can be useful for applying special
  styling for different kind of figures.
- `figcaption`: Set `figcaption` to `true` to put the alternative text in a
  `<figcaption>`-block after the image. E.g.: `![caption](img.png)` renders to

  ~~~~ html
  <figure>
    <img src="img.png" alt="caption">
    <figcaption>caption</figcaption>
  </figure>
  ~~~~
- `tabindex`: Set `tabindex` to `true` to add a `tabindex` property to each
  figure, beginning at `tabindex="1"` and incrementing for each figure
  encountered. Could be used with [this css-trick](https://css-tricks.com/expanding-images-html5/),
  which expands figures upon mouse-over. _(Deprecated)_
- `link`: Put a link around the image if there is none yet.
- `copyAttrs`: Copy attributes matching (RegExp or string) `copyAttrs` to `figure` element. _(Deprecated)_

License
-------

MIT © [Arve Seljebu](http://arve0.github.io/), [Erik Moeller](http://eloquence.github.io), [Christoph Päper](http://crissov.github.io)

The parts from the [HTML5 Media] plugin are actually licensed under Creative Commons 0 (CC0), which are both as close to Public Domain (PD) as possible.

[travis status]: https://travis-ci.org/crissov/markdown-it-special-paragraphs
[travis badge]: https://travis-ci.org/crissov/markdown-it-special-paragraphs.svg?branch=master
[npm version]: http://badge.fury.io/js/markdown-it-special-paragraphs
[npm badge]: https://badge.fury.io/js/markdown-it-special-paragraphs.svg
[implicit figures]: https://github.com/arve0/markdown-it-implicit-figures
[npm implicit figures]: https://www.npmjs.com/package/markdown-it-implicit-figures
[html5 media]: https://github.com/eloquence/markdown-it-html5-media
[npm html5 media]: https://www.npmjs.com/package/markdown-it-html5-media
[Pandoc]: http://pandoc.org/README.html#images
[MIT]: https://opensource.org/licenses/MIT
[CC0]: https://creativecommons.org/share-your-work/public-domain/cc0/
[commonmark]: https://spec.commonmark.org/
[markdown-it]: https://github.com/markdown-it/markdown-it
[npm makrdown-it]: https://www.npmjs.com/package/markdown-it
