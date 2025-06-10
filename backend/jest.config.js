module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/tests/**/*.test.js'],
    collectCoverage: true,
    coverageDirectory: './coverage',
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/server.js',
        '!src/infrastructure/database/seedIncidents.js'
    ],
    setupFiles: ['./tests/setup.js'],
    verbose: true,
    testTimeout: 10000,
    globals: {
        'ts-jest': {
            tsconfig: 'tsconfig.json'
        }
    },
    moduleFileExtensions: ['js', 'json'],
    transform: {},
    testPathIgnorePatterns: ['/node_modules/'],
    coveragePathIgnorePatterns: ['/node_modules/'],
    testEnvironmentOptions: {
        url: 'http://localhost:3001'
    }
}; 