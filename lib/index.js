'use strict';

/**
 * A `markdown-it` plugin for parsing image/video/audio/link references inside
 * markdown paragraphs without any other content as `<figure>`, `<video>`, `<audio>` elements.
 */

// from html5-media
// We can only detect video/audio files from the extension in the URL.
// We ignore MP1 and MP2 (not in active use) and default to video for ambiguous
// extensions (MPG, MP4)
const validAudioExtensions = ['aac', 'm4a', 'mp3', 'oga', 'ogg', 'wav'];
const validVideoExtensions = ['mp4', 'm4v', 'ogv', 'webm', 'mpg', 'mpeg'];

/**
 * A fork of the built-in image tokenizer which guesses video/audio files based
 * on their extension, and tokenizes them accordingly.
 * <markdown-it/lib/rules_inline/image.js>
 * From html5-media
 *
 * @param {Object} state
 *  Markdown-It state
 * @param {Boolean} silent
 *  if true, only validate, don't tokenize
 * @param {MarkdownIt} md
 *  instance of Markdown-It used for utility functions
 * @returns {Boolean}
 * @memberof HTML5Media
 */
function tokenizeImagesAndMedia(state, silent, md) {
  let attrs, code, content, label, labelEnd, labelStart, pos, ref, res, title,
    token, tokens, start;
  let href = '',
    oldPos = state.pos,
    max = state.posMax;

  // Exclamation mark followed by open square bracket - ![ - otherwise abort
  if (state.src.charCodeAt(state.pos) !== 0x21/* ! */) { return false; }
  if (state.src.charCodeAt(state.pos + 1) !== 0x5B/* [ */) { return false; }

  labelStart = state.pos + 2;
  labelEnd = state.md.helpers.parseLinkLabel(state, state.pos + 1, false);

  // Parser failed to find ']', so it's not a valid link
  if (labelEnd < 0) { return false; }

  pos = labelEnd + 1;
  if (pos < max && state.src.charCodeAt(pos) === 0x28 /* ( */) {
    //
    // Inline link
    //

    // [link](  <href>  "title"  )
    //        ^^ skipping these spaces
    pos++;
    for (; pos < max; pos++) {
      code = state.src.charCodeAt(pos);
      if (!md.utils.isSpace(code) && code !== 0x0A /* LF \n */) { break; }
    }
    if (pos >= max) { return false; }

    // [link](  <href>  "title"  )
    //          ^^^^^^ parsing link destination
    start = pos;
    res = state.md.helpers.parseLinkDestination(state.src, pos, state.posMax);
    if (res.ok) {
      href = state.md.normalizeLink(res.str);
      if (state.md.validateLink(href)) {
        pos = res.pos;
      } else {
        href = '';
      }
    }

    // [link](  <href>  "title"  )
    //                ^^ skipping these spaces
    start = pos;
    for (; pos < max; pos++) {
      code = state.src.charCodeAt(pos);
      if (!md.utils.isSpace(code) && code !== 0x0A /* LF \n */) { break; }
    }

    // [link](  <href>  "title"  )
    //                  ^^^^^^^ parsing link title
    res = state.md.helpers.parseLinkTitle(state.src, pos, state.posMax);
    if (pos < max && start !== pos && res.ok) {
      title = res.str;
      pos = res.pos;

      // [link](  <href>  "title"  )
      //                         ^^ skipping these spaces
      for (; pos < max; pos++) {
        code = state.src.charCodeAt(pos);
        if (!md.utils.isSpace(code) && code !== 0x0A)
          break;
      }
    } else {
      title = '';
    }

    // here goes link info string parsing, possibly in the future
    
    if (pos >= max || state.src.charCodeAt(pos) !== 0x29 /* ) */) {
      state.pos = oldPos;
      return false;
    }
    pos++;
  } else {
    //
    // Link reference
    //
    if (typeof state.env.references === 'undefined') { return false; }

    if (pos < max && state.src.charCodeAt(pos) === 0x5B /* [ */) {
      start = pos + 1;
      pos = state.md.helpers.parseLinkLabel(state, pos);
      if (pos >= 0) {
        label = state.src.slice(start, pos++);
      } else {
        pos = labelEnd + 1;
      }
    } else {
      pos = labelEnd + 1;
    }

    // covers label === '' and label === undefined
    // (collapsed reference link and shortcut reference link respectively)
    if (!label)
      label = state.src.slice(labelStart, labelEnd);

    ref = state.env.references[md.utils.normalizeReference(label)];
    if (!ref) {
      state.pos = oldPos;
      return false;
    }
    href = ref.href;
    title = ref.title;
  }

  //state.pos = pos; // not in upstream
  //state.posMax = max; // not in upstream

  //
  // We found the end of the link, and know for a fact it's a valid link;
  // so all that's left to do is to call tokenizer.
  //
  if (!silent) {
    content = state.src.slice(labelStart, labelEnd);

    state.md.inline.parse(
      content,
      state.md,
      state.env,
      tokens = []
    );

    // html5-media changes start here! ///////////////////////////////////////
    const mediaType = guessMediaType(href);
    const tag = (mediaType == 'image') ? 'img' : mediaType;

    token = state.push(mediaType, tag, 0);
    token.attrs = attrs = [
      ['src', href]
    ];
    if (mediaType == 'image')
      attrs.push(['alt', '']); // actual value is set in renderer.js
    // html5-media changes end here! /////////////////////////////////////////
    token.children = tokens;
    token.content = content;

    if (title) {
      attrs.push(['title', title]);
    }
  }
  
  state.pos = pos;
  state.posMax = max;
  return true;
}

