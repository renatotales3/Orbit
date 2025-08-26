// Navigation module - delegates to Router
const Navigation = (() => {
    const init = () => {
        console.log('Navigation module initialized');
    };
    const switchTab = (tabId) => {
        if (typeof Router !== 'undefined') {
            Router.navigateToTab(tabId);
        }
    };
    return { init, switchTab };
})();
