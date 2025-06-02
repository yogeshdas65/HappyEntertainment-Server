module.exports = {
    settings: {
        'import/resolver': {
            alias: {
                map: [
                    ['@controller', './src/controllers'],
                    ['@model', './src/models'],
                    ['@middleware', './src/middleware'],
                    ['@routes', './src/routes'],
                    ['@config', './src/config'],
                ],
                extensions: ['.js', '.jsx', '.ts', '.tsx'], // Add extensions as per your project
            },
        },
    },
};
