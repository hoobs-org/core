module.exports = {
    configureWebpack: {
        performance: {
            hints: process.env.NODE_ENV === "production" ? false : "warning"
        }
    }
}
