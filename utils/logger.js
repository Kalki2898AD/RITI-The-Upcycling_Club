const logger = {
    info: function(message) {
        if (process.env.NODE_ENV !== 'production') {
            console.log(message);
        }
    },
    warn: function(message) {
        if (process.env.NODE_ENV !== 'production') {
            console.warn(message);
        }
    },
    error: function(message, error) {
        if (process.env.NODE_ENV !== 'production') {
            console.error(message, error);
        }
        // In production, you might want to send this to a logging service
    }
};

module.exports = logger;
