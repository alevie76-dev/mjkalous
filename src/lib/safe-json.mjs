// JSON embedded in a script element must not contain an HTML closing tag.
export function safeJson(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}
