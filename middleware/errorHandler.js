function errorHandler(err, req, res, next) {
    console.error('Error occurred:', err);
    
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({
            error: 'Invalid JSON',
            message: 'The request contains invalid JSON'
        });
    }
    
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'production' 
            ? 'Something went wrong. Please try again later.' 
            : err.message
    });
}

module.exports = errorHandler;