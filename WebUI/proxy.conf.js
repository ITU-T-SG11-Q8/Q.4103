const PROXY_CONFIG = [
    // {
    //     context: [
    //         "/homs",
    //         "/api/HybridOverlayRemoval",
    //         "/api/InitData"
    //     ],
    //     target: "http://127.0.0.1:8081",
    //     secure: false,
    //     logLevel: "debug",
    //     changeOrigin: false
    // },
    {
        context: [
            "/api/InitData",
            "/api/OverlayCostMap",
            "/api/Mobile/Network",
            "/api/Mobile/IoT"
        ],
        //target: "http://127.0.0.1:8091",
        target: "https://127.0.0.1:1456", // GO 개발테스트용, 추후 삭제.
        secure: false,
        logLevel: "debug",
        changeOrigin: false
    }
]

module.exports = PROXY_CONFIG;
