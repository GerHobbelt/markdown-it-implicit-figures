
let assert = require('assert');
let Md = require('@gerhobbelt/markdown-it');
let implicitFigures = require('../');
let attrs = require('@gerhobbelt/markdown-it-attrs');

describe('markdown-it-implicit-figures', function () {
  let md;
  beforeEach(function () {
    md = Md().use(implicitFigures);
  });

  it('should add <figure> when image is by itself in a paragraph', function () {
    let src = 'text with ![](img.png)\n\n![](fig.png)\n\nanother paragraph';
    let expected = '<p>text with <img src="img.png" alt=""></p>\n<figure><img src="fig.png" alt=""></figure>\n<p>another paragraph</p>\n';
    let res = md.render(src);
    assert.equal(res, expected);
  });

  it('should add <figure> when image is by itself in a paragraph and preceeded by a standalone link', function () {
    md = Md().use(implicitFigures, { dataType: true, figcaption: true });
    let src = '[![Caption](fig.png)](http://example.com)';
    let expected = '<figure data-type="image"><a href="http://example.com"><img src="fig.png" alt=""></a><figcaption>Caption</figcaption></figure>\n';
    let res = md.render(src);
    assert.equal(res, expected);
  });

  it('should add data-type=image to figures when opts.dataType is set', function () {
    md = Md().use(implicitFigures, { dataType: true });
    let src = '![](fig.png)\n';
    let expected = '<figure data-type="image"><img src="fig.png" alt=""></figure>\n';
    let res = md.render(src);
    assert.equal(res, expected);
  });

  it('should add convert alt text into a figcaption when opts.figcaption is set', function () {
    md = Md().use(implicitFigures, { figcaption: true });
    let src = '![This is a caption](fig.png)';
    let expected = '<figure><img src="fig.png" alt=""><figcaption>This is a caption</figcaption></figure>\n';
    let res = md.render(src);
    assert.equal(res, expected);
  });

  it('should convert alt text for each image into a figcaption when opts.figcaption is set', function () {
    md = Md().use(implicitFigures, { figcaption: true });
    let src = '![caption 1](fig.png)\n\n![caption 2](fig2.png)';
    let expected = '<figure><img src="fig.png" alt=""><figcaption>caption 1</figcaption></figure>\n<figure><img src="fig2.png" alt=""><figcaption>caption 2</figcaption></figure>\n';
    let res = md.render(src);
    assert.equal(res, expected);
  });

  it('should add incremental tabindex to figures when opts.tabindex is set', function () {
    md = Md().use(implicitFigures, { tabindex: true });
    let src = '![](fig.png)\n\n![](fig2.png)';
    let expected = '<figure tabindex="1"><img src="fig.png" alt=""></figure>\n<figure tabindex="2"><img src="fig2.png" alt=""></figure>\n';
    let res = md.render(src);
    assert.equal(res, expected);
  });

  it('should reset tabindex on each md.render()', function () {
    md = Md().use(implicitFigures, { tabindex: true });
    let src = '![](fig.png)\n\n![](fig2.png)';
    let expected = '<figure tabindex="1"><img src="fig.png" alt=""></figure>\n<figure tabindex="2"><img src="fig2.png" alt=""></figure>\n';
    let res = md.render(src);
    assert.equal(res, expected);
    // render again, should produce same if resetting
    res = md.render(src);
    assert.equal(res, expected);
  });

  it('should not make figures of paragraphs with text and inline code', function () {
    let src = 'Text.\n\nAnd `code`.';
    let expected = '<p>Text.</p>\n<p>And <code>code</code>.</p>\n';
    let res = md.render(src);
    assert.equal(res, expected);
  });

  it('should not make figures of paragraphs with links only', function () {
    let src = '[link](page.html)';
    let expected = '<p><a href="page.html">link</a></p>\n';
    let res = md.render(src);
    assert.equal(res, expected);
  });

  it('should linkify captions', function () {
    md = Md({ linkify: true }).use(implicitFigures, { figcaption: true });
    let src = '![www.google.com](fig.png)';
    let expected = '<figure><img src="fig.png" alt=""><figcaption><a href="http://www.google.com">www.google.com</a></figcaption></figure>\n';
    let res = md.render(src);
    assert.equal(res, expected);
  });

  it('should work with markdown-it-attrs', function () {
    md = Md().use(attrs).use(implicitFigures);
    let src = '![](fig.png){.asdf}';
    let expected = '<figure><img src="fig.png" alt="" class="asdf"></figure>\n';
    let res = md.render(src);
    assert.equal(res, expected);
  });

  it('should put the image inside a link to the image if it is not yet linked', function () {
    md = Md().use(implicitFigures, { link: true });
    let src = '![www.google.com](fig.png)';
    let expected = '<figure><a href="fig.png"><img src="fig.png" alt="www.google.com"></a></figure>\n';
    let res = md.render(src);
    assert.equal(res, expected);
  });

  it('should not mess up figcaption when linking', function () {
    md = Md().use(implicitFigures, { figcaption: true, link: true });
    let src = '![www.google.com](fig.png)';
    let expected = '<figure><a href="fig.png"><img src="fig.png" alt=""></a><figcaption>www.google.com</figcaption></figure>\n';
    let res = md.render(src);
    assert.equal(res, expected);
  });

  it('should leave the image inside a link (and not create an extra one) if it is already linked', function () {
    md = Md().use(implicitFigures, { link: true });
    let src = '[![www.google.com](fig.png)](link.html)';
    let expected = '<figure><a href="link.html"><img src="fig.png" alt="www.google.com"></a></figure>\n';
    let res = md.render(src);
    assert.equal(res, expected);
  });

  it('should keep structured markup inside caption (event if not supported in "alt" attribute)', function () {
    md = Md().use(implicitFigures, { figcaption: true });
    let src = '![Image from [source](to)](fig.png)';
    let expected = '<figure><img src="fig.png" alt=""><figcaption>Image from <a href="to">source</a></figcaption></figure>\n';
    let res = md.render(src);
    assert.equal(res, expected);
  });

  it('should copy attributes from img to figure tag', function () {
    md = Md().use(attrs).use(implicitFigures, { copyAttrs: '^class$' });
    let src = '![caption](fig.png){.cls attr=val}';
    let expected = '<figure class="cls"><img src="fig.png" alt="caption" class="cls" attr="val"></figure>\n';
    let res = md.render(src);
    assert.equal(res, expected);
  });

});