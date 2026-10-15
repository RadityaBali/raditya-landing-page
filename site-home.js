/* Start with category exploration; reveal a catalog only after a user action. */
(() => {
    const url = new URL(location.href);
    if (url.searchParams.has('kategori')) {
        url.searchParams.delete('kategori');
        history.replaceState(null, '', url);
    }
})();
