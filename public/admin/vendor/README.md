# Self-hosted Decap CMS

Version: 3.16.3 (same release previously loaded from unpkg).

Source archive: https://registry.npmjs.org/decap-cms/-/decap-cms-3.16.3.tgz

Archive integrity (verified before extraction):

`sha512-hf+dPlCh7TJmWl8+6VRzHYOWhri5xgUknrZbDewaWe4s9B7xJ8PQugp2QHeSldMUKzav6+z0oIpwUYhUJDYtYw==`

Bundle SHA-256:

`7c1efd6b616b4786e279aeef194dd21649a72058d3bc8d1f78901b574610dfb8`

The script is an unmodified copy of package/dist/decap-cms.js.
Bundled third-party notices are in decap-cms.js.LICENSE.txt, whose filename is referenced by the script.
Decap CMS is MIT licensed: https://github.com/decaporg/decap-cms/blob/decap-cms%403.16.3/LICENSE (included as LICENSE)

Astro copies these static files into the deployment. No build-time or browser-time CDN fetch is needed.

To update: download a reviewed exact release from the npm registry, verify the archive against its published SHA-512 integrity, extract its prebuilt script and notices, and update the versioned filename, admin script reference, and checksums here. Keep upstream license notices. Run npm run build and verify login, editing, image uploads, and previews before deployment. Do not fetch an unpinned latest release during builds.
