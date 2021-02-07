clips.extend('Watch::Series::Details', (root) => {
  root.appendChild(root.createComponent('Text', {}, 'Hello world!'));
  root.mount();
});
