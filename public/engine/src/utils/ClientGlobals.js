class ClientGlobals {
    static init() {
        const ua = navigator.userAgent;
        
        window.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
        window.isDesktop = !window.isMobile;
        window.isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
        window.isAndroid = /Android/.test(ua);
    }
}

ClientGlobals.init();