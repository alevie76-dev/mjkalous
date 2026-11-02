var isLocal = ['localhost', '127.0.0.1'].indexOf(location.hostname) !== -1;
CMS.init({
  config: {
    // Locally, `npm run cms` (decap-server) edits files on disk without logging in to GitHub.
    local_backend: isLocal,
    backend: { base_url: location.origin },
  },
});
CMS.registerPreviewStyle('/admin/preview.css');
// The default relation preview renders multiple values without separators.
var relationWidget = CMS.getWidget('relation');
CMS.registerWidget('relation', relationWidget.control, function (props) {
  var value = props.value;
  return Array.isArray(value) || (value && typeof value.join === 'function')
    ? value.join(', ')
    : value || null;
}, relationWidget.schema);
