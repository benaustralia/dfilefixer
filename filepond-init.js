// FilePond initialization. Depends on:
//   - global FilePond (loaded from CDN before this script)
//   - window.queueFile  (defined in index.html inline script)
//   - <input id="picker"> in the DOM
const pond = FilePond.create(document.getElementById("picker"), {
  allowMultiple: true,
  allowProcess: false,
  allowRevert: false,
  instantUpload: false,
  labelIdle: '<span class="drop-icons"><svg class="drop-icon icon-default" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M32 8 L32 36"/><path d="M22 26 L32 36 L42 26"/><path d="M10 40 L10 52 Q10 56 14 56 L50 56 Q54 56 54 52 L54 40"/></svg><svg class="drop-icon icon-success" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="26" stroke-width="4"/><path d="M19 33 L28 42 L46 23"/></svg></span>',
  credits: false,
  server: null,
  onaddfile: (err, fileItem) => {
    if (err) return;
    window.queueFile(fileItem.file);
  },
});
window._pond = pond;
