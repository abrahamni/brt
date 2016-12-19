APP.config = {

    //
    // Backend url (usually under the same domain as the client app)
    //
    apiUrl: '/api',


    //
    // Publicly accesable url of uploaded files.
    //
    publicFilesUrlPath: '/files',


    //
    // Name of the cookie where session token is stored.
    //
    sessionCookieName: 'ustka',


    //
    // Name of the cookie where language is stored.
    //
    langCookieName: 'langdpd',


    //
    // Default language for the app's interface.
    //
    defaultLanguage: 'en',


    //
    // Default Leaflet map settings.
    //
    mapDefaults: {
        center: [1, 1.2345],
        zoom: 5,
        scrollWheelZoom: false,
        zoomControl: false
    }

};