/**
 * Guess the media type represented by a URL based on the file extension,
 * if any
 *
 * @param {String} url
 *  any valid URL
 * @returns {String}
 *  a type identifier: 'image' (default for all unrecognized URLs), 'audio'
 *  or 'video'
 */
function guessMediaType(url) {
  const extensionMatch = url.match(/\.([^/.]+)(?:\?.*)?(?:#.*)?$/);
  if (extensionMatch === null)
    return 'image';
  const extension = extensionMatch[1];
  if (validAudioExtensions.indexOf(extension.toLowerCase()) != -1)
    return 'audio';
  else if (validVideoExtensions.indexOf(extension.toLowerCase()) != -1)
    return 'video';
  else
    return 'image';
}

/**
 * Render tokens of the video/audio type to HTML5 tags
 *
 * @param {Object} tokens
 *  token stream
 * @param {Number} idx
 *  which token are we rendering
 * @param {Object} options
 *  Markdown-It options, including this plugin's settings
 * @param {Object} env
 *  Markdown-It environment, potentially including language setting
 * @param {MarkdownIt} md
 *  instance used for utilities access
 * @returns {String}
 *  rendered token
 */
function renderMedia(tokens, idx, options, env, md) {
  const token = tokens[idx];
  const type = token.type;
  if (type !== 'video' && type !== 'audio')
    return '';
  let attrs = options.html5Media[`${type}Attrs`].trim();
  if (attrs)
    attrs = ' ' + attrs;

  // We'll always have a URL for non-image media: they are detected by URL
  const url = token.attrs[token.attrIndex('src')][1];

  // Title is set like this: ![descriptive text](video.mp4 "title")
  const title = token.attrIndex('title') != -1 ?
    ` title="${md.utils.escapeHtml(token.attrs[token.attrIndex('title')][1])}"` :
    '';

  const fallbackText =
    translate(env.language, `html5 ${type} not supported`) + '\n' +
    translate(env.language, 'html5 media fallback link', [url]);

  const description = token.content ?
    '\n' + translate(env.language, 'html5 media description', [md.utils.escapeHtml(token.content)]) :
    '';

  return `<${type} src="${url}"${title}${attrs}>\n` +
    `${fallbackText}${description}\n` +
    `</${type}>`;
}

/**
 * The main plugin function, exported as module.exports
 *
 * @param {MarkdownIt} md
 *  instance, automatically passed by md.use
 * @param {Object} [options]
 *  configuration
 * @param {String} [options.videoAttrs='controls class="html5-video-player"']
 *  attributes to include inside `<video>` tags
 * @param {String} [options.audioAttrs='controls class="html5-audio-player"']
 *  attributes to include inside `<audio>` tags
 */
function specialParagraphsPlugin(md, options) {
  options = options || {};

  const videoAttrs = options.videoAttrs !== undefined ?
    options.videoAttrs :
    'controls class="html5-video-player"';
  const audioAttrs = options.audioAttrs !== undefined ?
    options.audioAttrs :
    'controls class="html5-audio-player"';

  function specialParagraphs(state) {
    // reset tabIndex on md.render()
    var tabIndex = 1;

    // do not process first and last token
    for (var i=1, l=state.tokens.length; i < (l - 1); ++i) {
      var token = state.tokens[i];

      if (token.type !== 'inline') { continue; }
      // children: image alone, or link_open -> image -> link_close
      if (!token.children || (token.children.length !== 1 && token.children.length !== 3)) { continue; }
      // one child, should be img **or link**
      if (token.children.length === 1 && token.children[0].type !== 'image') { continue; }
      // three children, should be image enclosed in link
      if (token.children.length === 3 &&
          (token.children[0].type !== 'link_open' ||
           token.children[1].type !== 'image' ||
           token.children[2].type !== 'link_close')) {
        continue;
      }
      // prev token is paragraph open
      if (i !== 0 && state.tokens[i - 1].type !== 'paragraph_open') { continue; }
      // next token is paragraph close
      if (i !== (l - 1) && state.tokens[i + 1].type !== 'paragraph_close') { continue; }

      // We have inline token containing an image only.
      // Previous token is paragraph open.
      // Next token is paragraph close.
      // Lets replace the paragraph tokens with figure tokens.
      var figure = state.tokens[i - 1];
      figure.type = 'figure_open';
      figure.tag = 'figure';
      state.tokens[i + 1].type = 'figure_close';
      state.tokens[i + 1].tag = 'figure';

      if (options.dataType == true) {
        state.tokens[i - 1].attrPush(['data-type', 'image']);
      }
      var image;

      if (options.link == true && token.children.length === 1) {
        image = token.children[0];
        token.children.unshift(
          new state.Token('link_open', 'a', 1)
        );
        token.children[0].attrPush(['href', image.attrGet('src')]);
        token.children.push(
          new state.Token('link_close', 'a', -1)
        );
      }

      // for linked images, image is one off
      image = token.children.length === 1 ? token.children[0] : token.children[1];

      if (options.figcaption == true) {
        if (image.children && image.children.length) {
          token.children.push(
            new state.Token('figcaption_open', 'figcaption', 1)
            );
          token.children.splice(token.children.length, 0, ...image.children);
          token.children.push(
            new state.Token('figcaption_close', 'figcaption', -1)
            );
        }
      }

      if (options.copyAttrs && image.attrs) {
        const f = options.copyAttrs === true ? '' : options.copyAttrs
        figure.attrs = image.attrs.filter(([k,v]) => k.match(f))
      }

      if (options.tabindex == true) {
        // add a tabindex property
        // you could use this with css-tricks.com/expanding-images-html5
        state.tokens[i - 1].attrPush(['tabindex', tabIndex]);
        tabIndex++;
      }
    }
  }

  md.core.ruler.before('linkify', 'special_paragraphs', specialParagraphs);

  // from html5-media:
  md.inline.ruler.at('image', (tokens, silent) => tokenizeImagesAndMedia(tokens, silent, md));

  md.renderer.rules.video = md.renderer.rules.audio =
    (tokens, idx, opt, env) => {
      opt.html5Media = {
        videoAttrs,
        audioAttrs
      };
      return renderMedia(tokens, idx, opt, env, md);
    };

};

module.exports = {
  specialParagraphsPlugin
};
