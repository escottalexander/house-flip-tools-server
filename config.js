const env = process.env.NODE_ENV || 'development'

const DATABASE_URL = (
    process.env.DATABASE_URL ||
    global.DATABASE_URL ||
    'postgres://localhost/house-flip-tools-db'
);

const TEST_DATABASE_URL = (
    process.env.TEST_DATABASE_URL ||
    global.TEST_DATABASE_URL ||
    'postgres://localhost/house-flip-tools-test-db');

module.exports = {
    PORT: process.env.PORT || 8080,
    CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
    DATABASE_URL: env === 'test' ? TEST_DATABASE_URL : DATABASE_URL,
    SEQUELIZE_OPTIONS: { logging: env === 'test' ? false : console.log },
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRY: process.env.JWT_EXPIRY || '7d'
};
